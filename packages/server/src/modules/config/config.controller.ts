import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('admin/config')
@UseGuards(AuthGuard)
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /** GET /api/admin/config */
  @Get()
  async getConfig() {
    const data = await this.configService.getConfig();
    return { code: 0, data };
  }

  /** PUT /api/admin/config */
  @Put()
  async updateConfig(@Body() body: Record<string, unknown>) {
    const data = await this.configService.updateConfig(body as never);
    return { code: 0, data };
  }
}
