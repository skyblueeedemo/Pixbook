import { Controller, Post, Body } from '@nestjs/common';
import { WechatService } from './wechat.service';
import { WxLoginDto } from './wechat.dto';

@Controller('wechat')
export class WechatController {
  constructor(private readonly wechatService: WechatService) {}

  /** POST /api/wechat/login */
  @Post('login')
  async login(@Body() dto: WxLoginDto) {
    const data = await this.wechatService.login(dto.code);
    return { code: 0, data };
  }
}
