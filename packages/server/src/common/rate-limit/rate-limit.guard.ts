import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from '../redis/redis.service';

/**
 * Simple IP-based rate limiter.
 * Default: 10 requests per minute per IP.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = `ratelimit:${ip}`;

    if (!(await this.redis.isAvailable())) {
      return true; // degrade gracefully
    }

    const count = await this.redis.client.incr(key);
    if (count === 1) {
      await this.redis.client.expire(key, 60);
    }

    if (count > 10) {
      throw new HttpException({ code: 429, message: 'Too many requests' }, 429);
    }

    return true;
  }
}
