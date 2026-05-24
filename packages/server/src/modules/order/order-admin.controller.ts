import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { OrderService } from './order.service';
import { AdminOrderQueryDto, UpdateOrderStatusDto } from './order.dto';

@Controller('admin')
@UseGuards(AuthGuard)
export class OrderAdminController {
  constructor(private readonly orderService: OrderService) {}

  /** GET /api/admin/orders */
  @Get('orders')
  async list(@Query() query: AdminOrderQueryDto) {
    return this.orderService.listOrders(query);
  }

  /** PATCH /api/admin/orders/:orderId/status */
  @Patch('orders/:orderId/status')
  async updateStatus(@Param('orderId') orderId: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(orderId, dto.status);
  }
}
