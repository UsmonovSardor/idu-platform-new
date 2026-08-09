import { Injectable, NotFoundException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import type { AnnouncementDto } from '@idu/validation';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

/** Foydalanuvchi HTML'ini xavfsiz teglar bilan cheklaydi (XSS oldini olish, §7.11). */
function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h3', 'h4', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: AnnouncementDto, authorId: string) {
    const announcement = await this.prisma.announcement.create({
      data: { title: dto.title, body: sanitize(dto.body), scope: dto.scope, authorId },
    });

    // Auditoriyani aniqlab, bildirishnoma yuborish (asinxron, so'rovni bloklamaydi)
    const audience = await this.resolveAudience(dto.scope);
    if (audience.length > 0) {
      void this.notifications.dispatchMany(audience, {
        title: 'Yangi e\'lon',
        body: dto.title,
        channels: ['IN_APP', 'TELEGRAM'],
        payload: { announcementId: announcement.id },
      });
    }
    return { ...announcement, notifiedCount: audience.length };
  }

  private async resolveAudience(scope: string): Promise<string[]> {
    if (scope === 'UNIVERSITY') {
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        select: { id: true },
        take: 1000,
      });
      return users.map((u) => u.id);
    }
    const [kind, id] = scope.split(':');
    if (kind === 'GROUP') {
      const students = await this.prisma.student.findMany({
        where: { groupId: id, deletedAt: null },
        select: { userId: true },
      });
      return students.map((s) => s.userId);
    }
    if (kind === 'FACULTY') {
      const students = await this.prisma.student.findMany({
        where: { group: { program: { facultyId: id } }, deletedAt: null },
        select: { userId: true },
      });
      return students.map((s) => s.userId);
    }
    return [];
  }

  list(limit = 50) {
    return this.prisma.announcement.findMany({
      where: { deletedAt: null },
      include: { author: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.announcement.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('E\'lon topilmadi');
    await this.prisma.announcement.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
