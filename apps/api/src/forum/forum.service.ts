import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '@idu/types';
import type { ForumPostDto, ForumTopicDto, PaginationDto } from '@idu/validation';
import { paginate, toSkipTake } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  createTopic(dto: ForumTopicDto, authorId: string) {
    return this.prisma.forumTopic.create({ data: { ...dto, authorId } });
  }

  async listTopics(query: PaginationDto): Promise<Paginated<unknown>> {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const where = {
      deletedAt: null,
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.forumTopic.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { fullName: true } },
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.forumTopic.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async getTopic(id: string) {
    const topic = await this.prisma.forumTopic.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { fullName: true } },
        posts: {
          where: { deletedAt: null },
          include: { author: { select: { fullName: true } } },
          orderBy: { votes: 'desc' },
        },
      },
    });
    if (!topic) throw new NotFoundException('Mavzu topilmadi');
    return topic;
  }

  async createPost(topicId: string, dto: ForumPostDto, authorId: string) {
    const topic = await this.prisma.forumTopic.findFirst({ where: { id: topicId, deletedAt: null } });
    if (!topic) throw new NotFoundException('Mavzu topilmadi');
    return this.prisma.forumPost.create({ data: { topicId, body: dto.body, authorId } });
  }

  async vote(postId: string, direction: 'up' | 'down') {
    return this.prisma.forumPost.update({
      where: { id: postId },
      data: { votes: { increment: direction === 'up' ? 1 : -1 } },
    });
  }
}
