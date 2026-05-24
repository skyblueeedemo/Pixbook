import { Controller, Get, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { GetCalendarDto } from './schedule.dto';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /** GET /api/schedule/calendar */
  @Get('calendar')
  async getCalendar(@Query() query: GetCalendarDto) {
    const data = await this.scheduleService.getCalendar(query.startDate, query.days);
    return { code: 0, data };
  }
}
