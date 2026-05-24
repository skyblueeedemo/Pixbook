import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ScheduleController } from './schedule.controller';
import { ScheduleAdminController } from './schedule-admin.controller';
import { ScheduleService } from './schedule.service';
import { ScheduleRepository } from './schedule.repository';

@Module({
  imports: [AuthModule],
  controllers: [ScheduleController, ScheduleAdminController],
  providers: [ScheduleService, ScheduleRepository],
  exports: [ScheduleService],
})
export class ScheduleModule {}
