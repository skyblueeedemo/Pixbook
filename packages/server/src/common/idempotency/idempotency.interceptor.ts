import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Idempotency interceptor — guards POST /api/order/submit against duplicate requests.
 *
 * The client sends a unique `X-Idempotency-Key` header.
 * If a previous request with the same key already created an order,
 * the interceptor short-circuits and returns the existing result.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-idempotency-key'];

    if (!key) return next.handle();

    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey: key },
    });

    if (existing) {
      throw new ConflictException({
        code: 1005,
        message: 'Duplicate request',
        data: { orderId: existing.orderNo },
      });
    }

    return next.handle();
  }
}
