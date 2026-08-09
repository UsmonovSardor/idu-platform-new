import { Injectable, NotFoundException } from '@nestjs/common';
import { computeGrade, computeWeightedGpa, PASSING_SCORE } from '@idu/types';
import type { GradeInputDto } from '@idu/validation';
import { AuditService } from '../audit/audit.service';
import { GamificationService } from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';

interface ActorCtx {
  userId: string;
  ip?: string;
}

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly gamification: GamificationService,
  ) {}

  /** Baho kiritish/yangilash — total/letter/gpa avtomatik, audit + GPA qayta hisob. */
  async upsert(dto: GradeInputDto, actor: ActorCtx) {
    const result = computeGrade({ jn: dto.jn, on: dto.on, yn: dto.yn, mi: dto.mi });

    const before = await this.prisma.grade.findUnique({
      where: { studentId_courseId: { studentId: dto.studentId, courseId: dto.courseId } },
    });

    const grade = await this.prisma.grade.upsert({
      where: { studentId_courseId: { studentId: dto.studentId, courseId: dto.courseId } },
      create: {
        studentId: dto.studentId,
        courseId: dto.courseId,
        jn: dto.jn,
        on: dto.on,
        yn: dto.yn,
        mi: dto.mi,
        total: result.total,
        letter: result.letter,
        gpa: result.gpa,
        createdBy: actor.userId,
      },
      update: {
        jn: dto.jn,
        on: dto.on,
        yn: dto.yn,
        mi: dto.mi,
        total: result.total,
        letter: result.letter,
        gpa: result.gpa,
        createdBy: actor.userId,
      },
    });

    await this.audit.record({
      userId: actor.userId,
      action: before ? 'GRADE_UPDATE' : 'GRADE_CREATE',
      entity: 'Grade',
      before: before ?? undefined,
      after: grade,
      ip: actor.ip,
    });

    const gpa = await this.recomputeStudentGpa(dto.studentId);

    // Gamifikatsiya: baho uchun XP (o'zlashtirishga mutanosib)
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { userId: true },
    });
    if (student) {
      void this.gamification.award(student.userId, Math.round(result.total / 10), 'GRADE');
    }

    return { grade, studentGpa: gpa };
  }

  /** Guruhga ommaviy baho (bitta fan bo'yicha). */
  async bulkUpsert(
    courseId: string,
    rows: Array<Omit<GradeInputDto, 'courseId'>>,
    actor: ActorCtx,
  ) {
    const results = [];
    for (const row of rows) {
      results.push(await this.upsert({ ...row, courseId }, actor));
    }
    return { count: results.length };
  }

  /** Kredit-og'irlikli GPA'ni qayta hisoblab, talaba profiliga yozadi (§7.3). */
  async recomputeStudentGpa(studentId: string): Promise<number> {
    const grades = await this.prisma.grade.findMany({
      where: { studentId, deletedAt: null },
      include: { course: { select: { credits: true } } },
    });
    const gpa = computeWeightedGpa(
      grades.map((g) => ({ gpa: g.gpa, credits: g.course.credits })),
    );
    await this.prisma.student.update({ where: { id: studentId }, data: { gpa } });
    return gpa;
  }

  async findForStudent(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true, gpa: true, studentNumber: true },
    });
    if (!student) throw new NotFoundException('Talaba topilmadi');

    const grades = await this.prisma.grade.findMany({
      where: { studentId, deletedAt: null },
      include: { course: { select: { name: true, code: true, credits: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { student, gpa: student.gpa, grades };
  }

  /** Talabaning o'z bahosi (userId orqali). */
  async findMine(userId: string) {
    const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Talaba profili topilmadi');
    return this.findForStudent(student.id);
  }

  /** Qarzdorlar (F yoki total < 55) — dekanat uchun (§7.3). */
  async debtors(courseId?: string) {
    const grades = await this.prisma.grade.findMany({
      where: {
        deletedAt: null,
        total: { lt: PASSING_SCORE },
        ...(courseId ? { courseId } : {}),
      },
      include: {
        course: { select: { name: true, code: true } },
        student: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { total: 'asc' },
    });
    return grades.map((g) => ({
      studentId: g.studentId,
      studentName: g.student.user.fullName,
      studentNumber: g.student.studentNumber,
      course: g.course.name,
      total: g.total,
      letter: g.letter,
    }));
  }
}
