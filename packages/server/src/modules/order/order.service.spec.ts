import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { OrderService, OrderStatus } from './order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateOrderDto } from './order.dto';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: {
    order: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    schedule: {
      findUnique: jest.Mock;
    };
    $executeRaw: jest.Mock;
  };
  let redis: { isAvailable: jest.Mock; client: { keys: jest.Mock; del: jest.Mock } };

  const baseDto = (overrides: Partial<CreateOrderDto> = {}): CreateOrderDto => ({
    scheduleDate: '2026-06-01',
    customerName: '张三',
    customerPhone: '13800000001',
    photoCount: 10,
    requirements: '人像精修，保留自然感，磨皮适度处理',
    expectedVersion: 0,
    idempotencyKey: 'test-key-001',
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      schedule: {
        findUnique: jest.fn(),
      },
      $executeRaw: jest.fn(),
    };

    redis = {
      isAvailable: jest.fn().mockResolvedValue(false), // disable Redis in tests
      client: { keys: jest.fn().mockResolvedValue([]), del: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  // ─────────────────────────────────────────────────────
  // Happy path
  // ─────────────────────────────────────────────────────
  describe('submit — happy path', () => {
    it('should create an order on first attempt', async () => {
      prisma.$executeRaw
        .mockResolvedValueOnce(1) // INSERT IGNORE
        .mockResolvedValueOnce(1); // UPDATE succeeds
      prisma.order.create.mockResolvedValue({
        orderNo: 'ORD20260601001',
        idempotencyKey: 'test-key-001',
        createdAt: new Date(),
      });

      const result = await service.submit(baseDto());

      expect(result.code).toBe(0);
      expect(result.data!.orderId).toMatch(/^ORD/);
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
      expect(prisma.order.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────
  // Idempotency
  // ─────────────────────────────────────────────────────
  describe('submit — idempotency', () => {
    it('should return existing order for duplicate idempotency key', async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        orderNo: 'ORD20260601001',
        idempotencyKey: 'test-key-001',
      });

      const result = await service.submit(baseDto());

      expect(result.code).toBe(1005);
      expect(result.data!.orderId).toBe('ORD20260601001');
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────
  // Duplicate phone same date
  // ─────────────────────────────────────────────────────
  describe('submit — duplicate phone', () => {
    it('should reject same phone on same date', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      prisma.order.findFirst.mockResolvedValue({ orderNo: 'EXISTING' });

      await expect(service.submit(baseDto())).rejects.toMatchObject({
        response: { code: 1003 },
      });
    });
  });

  // ─────────────────────────────────────────────────────
  // Optimistic lock — conflict then retry
  // ─────────────────────────────────────────────────────
  describe('submit — optimistic lock retry', () => {
    it('should retry once on version conflict and succeed', async () => {
      // INSERT IGNORE succeeds
      prisma.$executeRaw
        .mockResolvedValueOnce(1) // INSERT IGNORE
        .mockResolvedValueOnce(0) // first UPDATE fails (version mismatch)
        .mockResolvedValueOnce(1); // retry UPDATE succeeds

      prisma.schedule.findUnique.mockResolvedValueOnce({ version: 2 });

      prisma.order.create.mockResolvedValue({
        orderNo: 'ORD20260601002',
        idempotencyKey: 'test-key-002',
        createdAt: new Date(),
      });

      const result = await service.submit(
        baseDto({ expectedVersion: 1, idempotencyKey: 'test-key-002' }),
      );

      expect(result.code).toBe(0);
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(3); // INSERT + UPDATE-fail + UPDATE-success
    });

    it('should fail after both attempts exhausted', async () => {
      prisma.$executeRaw
        .mockResolvedValueOnce(1) // INSERT IGNORE
        .mockResolvedValueOnce(0) // first UPDATE fails
        .mockResolvedValueOnce(0); // retry UPDATE also fails

      prisma.schedule.findUnique.mockResolvedValueOnce({ version: 3 });

      await expect(
        service.submit(baseDto({ expectedVersion: 1, idempotencyKey: 'test-key-003' })),
      ).rejects.toMatchObject({
        response: { code: 1001 },
      });
    });
  });

  // ─────────────────────────────────────────────────────
  // Full capacity rejection
  // ─────────────────────────────────────────────────────
  describe('submit — full capacity', () => {
    it('should reject when slots are exhausted', async () => {
      // Both attempts return 0 (booked_slots = max_slots)
      prisma.$executeRaw
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.schedule.findUnique.mockResolvedValueOnce({ version: 5 });

      await expect(
        service.submit(baseDto({ expectedVersion: 4, idempotencyKey: 'test-key-full' })),
      ).rejects.toMatchObject({
        response: { code: 1001 },
      });
    });
  });

  // ─────────────────────────────────────────────────────
  // Cancel releases slot
  // ─────────────────────────────────────────────────────
  describe('updateStatus — cancel', () => {
    it('should release a slot when order is cancelled', async () => {
      prisma.order.findUnique.mockResolvedValue({
        orderNo: 'ORD20260601001',
        scheduleDate: new Date('2026-06-01'),
        status: OrderStatus.PENDING,
      });
      prisma.order.update.mockResolvedValue({ orderNo: 'ORD20260601001', status: OrderStatus.CANCELLED });
      prisma.$executeRaw.mockResolvedValue(1);

      const result = await service.updateStatus('ORD20260601001', OrderStatus.CANCELLED);

      expect(result.code).toBe(0);
      // Should execute: status update + slot release
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderNo: 'ORD20260601001' },
          data: { status: OrderStatus.CANCELLED },
        }),
      );
    });
  });
});
