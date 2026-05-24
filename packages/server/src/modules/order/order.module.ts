import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrderController } from './order.controller';
import { OrderAdminController } from './order-admin.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';

@Module({
  imports: [AuthModule],
  controllers: [OrderController, OrderAdminController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService],
})
export class OrderModule {}
