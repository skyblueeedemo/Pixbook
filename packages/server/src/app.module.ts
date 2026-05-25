import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { OrderModule } from './modules/order/order.module';
import { WechatModule } from './modules/wechat/wechat.module';
import { ConfigModule as AppConfigModule } from './modules/config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: resolve(__dirname, '..', '.env') }),
    PrismaModule,
    RedisModule,
    ScheduleModule,
    OrderModule,
    WechatModule,
    AppConfigModule,
    AuthModule,
  ],
})
export class AppModule {}
