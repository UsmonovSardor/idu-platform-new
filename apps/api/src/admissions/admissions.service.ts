import { randomBytes } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { Paginated } from '@idu/types';
import type {
  AdmissionConvertDto,
  AdmissionReviewDto,
  AdmissionSubmitDto,
  PaginationDto,
} from '@idu/validation';
import { AuditService } from '../audit/audit.service';
import { paginate, toSkipTake } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  submit(dto: AdmissionSubmitDto) {
    return this.prisma.admission.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        programId: dto.programId ?? null,
        documents: (dto.documents ?? undefined) as never,
        status: 'SUBMITTED',
      },
    });
  }

  async list(query: PaginationDto & { status?: string }): Promise<Paginated<unknown>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.admission.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.admission.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async review(id: string, dto: AdmissionReviewDto) {
    const admission = await this.prisma.admission.findFirst({ where: { id, deletedAt: null } });
    if (!admission) throw new NotFoundException('Ariza topilmadi');
    return this.prisma.admission.update({
      where: { id },
      data: { status: dto.status, reviewNote: dto.reviewNote },
    });
  }

  /** Qabul qilingan abituriyentni talaba akkauntiga aylantiradi (§7.8 acceptance). */
  async convert(id: string, dto: AdmissionConvertDto) {
    const admission = await this.prisma.admission.findFirst({ where: { id, deletedAt: null } });
    if (!admission) throw new NotFoundException('Ariza topilmadi');
    if (admission.status !== 'ACCEPTED') {
      throw new BadRequestException('Faqat qabul qilingan arizani aylantirish mumkin');
    }
    if (admission.convertedTo) throw new ConflictException('Ariza allaqachon aylantirilgan');

    const studentRole = await this.prisma.role.findUniqueOrThrow({ where: { name: 'STUDENT' } });
    const tempPassword = randomBytes(6).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, this.config.get('BCRYPT_ROUNDS', 12));

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: admission.fullName,
          login: dto.login,
          email: admission.email,
          phone: admission.phone,
          passwordHash,
          roleId: studentRole.id,
          status: 'ACTIVE',
        },
      });
      await tx.student.create({
        data: { userId: created.id, groupId: dto.groupId, studentNumber: dto.studentNumber },
      });
      await tx.admission.update({ where: { id }, data: { convertedTo: created.id } });
      return created;
    });

    await this.audit.record({ action: 'ADMISSION_CONVERT', entity: 'Admission', after: { id, userId: user.id } });
    // Vaqtinchalik parol faqat bir marta qaytariladi (foydalanuvchiga yetkaziladi).
    return { userId: user.id, login: dto.login, tempPassword };
  }
}
