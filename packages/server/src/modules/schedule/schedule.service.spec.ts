import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: {
    config: { findMany: jest.Mock };
    schedule: { findMany: jest.Mock };
    order: { count: jest.Mock };
  };
  let redis: { isAvailable: jest.Mock; client: { get: jest.Mock; setex: jest.Mock; keys: jest.Mock; del: jest.Mock } };

  const mockConfigs = [
    { key: 'default_max_slots', value: '5' },
    { key: 'booking_days', value: '30' },
    { key: 'rest_days_of_week', value: '[0]' },         // Sunday rest
    { key: 'extra_rest_dates', value: '["2026-06-15"]' }, // extra rest
  ];

  beforeEach(async () => {
    prisma = {
      config: { findMany: jest.fn().mockResolvedValue(mockConfigs) },
      schedule: { findMany: jest.fn().mockResolvedValue([]) },
      order: { count: jest.fn().mockResolvedValue(0) },
    };

    redis = {
      isAvailable: jest.fn().mockResolvedValue(false),
      client: { get: jest.fn(), setex: jest.fn(), keys: jest.fn().mockResolvedValue([]), del: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  // ─────────────────────────────────────────────────────
  describe('getCalendar — basic', () => {
    it('should return N days starting from startDate', async () => {
      const result = await service.getCalendar('2026-06-01', 3);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2026-06-01');
      expect(result[2].date).toBe('2026-06-03');
    });

    it('should mark days as available when no bookings exist', async () => {
      const result = await service.getCalendar('2026-06-01', 1);

      expect(result[0].status).toBe('available');
      expect(result[0].availableSlots).toBe(5); // defaultMaxSlots
      expect(result[0].maxSlots).toBe(5);
    });
  });

  // ─────────────────────────────────────────────────────
  describe('getCalendar — rest days', () => {
    it('should mark Sunday as unavailable (rest_days_of_week=[0])', async () => {
      // 2026-06-07 is a Sunday
      const result = await service.getCalendar('2026-06-07', 1);

      expect(result[0].status).toBe('unavailable');
      expect(result[0].availableSlots).toBe(0);
    });

    it('should mark extra rest dates as unavailable', async () => {
      const result = await service.getCalendar('2026-06-15', 1);

      expect(result[0].status).toBe('unavailable');
    });

    it('should mark non-rest days as available', async () => {
      // Monday 2026-06-01
      const result = await service.getCalendar('2026-06-01', 1);

      expect(result[0].status).toBe('available');
    });
  });

  // ─────────────────────────────────────────────────────
  describe('getCalendar — slot calculation', () => {
    it('should show reduced slots when bookings exist', async () => {
      // mock: schedule with 2 booked, 5 max
      prisma.schedule.findMany.mockResolvedValue([
        {
          date: new Date('2026-06-01T00:00:00.000Z'),
          maxSlots: 5,
          bookedSlots: 2,
          version: 2,
        },
      ]);

      // mock: 2 active orders
      prisma.order.count.mockResolvedValue(2);

      const result = await service.getCalendar('2026-06-01', 1);

      expect(result[0].availableSlots).toBe(3); // 5 - 2
      expect(result[0].version).toBe(2);
    });

    it('should show "almost_full" when 1 slot left', async () => {
      prisma.schedule.findMany.mockResolvedValue([
        {
          date: new Date('2026-06-01T00:00:00.000Z'),
          maxSlots: 5,
          bookedSlots: 4,
          version: 4,
        },
      ]);
      prisma.order.count.mockResolvedValue(4);

      const result = await service.getCalendar('2026-06-01', 1);

      expect(result[0].status).toBe('almost_full');
      expect(result[0].availableSlots).toBe(1);
    });

    it('should show "full" when no slots left', async () => {
      prisma.schedule.findMany.mockResolvedValue([
        {
          date: new Date('2026-06-01T00:00:00.000Z'),
          maxSlots: 5,
          bookedSlots: 5,
          version: 5,
        },
      ]);
      prisma.order.count.mockResolvedValue(5);

      const result = await service.getCalendar('2026-06-01', 1);

      expect(result[0].status).toBe('full');
      expect(result[0].availableSlots).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────
  describe('getCalendar — Redis cache', () => {
    it('should return cached data when available', async () => {
      redis.isAvailable.mockResolvedValue(true);
      redis.client.get.mockResolvedValue(JSON.stringify([
        { date: '2026-06-01', status: 'available', availableSlots: 3, maxSlots: 5, version: 2 },
      ]));

      const result = await service.getCalendar('2026-06-01', 1);

      expect(result).toHaveLength(1);
      expect(result[0].availableSlots).toBe(3);
      // Should NOT query DB
      expect(prisma.schedule.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and cache when no cached data', async () => {
      redis.isAvailable.mockResolvedValue(true);
      redis.client.get.mockResolvedValue(null); // cache miss

      const result = await service.getCalendar('2026-06-01', 1);

      expect(prisma.schedule.findMany).toHaveBeenCalledTimes(1);
      expect(redis.client.setex).toHaveBeenCalledTimes(1);
    });
  });
});
