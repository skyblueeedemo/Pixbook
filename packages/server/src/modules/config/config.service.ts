import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

export interface AppConfig {
  defaultMaxSlots: number;
  bookingDays: number;
  restDaysOfWeek: number[];
  extraRestDates: string[];
  extraWorkDates: string[];
}

@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getConfig(): Promise<AppConfig> {
    const rows = await this.prisma.config.findMany();
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));

    return {
      defaultMaxSlots: Number(map.default_max_slots ?? 5),
      bookingDays: Number(map.booking_days ?? 30),
      restDaysOfWeek: JSON.parse(map.rest_days_of_week ?? '[0]'),
      extraRestDates: JSON.parse(map.extra_rest_dates ?? '[]'),
      extraWorkDates: JSON.parse(map.extra_work_dates ?? '[]'),
    };
  }

  async updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
    if (partial.defaultMaxSlots !== undefined) {
      await this.prisma.config.upsert({
        where: { key: 'default_max_slots' },
        create: { key: 'default_max_slots', value: String(partial.defaultMaxSlots) },
        update: { value: String(partial.defaultMaxSlots) },
      });
    }
    if (partial.bookingDays !== undefined) {
      await this.prisma.config.upsert({
        where: { key: 'booking_days' },
        create: { key: 'booking_days', value: String(partial.bookingDays) },
        update: { value: String(partial.bookingDays) },
      });
    }
    if (partial.restDaysOfWeek !== undefined) {
      await this.prisma.config.upsert({
        where: { key: 'rest_days_of_week' },
        create: { key: 'rest_days_of_week', value: JSON.stringify(partial.restDaysOfWeek) },
        update: { value: JSON.stringify(partial.restDaysOfWeek) },
      });
    }
    if (partial.extraRestDates !== undefined) {
      await this.prisma.config.upsert({
        where: { key: 'extra_rest_dates' },
        create: { key: 'extra_rest_dates', value: JSON.stringify(partial.extraRestDates) },
        update: { value: JSON.stringify(partial.extraRestDates) },
      });
    }
    if (partial.extraWorkDates !== undefined) {
      await this.prisma.config.upsert({
        where: { key: 'extra_work_dates' },
        create: { key: 'extra_work_dates', value: JSON.stringify(partial.extraWorkDates) },
        update: { value: JSON.stringify(partial.extraWorkDates) },
      });
    }

    // Invalidate calendar cache
    await this.invalidateCache();

    return this.getConfig();
  }

  private async invalidateCache(): Promise<void> {
    if (!(await this.redis.isAvailable())) return;
    const keys = await this.redis.client.keys('calendar:*');
    if (keys.length) await this.redis.client.del(...keys);
  }
}
