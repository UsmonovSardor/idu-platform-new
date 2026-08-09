import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DocumentType } from '@idu/types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { buildDocumentPdf, type PdfDocParams } from './pdf';

const TITLES: Record<DocumentType, string> = {
  REFERENCE: "Ma'lumotnoma (spravka)",
  TRANSCRIPT: 'Transkript',
  CERTIFICATE: 'Sertifikat',
  ORDER: 'Buyruq',
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async generate(type: DocumentType, studentId: string | undefined, actorId: string) {
    const qrHash = randomUUID().replace(/-/g, '');
    const base = this.config.get<string>('APP_BASE_URL', 'http://localhost:4000');
    const verifyUrl = `${base}/api/v1/documents/verify/${qrHash}`;

    const pdfParams: PdfDocParams = {
      title: TITLES[type],
      verifyUrl,
      qrHash,
      lines: [],
    };

    if (studentId) {
      const student = await this.prisma.student.findFirst({
        where: { id: studentId, deletedAt: null },
        include: {
          user: { select: { fullName: true } },
          group: { include: { program: { include: { faculty: true } } } },
        },
      });
      if (!student) throw new NotFoundException('Talaba topilmadi');

      pdfParams.subtitle = `${student.user.fullName} — ${student.studentNumber}`;
      pdfParams.lines = [
        { label: 'F.I.Sh', value: student.user.fullName },
        { label: 'Talaba raqami', value: student.studentNumber },
        { label: 'Guruh', value: student.group?.name ?? '-' },
        { label: 'Yo\'nalish', value: student.group?.program.name ?? '-' },
        { label: 'Fakultet', value: student.group?.program.faculty.name ?? '-' },
        { label: 'Holat', value: student.status },
        { label: 'Berilgan sana', value: new Date().toLocaleDateString('uz-UZ') },
      ];

      if (type === 'TRANSCRIPT') {
        const grades = await this.prisma.grade.findMany({
          where: { studentId, deletedAt: null },
          include: { course: { select: { name: true, credits: true } } },
        });
        pdfParams.bodyHeader = ['Fan', 'Kredit', 'Ball', 'Baho'];
        pdfParams.bodyRows = grades.map((g) => [
          g.course.name,
          String(g.course.credits),
          String(g.total),
          g.letter ?? '-',
        ]);
        pdfParams.lines.push({ label: 'GPA', value: String(student.gpa) });
      }
    }

    const pdf = await buildDocumentPdf(pdfParams);
    // public/ prefiksi — bucket siyosati bo'yicha o'qishga ochiq; yo'lda taxminlab bo'lmas qrHash.
    const key = `public/documents/${type.toLowerCase()}/${qrHash}.pdf`;
    const fileUrl = await this.storage.upload(key, pdf, 'application/pdf');

    const doc = await this.prisma.document.create({
      data: {
        type,
        studentId: studentId ?? null,
        fileUrl,
        qrHash,
        meta: { title: TITLES[type] } as never,
        createdBy: actorId,
      },
    });
    await this.audit.record({ userId: actorId, action: 'DOCUMENT_GENERATE', entity: 'Document', after: { id: doc.id, type } });
    return doc;
  }

  /** Ochiq verifikatsiya — QR orqali haqiqiylik tekshiruvi (§7.10). */
  async verify(qrHash: string) {
    const doc = await this.prisma.document.findFirst({
      where: { qrHash, deletedAt: null },
      include: { student: { include: { user: { select: { fullName: true } } } } },
    });
    if (!doc) return { valid: false };
    return {
      valid: true,
      type: doc.type,
      issuedTo: doc.student?.user.fullName ?? null,
      issuedAt: doc.createdAt,
    };
  }

  async listForStudent(studentId: string) {
    return this.prisma.document.findMany({
      where: { studentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}
