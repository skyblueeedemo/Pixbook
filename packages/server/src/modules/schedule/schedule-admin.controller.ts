import { Controller, Get, Put, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ScheduleService } from './schedule.service';

@Controller('admin/schedule')
@UseGuards(AuthGuard)
export class ScheduleAdminController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /** GET /api/admin/schedule/calendar?month=2026-06 */
  @Get('calendar')
  async getAdminCalendar(@Query('month') month: string) {
    const data = await this.scheduleService.getAdminCalendar(month);
    return { code: 0, data };
  }

  /** PUT /api/admin/schedule/:date — update max_slots */
  @Put(':date')
  async updateDate(
    @Param('date') date: string,
    @Body() body: { maxSlots?: number; isRestDay?: boolean },
  ) {
    await this.scheduleService.updateDate(date, body);
    return { code: 0, message: '更新成功' };
  }
}
