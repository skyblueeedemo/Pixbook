import { Injectable, HttpException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { randomUUID } from 'crypto';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  // These MUST be set via environment variables — never hardcoded.
  private readonly APP_ID = process.env.WX_APP_ID ?? '';
  private readonly APP_SECRET = process.env.WX_APP_SECRET ?? '';
  private readonly SESSION_TTL = 604800; // 7 days (seconds)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Exchange wx.login code for openid, then return a custom session key.
   * AppSecret NEVER leaves the server — this is the secure flow per WeChat spec.
   */
  async login(code: string): Promise<{ sessionKey: string }> {
    if (!this.APP_ID || !this.APP_SECRET) {
      throw new HttpException(
        { code: 5000, message: '微信配置未就绪，请联系管理员' },
        500,
      );
    }

    // ── Call WeChat code2session ───────────────────────
    const url =
      `https://api.weixin.qq.com/sns/jscode2session` +
      `?appid=${this.APP_ID}` +
      `&secret=${this.APP_SECRET}` +
      `&js_code=${code}` +
      `&grant_type=authorization_code`;

    const res = await fetch(url);
    const data = (await res.json()) as {
      openid?: string;
      session_key?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode || !data.openid) {
      this.logger.error(`code2session failed: ${JSON.stringify(data)}`);
      throw new HttpException(
        { code: 5000, message: '微信登录失败，请重试' },
        500,
      );
    }

    // ── Upsert user record ─────────────────────────────
    await this.prisma.user.upsert({
      where: { openid: data.openid },
      create: { openid: data.openid },
      update: { lastLoginAt: new Date() },
    });

    // ── Generate custom session key, store in Redis ────
    const sessionKey = randomUUID();
    if (await this.redis.isAvailable()) {
      const user = await this.prisma.user.findUnique({ where: { openid: data.openid } });
      await this.redis.client.setex(
        `session:${sessionKey}`,
        this.SESSION_TTL,
        String(user!.id),
      );
    }

    this.logger.log(`User logged in: openid=${data.openid.substring(0, 8)}...`);
    return { sessionKey };
  }

  /**
   * Validate a session key, return userId.
   */
  async validateSession(sessionKey: string): Promise<number | null> {
    if (!(await this.redis.isAvailable())) return null;
    const userId = await this.redis.client.get(`session:${sessionKey}`);
    return userId ? Number(userId) : null;
  }
}
