import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, QueryOrderDto, UpdateOrderStatusDto } from './order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /** POST /api/order/submit */
  @Post('submit')
  async submit(@Body() dto: CreateOrderDto) {
    return this.orderService.submit(dto);
  }

  /** GET /api/order/query?orderId=...&customerPhone=... */
  @Get('query')
  async query(@Query() query: QueryOrderDto) {
    return this.orderService.query(query.orderId, query.customerPhone);
  }

  /** PATCH /api/admin/order/:orderId/status */
  @Patch('admin/order/:orderId/status')
  async updateStatus(@Param('orderId') orderId: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(orderId, dto.status);
  }
}
