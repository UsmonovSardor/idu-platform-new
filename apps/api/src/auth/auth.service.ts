import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import type { AuthTokens } from '@idu/types';
import { MFA_REQUIRED_ROLES } from '@idu/types';
import type { LoginDto } from '@idu/validation';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

const MAX_FAILED = 5; // 5 marta xato → vaqtincha blok (§7.1)
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.config.get('BCRYPT_ROUNDS', 12));
  }

  async login(dto: LoginDto, ctx?: { userAgent?: string; ip?: string }): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: { login: dto.login, deletedAt: null },
      include: { role: true },
    });

    if (!user) throw new UnauthorizedException("Login yoki parol noto'g'ri");

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Akkaunt vaqtincha bloklangan. Keyinroq urinib ko\'ring');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.registerFailure(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException("Login yoki parol noto'g'ri");
    }

    // 2FA — muhim rollar uchun majburiy (R22)
    if (user.twoFactorEnabled || MFA_REQUIRED_ROLES.includes(user.role.name as never)) {
      if (!user.twoFactorSecret) {
        throw new UnauthorizedException('2FA sozlanmagan. Administratorga murojaat qiling');
      }
      if (!dto.otp || !authenticator.verify({ token: dto.otp, secret: user.twoFactorSecret })) {
        throw new UnauthorizedException('2FA kodi talab qilinadi yoki noto\'g\'ri');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return this.tokens.issue(
      { sub: user.id, role: user.role.name, login: user.login },
      ctx,
    );
  }

  private async registerFailure(userId: string, current: number): Promise<void> {
    const attempts = current + 1;
    const shouldLock = attempts >= MAX_FAILED;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : undefined,
      },
    });
  }

  async refresh(token: string, ctx?: { userAgent?: string; ip?: string }): Promise<AuthTokens> {
    const rotated = await this.tokens.rotate(token, ctx);
    if (!rotated) throw new UnauthorizedException('Refresh token yaroqsiz');
    return rotated;
  }

  async logout(refreshToken?: string, userId?: string): Promise<void> {
    await this.tokens.revoke(refreshToken, userId);
  }

  /** JWT strategiyasi uchun — foydalanuvchi + ruxsatlarni yuklaydi. */
  async loadAuthUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: 'ACTIVE' },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!user) return null;
    return {
      id: user.id,
      login: user.login,
      role: user.role.name,
      permissions: user.role.permissions.map((rp) => ({
        action: rp.permission.action as never,
        subject: rp.permission.subject as never,
      })),
    };
  }
}
