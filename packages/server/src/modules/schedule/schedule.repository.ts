import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDate(date: string) {
    return this.prisma.schedule.findUnique({
      where: { date: new Date(date) },
    });
  }

  async upsert(date: string, maxSlots: number, status = 0) {
    return this.prisma.schedule.upsert({
      where: { date: new Date(date) },
      create: { date: new Date(date), maxSlots, status },
      update: { maxSlots, status },
    });
  }
}
