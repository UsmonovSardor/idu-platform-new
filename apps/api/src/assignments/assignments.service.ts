import { Injectable, NotFoundException } from '@nestjs/common';
import type { AssignmentDto, GradeSubmissionDto, SubmitAssignmentDto } from '@idu/validation';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: AssignmentDto, teacherId: string) {
    return this.prisma.assignment.create({ data: { ...dto, createdBy: teacherId } });
  }

  async listByCourse(courseId: string) {
    return this.prisma.assignment.findMany({
      where: { courseId, deletedAt: null },
      include: { _count: { select: { submissions: true } } },
      orderBy: { deadline: 'asc' },
    });
  }

  /** Talaba topshiriqni yuklaydi — muddatdan keyin bo'lsa isLate=true (§7.7). */
  async submit(assignmentId: string, userId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
    });
    if (!assignment) throw new NotFoundException('Topshiriq topilmadi');

    const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Talaba profili topilmadi');

    const isLate = new Date() > assignment.deadline;

    return this.prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
      create: { assignmentId, studentId: student.id, fileUrl: dto.fileUrl, comment: dto.comment, isLate },
      update: { fileUrl: dto.fileUrl, comment: dto.comment, isLate, submittedAt: new Date() },
    });
  }

  async gradeSubmission(submissionId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException('Yuklama topilmadi');
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { grade: dto.grade, feedback: dto.feedback },
    });
  }

  async listSubmissions(assignmentId: string) {
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: { student: { include: { user: { select: { fullName: true } } } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async mySubmissions(userId: string) {
    const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Talaba profili topilmadi');
    return this.prisma.submission.findMany({
      where: { studentId: student.id },
      include: { assignment: { select: { title: true, deadline: true, maxScore: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
