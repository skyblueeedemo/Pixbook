import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Single-admin for V1.0 (PRD §2.3)
const ADMIN_ACCOUNT = {
  username: process.env.ADMIN_USERNAME ?? 'admin',
  password: process.env.ADMIN_PASSWORD ?? 'pixbook2026',
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string): Promise<{ token: string }> {
    if (username !== ADMIN_ACCOUNT.username || password !== ADMIN_ACCOUNT.password) {
      throw new UnauthorizedException({ code: 401, message: '账号或密码错误' });
    }

    const token = await this.jwtService.signAsync({ sub: 'admin', role: 'admin' });
    return { token };
  }
}
