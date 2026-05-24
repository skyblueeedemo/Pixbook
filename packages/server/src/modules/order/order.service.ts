import { Injectable, HttpException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateOrderDto } from './order.dto';

/**
 * Order status enum — matches PRD §7.3 state flow.
 */
export const OrderStatus = {
  PENDING: 0,      // 待确认
  PROCESSING: 1,    // 修图中
  DELIVERING: 2,    // 待交付
  COMPLETED: 3,     // 已完成
  CANCELLED: 4,     // 已取消
} as const;

export const OrderStatusLabel: Record<number, string> = {
  0: '待确认',
  1: '修图中',
  2: '待交付',
  3: '已完成',
  4: '已取消',
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Submit a booking order with optimistic locking.
   *
   * Core anti-oversell logic (PRD §3.4):
   * 1. Idempotency check
   * 2. Optimistic lock UPDATE on schedules
   * 3. Auto-retry once on conflict
   * 4. Create order record
   */
  async submit(dto: CreateOrderDto) {
    // ── 1. Idempotency check ──────────────────────────
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      return { code: 1005, message: '重复请求', data: { orderId: existing.orderNo } };
    }

    // ── 2. Check duplicate (same phone + same date) ────
    const dup = await this.prisma.order.findFirst({
      where: {
        customerPhone: dto.customerPhone,
        scheduleDate: new Date(dto.scheduleDate),
        status: { not: OrderStatus.CANCELLED },
      },
    });
    if (dup) {
      throw new HttpException(
        { code: 1003, message: '您已预约该日期，如需修改请联系修图师' },
        409,
      );
    }

    // ── 3. Ensure schedule row exists ────────────────
    await this.prisma.$executeRaw`
      INSERT IGNORE INTO schedules (date, max_slots, booked_slots, version, created_at, updated_at)
      VALUES (${new Date(dto.scheduleDate)}, (
        SELECT COALESCE(CAST(value AS UNSIGNED), 5) FROM config WHERE \`key\` = 'default_max_slots'
      ), 0, 0, NOW(), NOW())
    `;

    // ── 4. Optimistic lock with 1 retry ───────────────
    const maxRetries = 2;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const updated = await this.prisma.$executeRaw`
        UPDATE schedules
        SET booked_slots = booked_slots + 1,
            version      = version + 1
        WHERE date         = ${new Date(dto.scheduleDate)}
          AND version      = ${dto.expectedVersion}
          AND booked_slots < max_slots
      `;

      if (updated > 0) {
        // ── 4. Create order ────────────────────────────
        const orderNo = this.generateOrderNo(dto.scheduleDate);

        const order = await this.prisma.order.create({
          data: {
            orderNo,
            customerName: dto.customerName,
            customerPhone: dto.customerPhone,
            scheduleDate: new Date(dto.scheduleDate),
            photoCount: dto.photoCount,
            requirements: dto.requirements,
            additionalNotes: dto.additionalNotes ?? null,
            status: OrderStatus.PENDING,
            idempotencyKey: dto.idempotencyKey,
          },
        });

        // ── Invalidate calendar cache ──────────────────
        await this.invalidateCache();

        return {
          code: 0,
          message: '预约成功',
          data: {
            orderId: orderNo,
            scheduleDate: dto.scheduleDate,
            customerName: dto.customerName,
            photoCount: dto.photoCount,
            createdAt: order.createdAt,
          },
        };
      }

      // Conflict — retry once with fresh version
      if (attempt === 0) {
        const fresh = await this.prisma.schedule.findUnique({
          where: { date: new Date(dto.scheduleDate) },
        });
        if (fresh) {
          dto.expectedVersion = fresh.version;
        }
        this.logger.warn(`Optimistic lock conflict for ${dto.scheduleDate}, retrying...`);
      }
    }

    // All retries exhausted
    throw new HttpException(
      { code: 1001, message: '该日期名额刚刚被约满，日历已刷新，请重新选择' },
      409,
    );
  }

  /** Query order by name + (phone | orderId) */
  async query(customerName: string, phone?: string, orderId?: string) {
    if (!phone && !orderId) {
      throw new HttpException({ code: 1004, message: '请提供手机号或订单号' }, 400);
    }

    const where: any = { customerName };

    if (orderId) {
      where.orderNo = orderId;
    }
    if (phone) {
      where.customerPhone = phone;
    }

    const order = await this.prisma.order.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      throw new HttpException({ code: 1004, message: '订单不存在或信息不匹配' }, 404);
    }

    return {
      code: 0,
      data: {
        orderId: order.orderNo,
        scheduleDate: order.scheduleDate,
        photoCount: order.photoCount,
        status: order.status,
        statusLabel: OrderStatusLabel[order.status],
        createdAt: order.createdAt,
      },
    };
  }

  /** Admin: update order status (PRD §7.2 state flow) */
  async updateStatus(orderId: string, newStatus: number) {
    const order = await this.prisma.order.findUnique({ where: { orderNo: orderId } });
    if (!order) throw new HttpException({ code: 1004, message: '订单不存在' }, 404);

    const prevStatus = order.status;

    const updated = await this.prisma.order.update({
      where: { orderNo: orderId },
      data: { status: newStatus },
    });

    // If cancelling, release the slot
    if (newStatus === OrderStatus.CANCELLED && prevStatus !== OrderStatus.CANCELLED) {
      await this.prisma.$executeRaw`
        UPDATE schedules
        SET booked_slots = GREATEST(booked_slots - 1, 0),
            version      = version + 1
        WHERE date = ${order.scheduleDate}
      `;
      await this.invalidateCache();
    }

    return { code: 0, message: '状态更新成功', data: { status: newStatus, statusLabel: OrderStatusLabel[newStatus] } };
  }

  // ─── Helpers ─────────────────────────────────────────

  private generateOrderNo(dateStr: string): string {
    const date = dateStr.replace(/-/g, '');
    const seq = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD${date}${seq}`;
  }

  private async invalidateCache(): Promise<void> {
    if (!(await this.redis.isAvailable())) return;
    const keys = await this.redis.client.keys('calendar:*');
    if (keys.length) await this.redis.client.del(...keys);
  }
}
