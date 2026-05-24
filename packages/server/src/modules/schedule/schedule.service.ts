import { Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

export type SlotStatus = 'available' | 'almost_full' | 'full' | 'unavailable';

export interface DayStatus {
  date: string;
  status: SlotStatus;
  availableSlots: number;
  maxSlots: number;
  version: number;
}

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private readonly CACHE_TTL = 60; // seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Generate calendar data for the next N days.
   * References Easy!Appointments availability generation algorithm —
   * check working plan, subtract existing bookings, map to status enum.
   */
  async getCalendar(startDate?: string, days = 30): Promise<DayStatus[]> {
    const start = startDate ? dayjs(startDate) : dayjs().add(1, 'day');
    const cacheKey = `calendar:${start.format('YYYY-MM-DD')}:${days}`;

    // ── Try Redis cache ────────────────────────────────
    if (await this.redis.isAvailable()) {
      const cached = await this.redis.client.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    // ── Build calendar ─────────────────────────────────
    const [configs, schedules] = await Promise.all([
      this.loadConfigs(),
      this.prisma.schedule.findMany({
        where: {
          date: {
            gte: new Date(start.format('YYYY-MM-DD') + 'T00:00:00.000Z'),
            lte: new Date(start.add(days - 1, 'day').format('YYYY-MM-DD') + 'T00:00:00.000Z'),
          },
        },
      }),
    ]);

    const scheduleMap = new Map(schedules.map((s) => [dayjs(s.date).format('YYYY-MM-DD'), s]));
    const nonCancelStatuses = [0, 1, 2, 3]; // all except '已取消' (4)

    const result: DayStatus[] = [];

    for (let i = 0; i < days; i++) {
      const date = start.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');

      // ── Rest day check ──────────────────────────────
      const restDays: number[] = JSON.parse(configs.rest_days_of_week || '[0]');
      const extraRest: string[] = JSON.parse(configs.extra_rest_dates || '[]');
      const isRest = restDays.includes(date.day()) || extraRest.includes(dateStr);

      if (isRest) {
        result.push({ date: dateStr, status: 'unavailable', availableSlots: 0, maxSlots: 0, version: 0 });
        continue;
      }

      // ── Calculate availability ──────────────────────
      const schedule = scheduleMap.get(dateStr);
      const maxSlots = schedule?.maxSlots ?? Number(configs.default_max_slots || 5);

      const bookedCount = schedule
        ? await this.prisma.order.count({
            where: {
              scheduleDate: schedule.date,
              status: { in: nonCancelStatuses },
            },
          })
        : 0;

      const available = maxSlots - bookedCount;

      let status: SlotStatus;
      if (available <= 0) status = 'full';
      else if (available === 1) status = 'almost_full';
      else status = 'available';

      result.push({
        date: dateStr,
        status,
        availableSlots: available,
        maxSlots,
        version: schedule?.version ?? 0,
      });
    }

    // ── Cache result ──────────────────────────────────
    if (await this.redis.isAvailable()) {
      await this.redis.client.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    }

    return result;
  }

  /** Invalidate calendar cache (called after config change / order submit) */
  async invalidateCache(): Promise<void> {
    if (!(await this.redis.isAvailable())) return;
    const keys = await this.redis.client.keys('calendar:*');
    if (keys.length) await this.redis.client.del(...keys);
  }

  /** Admin: get full month calendar with booking details */
  async getAdminCalendar(month?: string): Promise<any[]> {
    const m = month ? dayjs(month) : dayjs();
    const start = m.startOf('month');
    const daysInMonth = m.daysInMonth();

    const [schedules, orders, configs] = await Promise.all([
      this.prisma.schedule.findMany({
        where: {
          date: {
            gte: new Date(start.format('YYYY-MM-DD') + 'T00:00:00.000Z'),
            lte: new Date(start.add(daysInMonth - 1, 'day').format('YYYY-MM-DD') + 'T00:00:00.000Z'),
          },
        },
      }),
      this.prisma.order.findMany({
        where: {
          scheduleDate: {
            gte: new Date(start.format('YYYY-MM-DD') + 'T00:00:00.000Z'),
            lte: new Date(start.add(daysInMonth - 1, 'day').format('YYYY-MM-DD') + 'T00:00:00.000Z'),
          },
          status: { not: 4 },
        },
        select: { scheduleDate: true, customerName: true, status: true, photoCount: true, orderNo: true },
      }),
      this.loadConfigs(),
    ]);

    const scheduleMap = new Map(schedules.map((s) => [dayjs(s.date).format('YYYY-MM-DD'), s]));
    const orderMap = new Map<string, any[]>();
    orders.forEach((o) => {
      const d = dayjs(o.scheduleDate).format('YYYY-MM-DD');
      if (!orderMap.has(d)) orderMap.set(d, []);
      orderMap.get(d)!.push(o);
    });

    const restDays: number[] = JSON.parse(configs.rest_days_of_week || '[0]');
    const extraRest: string[] = JSON.parse(configs.extra_rest_dates || '[]');

    const result: any[] = [];
    for (let i = 0; i < daysInMonth; i++) {
      const d = start.add(i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const isRest = restDays.includes(d.day()) || extraRest.includes(dateStr);
      const schedule = scheduleMap.get(dateStr);
      const dayOrders = orderMap.get(dateStr) || [];

      result.push({
        date: dateStr,
        weekday: d.day(),
        isRestDay: isRest,
        maxSlots: schedule?.maxSlots ?? Number(configs.default_max_slots || 5),
        bookedSlots: schedule?.bookedSlots ?? 0,
        version: schedule?.version ?? 0,
        orders: dayOrders.map((o) => ({ orderNo: o.orderNo, customerName: o.customerName, status: o.status, photoCount: o.photoCount })),
      });
    }

    return result;
  }

  /** Admin: update a single date (max_slots override or rest day) */
  async updateDate(dateStr: string, body: { maxSlots?: number; isRestDay?: boolean }): Promise<void> {
    const date = new Date(dateStr + 'T00:00:00.000Z');

    if (body.isRestDay !== undefined) {
      // Toggle extra_rest_dates
      const configs = await this.loadConfigs();
      const extraRest: string[] = JSON.parse(configs.extra_rest_dates || '[]');
      if (body.isRestDay && !extraRest.includes(dateStr)) {
        extraRest.push(dateStr);
      } else if (!body.isRestDay) {
        const idx = extraRest.indexOf(dateStr);
        if (idx >= 0) extraRest.splice(idx, 1);
      }
      await this.prisma.config.upsert({
        where: { key: 'extra_rest_dates' },
        create: { key: 'extra_rest_dates', value: JSON.stringify(extraRest) },
        update: { value: JSON.stringify(extraRest) },
      });
    }

    if (body.maxSlots !== undefined) {
      await this.prisma.$executeRaw`
        INSERT INTO schedules (date, max_slots, booked_slots, version, created_at, updated_at)
        VALUES (${date}, ${body.maxSlots}, 0, 0, NOW(), NOW())
        ON DUPLICATE KEY UPDATE max_slots = ${body.maxSlots}, updated_at = NOW()
      `;
    }

    await this.invalidateCache();
  }

  private async loadConfigs() {
    const rows = await this.prisma.config.findMany();
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));
    return map;
  }
}
