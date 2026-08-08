import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '@idu/types';
import type { PaginationDto } from '@idu/validation';
import { paginate, toSkipTake } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

type FacultyInput = { name: string; code: string };

@Injectable()
export class FacultiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto): Promise<Paginated<unknown>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }] }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.faculty.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { departments: true, programs: true } } },
      }),
      this.prisma.faculty.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findFirst({
      where: { id, deletedAt: null },
      include: { departments: true, programs: true },
    });
    if (!faculty) throw new NotFoundException('Fakultet topilmadi');
    return faculty;
  }

  async create(input: FacultyInput, userId: string) {
    return this.prisma.faculty.create({ data: { ...input, createdBy: userId } });
  }

  async update(id: string, input: Partial<FacultyInput>) {
    await this.findOne(id);
    return this.prisma.faculty.update({ where: { id }, data: input });
  }

  /** Soft-delete (R8) — yozuv o'chirilmaydi, deletedAt belgilanadi. */
  async remove(id: string): Promise<{ success: true }> {
    await this.findOne(id);
    await this.prisma.faculty.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
