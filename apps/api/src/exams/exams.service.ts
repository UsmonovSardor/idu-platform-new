import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExamDto, QuestionDto, SubmitAttemptDto } from '@idu/validation';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { gradeAnswer, stripAnswers, type QuestionOption } from './exam-grading';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Savollar banki ──
  createQuestion(dto: QuestionDto) {
    const options: QuestionOption[] = (dto.options ?? []).map((o) => ({
      id: randomUUID().slice(0, 8),
      text: o.text,
      correct: o.correct,
    }));
    return this.prisma.question.create({
      data: {
        courseId: dto.courseId ?? null,
        examId: dto.examId ?? null,
        type: dto.type,
        text: dto.text,
        points: dto.points,
        options: options as never,
      },
    });
  }

  listQuestions(courseId: string) {
    return this.prisma.question.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Imtihon ──
  createExam(dto: ExamDto, userId: string) {
    return this.prisma.exam.create({ data: { ...dto, createdBy: userId } });
  }

  listExamsByCourse(courseId: string) {
    return this.prisma.exam.findMany({
      where: { courseId, deletedAt: null },
      include: { _count: { select: { questions: true, attempts: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExam(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { questions: true } } },
    });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');
    return exam;
  }

  // ── Sessiya (attempt) ──
  private async resolveStudent(userId: string) {
    const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Talaba profili topilmadi');
    return student;
  }

  async startAttempt(examId: string, userId: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    const now = new Date();
    if (exam.opensAt && now < exam.opensAt) throw new BadRequestException('Imtihon hali ochilmagan');
    if (exam.closesAt && now > exam.closesAt) throw new BadRequestException('Imtihon yopilgan');

    const student = await this.resolveStudent(userId);
    const used = await this.prisma.examAttempt.count({
      where: { examId, studentId: student.id },
    });
    if (used >= exam.maxAttempts) throw new BadRequestException('Urinishlar tugagan');

    const attempt = await this.prisma.examAttempt.create({
      data: { examId, studentId: student.id },
    });

    const questions = await this.prisma.question.findMany({
      where: { examId, deletedAt: null },
    });
    const ordered = exam.shuffle ? shuffle(questions) : questions;

    return {
      attemptId: attempt.id,
      timeLimitMin: exam.timeLimitMin,
      proctoring: exam.proctoring,
      startedAt: attempt.startedAt,
      questions: ordered.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        points: q.points,
        options: stripAnswers((q.options as QuestionOption[] | null) ?? []),
      })),
    };
  }

  async submitAttempt(attemptId: string, userId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true, student: true },
    });
    if (!attempt) throw new NotFoundException('Urinish topilmadi');
    if (attempt.student.userId !== userId) throw new ForbiddenException('Bu urinish sizga tegishli emas');
    if (attempt.submittedAt) throw new BadRequestException('Urinish allaqachon yakunlangan');

    const questions = await this.prisma.question.findMany({ where: { examId: attempt.examId } });
    const qMap = new Map(questions.map((q) => [q.id, q]));

    let score = 0;
    let needsManual = 0;
    const answerRows = [];

    for (const ans of dto.answers) {
      const q = qMap.get(ans.questionId);
      if (!q) continue;
      const outcome = gradeAnswer(
        { type: q.type, points: q.points, options: (q.options as QuestionOption[] | null) ?? [] },
        ans.value,
      );
      if (outcome.needsManual) needsManual++;
      score += outcome.score;
      answerRows.push({
        attemptId,
        questionId: q.id,
        value: (ans.value ?? null) as never,
        score: outcome.needsManual ? null : outcome.score,
      });
    }

    await this.prisma.$transaction([
      ...answerRows.map((row) =>
        this.prisma.answer.upsert({
          where: { attemptId_questionId: { attemptId, questionId: row.questionId } },
          create: row,
          update: { value: row.value, score: row.score },
        }),
      ),
      this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: { submittedAt: new Date(), score },
      }),
    ]);

    return { score, needsManual, autoGraded: answerRows.length - needsManual };
  }

  /** Proctoring buzilishi → urinish avtomatik yopiladi (R25). */
  async proctorViolation(attemptId: string, userId: string, type: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { student: true },
    });
    if (!attempt) throw new NotFoundException('Urinish topilmadi');
    if (attempt.student.userId !== userId) throw new ForbiddenException('Ruxsat yo\'q');
    if (attempt.submittedAt) return { autoClosed: false, alreadyClosed: true };

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { submittedAt: new Date(), autoClosed: true, score: attempt.score ?? 0 },
    });
    await this.audit.record({
      userId,
      action: `PROCTOR_${type}`,
      entity: 'ExamAttempt',
      after: { attemptId },
    });
    return { autoClosed: true };
  }

  /** OPEN savolni qo'lda baholash + urinish ballini qayta hisob. */
  async gradeOpenAnswer(answerId: string, score: number) {
    const answer = await this.prisma.answer.update({
      where: { id: answerId },
      data: { score },
      include: { attempt: true },
    });
    const agg = await this.prisma.answer.aggregate({
      where: { attemptId: answer.attemptId },
      _sum: { score: true },
    });
    await this.prisma.examAttempt.update({
      where: { id: answer.attemptId },
      data: { score: agg._sum.score ?? 0 },
    });
    return { answerId, attemptScore: agg._sum.score ?? 0 };
  }

  async results(examId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId },
      include: { student: { include: { user: { select: { fullName: true } } } } },
      orderBy: { score: 'desc' },
    });
    return attempts.map((a) => ({
      attemptId: a.id,
      student: a.student.user.fullName,
      score: a.score,
      submittedAt: a.submittedAt,
      autoClosed: a.autoClosed,
    }));
  }

  async myAttempts(userId: string) {
    const student = await this.resolveStudent(userId);
    return this.prisma.examAttempt.findMany({
      where: { studentId: student.id },
      include: { exam: { select: { title: true, type: true } } },
      orderBy: { startedAt: 'desc' },
    });
  }
}
