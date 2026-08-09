import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { levelForXp, nextStreak, xpToNextLevel } from './leveling';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * XP beradi, daraja/streakni yangilaydi, chegara nishonlarini beradi (§7.13).
   * XP atomik `increment` bilan — parallel award'lar bir-birini bosmaydi (race yo'q).
   */
  async award(userId: string, points: number, _reason?: string) {
    const now = new Date();
    const inc = Math.max(0, Math.round(points));
    const before = await this.prisma.gameProfile.findUnique({ where: { userId } });
    const streak = nextStreak(before?.streakDays ?? 0, before?.lastActiveOn ?? null, now);

    const profile = await this.prisma.gameProfile.upsert({
      where: { userId },
      create: { userId, xp: inc, level: levelForXp(inc), streakDays: streak, longestStreak: streak, lastActiveOn: now },
      update: { xp: { increment: inc }, streakDays: streak, lastActiveOn: now },
    });

    // Daraja atomik xp'dan qayta hisoblanadi (increment natijasi to'g'ri)
    const level = levelForXp(profile.xp);
    const longestStreak = Math.max(before?.longestStreak ?? 0, streak);
    if (profile.level !== level || profile.longestStreak !== longestStreak) {
      await this.prisma.gameProfile.update({ where: { userId }, data: { level, longestStreak } });
    }

    const newBadges = await this.grantThresholdBadges(userId, profile.xp);
    return { xp: profile.xp, level, streak: profile.streakDays, newBadges };
  }

  private async grantThresholdBadges(userId: string, xp: number) {
    const eligible = await this.prisma.badge.findMany({
      where: { threshold: { not: null, lte: xp } },
    });
    const owned = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const ownedIds = new Set(owned.map((b) => b.badgeId));
    const toGrant = eligible.filter((b) => !ownedIds.has(b.id));
    for (const badge of toGrant) {
      await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
    }
    return toGrant.map((b) => ({ code: b.code, name: b.name }));
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.gameProfile.findUnique({
      where: { userId },
      include: { badges: { include: { badge: true } } },
    });
    if (!profile) {
      return { xp: 0, level: 1, streak: 0, xpToNext: 100, rank: null, badges: [] };
    }
    const rank = (await this.prisma.gameProfile.count({ where: { xp: { gt: profile.xp } } })) + 1;
    return {
      xp: profile.xp,
      level: profile.level,
      streak: profile.streakDays,
      longestStreak: profile.longestStreak,
      xpToNext: xpToNextLevel(profile.xp),
      rank,
      badges: profile.badges.map((ub) => ({
        code: ub.badge.code,
        name: ub.badge.name,
        icon: ub.badge.icon,
        awardedAt: ub.awardedAt,
      })),
    };
  }

  async leaderboard(limit = 20) {
    const top = await this.prisma.gameProfile.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
    });
    // userId → foydalanuvchi nomi
    const users = await this.prisma.user.findMany({
      where: { id: { in: top.map((p) => p.userId) } },
      select: { id: true, fullName: true },
    });
    const nameById = new Map(users.map((u) => [u.id, u.fullName]));
    return top.map((p, i) => ({
      rank: i + 1,
      name: nameById.get(p.userId) ?? '—',
      xp: p.xp,
      level: p.level,
      streak: p.streakDays,
    }));
  }

  listBadges() {
    return this.prisma.badge.findMany({ orderBy: { threshold: 'asc' } });
  }
}
