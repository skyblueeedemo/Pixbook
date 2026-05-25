import { Module } from '@nestjs/common';
import { ConfigController, ConfigPublicController } from './config.controller';
import { ConfigService } from './config.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ConfigController, ConfigPublicController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
