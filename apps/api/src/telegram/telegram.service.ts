import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import { verifyTelegramInitData } from './telegram-auth';

@Injectable()
export class TelegramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tokens: TokenService,
  ) {}

  private verify(initData: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new UnauthorizedException('Telegram bot sozlanmagan');
    const verified = verifyTelegramInitData(initData, token);
    if (!verified) throw new UnauthorizedException('Telegram initData yaroqsiz');
    return verified;
  }

  /** Mini App kirishi: telegram_id bog'langan bo'lsa — sessiya, aks holda linking so'raladi. */
  async authenticate(initData: string, ctx?: { userAgent?: string; ip?: string }) {
    const { user: tgUser } = this.verify(initData);
    const user = await this.prisma.user.findFirst({
      where: { telegramId: String(tgUser.id), deletedAt: null, status: 'ACTIVE' },
      include: { role: true },
    });
    if (!user) {
      return { linked: false as const, telegramId: String(tgUser.id) };
    }
    const tokens = await this.tokens.issue(
      { sub: user.id, role: user.role.name, login: user.login },
      ctx,
    );
    return { linked: true as const, ...tokens };
  }

  /** Telegram akkauntini joriy foydalanuvchiga bog'lash (avtorizatsiyalangan). */
  async link(initData: string, userId: string) {
    const { user: tgUser } = this.verify(initData);
    const telegramId = String(tgUser.id);
    const taken = await this.prisma.user.findFirst({ where: { telegramId, NOT: { id: userId } } });
    if (taken) throw new UnauthorizedException('Bu Telegram akkaunt boshqa foydalanuvchiga bog\'langan');
    await this.prisma.user.update({ where: { id: userId }, data: { telegramId } });
    return { linked: true, telegramId };
  }
}
