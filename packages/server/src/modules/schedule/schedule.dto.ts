import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCalendarDto {
  @IsOptional()
  @Type(() => String)
  startDate?: string; // YYYY-MM-DD, default tomorrow

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number; // default 30
}
