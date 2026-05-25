import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfigService, type AppConfig, type BookingFormField } from './config.service';
import { AuthGuard } from '../auth/auth.guard';

/** Admin-only config CRUD (JWT required) */
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
    const mapped = this.mapSnakeToCamel(body);
    const data = await this.configService.updateConfig(mapped);
    return { code: 0, data };
  }

  /**
   * Map frontend snake_case keys → AppConfig camelCase fields.
   */
  private mapSnakeToCamel(raw: Record<string, unknown>): Partial<AppConfig> {
    const result: Record<string, unknown> = {};

    if (raw.default_max_slots !== undefined) result.defaultMaxSlots = Number(raw.default_max_slots);
    if (raw.booking_days !== undefined) result.bookingDays = Number(raw.booking_days);
    if (raw.rest_days_of_week !== undefined) {
      const val = raw.rest_days_of_week;
      result.restDaysOfWeek = typeof val === 'string'
        ? val.split(',').map(Number).filter((n) => !isNaN(n))
        : (val as number[]);
    }
    if (raw.extra_rest_dates !== undefined) result.extraRestDates = raw.extra_rest_dates as string[];
    if (raw.extra_work_dates !== undefined) result.extraWorkDates = raw.extra_work_dates as string[];
    if (raw.booking_form_fields !== undefined) {
      result.bookingFormFields = typeof raw.booking_form_fields === 'string'
        ? JSON.parse(raw.booking_form_fields)
        : raw.booking_form_fields;
    }

    return result as Partial<AppConfig>;
  }
}

/** Public config — read-only, no auth required (for mini-program) */
@Controller('config')
export class ConfigPublicController {
  constructor(private readonly configService: ConfigService) {}

  /** GET /api/config/booking-form — public form field definitions */
  @Get('booking-form')
  async getBookingForm(): Promise<{ code: number; data: BookingFormField[] }> {
    const config = await this.configService.getConfig();
    return { code: 0, data: config.bookingFormFields };
  }
}
