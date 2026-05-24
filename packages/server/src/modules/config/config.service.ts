import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

export interface AppConfig {
  defaultMaxSlots: number;
  bookingRangeDays: number;
  restDaysOfWeek: number[];
  extraRestDates: string[];
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
      bookingRangeDays: Number(map.booking_range_days ?? 30),
      restDaysOfWeek: JSON.parse(map.rest_days_of_week ?? '[0]'),
      extraRestDates: JSON.parse(map.extra_rest_dates ?? '[]'),
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
    if (partial.bookingRangeDays !== undefined) {
      await this.prisma.config.upsert({
        where: { key: 'booking_range_days' },
        create: { key: 'booking_range_days', value: String(partial.bookingRangeDays) },
        update: { value: String(partial.bookingRangeDays) },
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
