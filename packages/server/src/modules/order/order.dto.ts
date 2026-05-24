import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式需为 YYYY-MM-DD' })
  scheduleDate: string;

  @IsString()
  @Length(2, 10, { message: '请输入 2–10 个字的姓名' })
  customerName: string;

  @IsString()
  @Matches(/^1\d{10}$/, { message: '请输入有效的手机号码' })
  customerPhone: string;

  @IsInt()
  @Min(1, { message: '张数需在 1–50 之间' })
  @Max(50, { message: '张数需在 1–50 之间' })
  photoCount: number;

  @IsString()
  @Length(10, 500, { message: '请至少填写 10 个字描述需求' })
  requirements: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  additionalNotes?: string;

  @IsInt()
  expectedVersion: number;

  @IsString()
  idempotencyKey: string;
}

export class QueryOrderDto {
  @IsString()
  @Length(2, 10)
  customerName: string;

  @IsOptional()
  @IsString()
  @Matches(/^1\d{10}$/)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}

export class UpdateOrderStatusDto {
  @IsInt()
  @Min(0)
  @Max(4)
  status: number;
}
