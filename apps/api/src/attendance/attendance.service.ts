import { createHmac, timingSafeEqual } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AttendanceStatus } from '@idu/types';
import type { BulkAttendanceDto, MarkAttendanceDto } from '@idu/validation';
import { GamificationService } from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';

/** Sana faqat kun aniqligida (vaqtsiz) — kunlik unikal davomat uchun. */
function toDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gamification: GamificationService,
  ) {}

  // ── QR imzolash/tekshirish (stateless, qisqa muddatli) ──
  private secret(): string {
    return this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret()).update(payload).digest('hex');
  }

  generateQrToken(courseId: string, ttlSeconds: number): { token: string; expiresAt: string } {
    const exp = Date.now() + ttlSeconds * 1000;
    const payload = Buffer.from(JSON.stringify({ c: courseId, e: exp })).toString('base64url');
    const token = `${payload}.${this.sign(payload)}`;
    return { token, expiresAt: new Date(exp).toISOString() };
  }

  private verifyQrToken(token: string): { courseId: string } {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) throw new BadRequestException('QR token yaroqsiz');
    const expected = this.sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('QR imzosi noto\'g\'ri');
    }
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { c: string; e: number };
    if (Date.now() > data.e) throw new BadRequestException('QR muddati tugagan');
    return { courseId: data.c };
  }

  // ── Belgilash ──
  async mark(dto: MarkAttendanceDto, actorId: string) {
    const date = toDay(dto.date);
    return this.prisma.attendance.upsert({
      where: { studentId_courseId_date: { studentId: dto.studentId, courseId: dto.courseId, date } },
      create: { ...dto, date, createdBy: actorId },
      update: { status: dto.status, note: dto.note, createdBy: actorId },
    });
  }

  async bulkMark(dto: BulkAttendanceDto, actorId: string) {
    const date = toDay(dto.date);
    await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.attendance.upsert({
          where: { studentId_courseId_date: { studentId: r.studentId, courseId: dto.courseId, date } },
          create: { studentId: r.studentId, courseId: dto.courseId, date, status: r.status, createdBy: actorId },
          update: { status: r.status, createdBy: actorId },
        }),
      ),
    );
    return { count: dto.records.length };
  }

  /** Talaba QR token bilan o'zini PRESENT belgilaydi — faqat o'zini (§7.5 acceptance). */
  async markViaQr(token: string, userId: string) {
    const { courseId } = this.verifyQrToken(token);
    const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Talaba profili topilmadi');
    const date = toDay(new Date());
    await this.prisma.attendance.upsert({
      where: { studentId_courseId_date: { studentId: student.id, courseId, date } },
      create: { studentId: student.id, courseId, date, status: 'PRESENT', createdBy: userId },
      update: { status: 'PRESENT' },
    });
    void this.gamification.award(userId, 5, 'ATTENDANCE_QR'); // davomat uchun XP
    return { success: true, status: 'PRESENT' as AttendanceStatus };
  }

  // ── Statistika ──
  async courseStats(courseId: string) {
    const grouped = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { courseId },
      _count: { _all: true },
    });
    const total = grouped.reduce((s, g) => s + g._count._all, 0);
    return {
      total,
      byStatus: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
    };
  }

  async studentStats(studentId: string) {
    const grouped = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId },
      _count: { _all: true },
    });
    const total = grouped.reduce((s, g) => s + g._count._all, 0);
    const present = grouped.find((g) => g.status === 'PRESENT')?._count._all ?? 0;
    return {
      total,
      present,
      rate: total ? Math.round((present / total) * 100) : 0,
      byStatus: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
    };
  }
}
