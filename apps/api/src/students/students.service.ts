import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '@idu/types';
import type { PaginationDto } from '@idu/validation';
import { paginate, toSkipTake } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto & { groupId?: string }): Promise<Paginated<unknown>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = {
      deletedAt: null,
      ...(query.groupId ? { groupId: query.groupId } : {}),
      ...(query.search
        ? { user: { fullName: { contains: query.search, mode: 'insensitive' as const } } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { studentNumber: 'asc' },
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          group: { select: { name: true } },
        },
      }),
      this.prisma.student.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { user: { select: { fullName: true, email: true, phone: true } }, group: true },
    });
    if (!student) throw new NotFoundException('Talaba topilmadi');
    return student;
  }
}
