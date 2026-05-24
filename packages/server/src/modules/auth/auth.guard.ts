import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 401, message: '未登录或 Token 已过期' });
    }

    const token = authHeader.slice(7);
    try {
      const payload = await this.jwtService.verifyAsync(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException({ code: 401, message: 'Token 无效或已过期' });
    }
  }
}
