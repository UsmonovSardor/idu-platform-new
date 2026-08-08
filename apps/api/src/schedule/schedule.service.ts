import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ScheduleDto } from '@idu/validation';
import { PrismaService } from '../prisma/prisma.service';

const WEEKDAYS = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /** Xona/guruh/o'qituvchi to'qnashuvini aniqlaydi (§7.4). Vaqt kesishishi: aStart < bEnd && bStart < aEnd. */
  private async detectConflicts(dto: ScheduleDto, excludeId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { teacherId: true },
    });

    const candidates = await this.prisma.schedule.findMany({
      where: {
        weekday: dto.weekday,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          { room: dto.room },
          { groupId: dto.groupId },
          ...(course?.teacherId ? [{ course: { teacherId: course.teacherId } }] : []),
        ],
      },
      include: {
        course: { select: { teacherId: true, name: true } },
        group: { select: { name: true } },
      },
    });

    const conflicts: string[] = [];
    for (const c of candidates) {
      const overlap = dto.startTime < c.endTime && c.startTime < dto.endTime;
      if (!overlap) continue;
      if (c.room === dto.room) conflicts.push(`Xona ${dto.room} band (${c.startTime}–${c.endTime})`);
      if (c.groupId === dto.groupId)
        conflicts.push(`Guruh ${c.group.name} band (${c.startTime}–${c.endTime})`);
      if (course?.teacherId && c.course.teacherId === course.teacherId)
        conflicts.push(`O'qituvchi band (${c.course.name}, ${c.startTime}–${c.endTime})`);
    }
    return [...new Set(conflicts)];
  }

  async create(dto: ScheduleDto) {
    const conflicts = await this.detectConflicts(dto);
    if (conflicts.length > 0) {
      throw new ConflictException({ code: 'SCHEDULE_CONFLICT', message: 'To\'qnashuv', details: conflicts });
    }
    return this.prisma.schedule.create({ data: dto });
  }

  async findByGroup(groupId: string) {
    const rows = await this.prisma.schedule.findMany({
      where: { groupId, deletedAt: null },
      include: { course: { select: { name: true, code: true, teacher: { include: { user: { select: { fullName: true } } } } } } },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
    return this.groupByWeekday(rows);
  }

  /** Talabaning shaxsiy jadvali (guruhi bo'yicha). */
  async findMine(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      select: { groupId: true },
    });
    if (!student?.groupId) throw new NotFoundException('Talaba guruhi topilmadi');
    return this.findByGroup(student.groupId);
  }

  private groupByWeekday(rows: Array<{ weekday: number } & Record<string, unknown>>) {
    const byDay: Record<string, unknown[]> = {};
    for (const r of rows) {
      const day = WEEKDAYS[r.weekday] ?? String(r.weekday);
      (byDay[day] ??= []).push(r);
    }
    return byDay;
  }

  async remove(id: string) {
    const existing = await this.prisma.schedule.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Jadval topilmadi');
    await this.prisma.schedule.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
