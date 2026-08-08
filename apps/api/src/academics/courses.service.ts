import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '@idu/types';
import type { PaginationDto } from '@idu/validation';
import { paginate, toSkipTake } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

type CourseInput = { name: string; code: string; credits: number; teacherId?: string };

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto): Promise<Paginated<unknown>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = {
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { teacher: { include: { user: { select: { fullName: true } } } } },
      }),
      this.prisma.course.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) throw new NotFoundException('Fan topilmadi');
    return course;
  }

  create(input: CourseInput, userId: string) {
    return this.prisma.course.create({ data: { ...input, createdBy: userId } });
  }

  async update(id: string, input: Partial<CourseInput>) {
    await this.findOne(id);
    return this.prisma.course.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.course.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
