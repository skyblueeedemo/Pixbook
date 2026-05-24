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
          date: { gte: start.toDate(), lte: start.add(days - 1, 'day').toDate() },
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

  private async loadConfigs() {
    const rows = await this.prisma.config.findMany();
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));
    return map;
  }
}
