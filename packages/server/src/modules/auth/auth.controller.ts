import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/admin/login */
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const data = await this.authService.login(body.username, body.password);
    return { code: 0, data };
  }
}
