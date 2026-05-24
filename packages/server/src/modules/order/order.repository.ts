import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdempotencyKey(key: string) {
    return this.prisma.order.findUnique({ where: { idempotencyKey: key } });
  }

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({ data });
  }

  async findByOrderNo(orderNo: string) {
    return this.prisma.order.findUnique({ where: { orderNo } });
  }

  async findAll(params: { status?: number; skip?: number; take?: number }) {
    const where: Prisma.OrderWhereInput = {};
    if (params.status !== undefined) where.status = params.status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }
}
