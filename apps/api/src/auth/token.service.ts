import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokens } from '@idu/types';
import { PrismaService } from '../prisma/prisma.service';

export interface AccessPayload {
  sub: string;
  role: string;
  login: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /** Access (JWT) + opaque refresh token yaratadi, refresh hashini DB'ga saqlaydi. */
  async issue(
    payload: AccessPayload,
    ctx?: { userAgent?: string; ip?: string },
  ): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
    });

    const refreshToken = randomBytes(48).toString('hex');
    const ttlDays = parseInt(this.config.get('JWT_REFRESH_TTL', '7d'), 10) || 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: this.sha256(refreshToken),
        userAgent: ctx?.userAgent,
        ip: ctx?.ip,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  /** Refresh tokenni tekshiradi va rotatsiya qiladi (eskisini bekor qiladi). */
  async rotate(refreshToken: string | undefined, ctx?: { userAgent?: string; ip?: string }): Promise<AuthTokens | null> {
    if (!refreshToken) return null; // cookie yo'q → 401 (500 emas)
    const tokenHash = this.sha256(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) return null;

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.issue(
      { sub: record.user.id, role: record.user.role.name, login: record.user.login },
      ctx,
    );
  }

  /** Foydalanuvchining barcha yoki bitta refresh tokenini bekor qiladi (logout). */
  async revoke(refreshToken?: string, userId?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.sha256(refreshToken) },
        data: { revokedAt: new Date() },
      });
    } else if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }
}
