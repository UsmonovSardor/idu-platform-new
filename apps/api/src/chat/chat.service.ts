import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateRoomDto } from '@idu/validation';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(dto: CreateRoomDto, creatorId: string) {
    const memberIds = [...new Set([creatorId, ...dto.memberIds])];
    return this.prisma.chatRoom.create({
      data: {
        name: dto.name,
        isGroup: dto.isGroup || memberIds.length > 2,
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
      include: { members: true },
    });
  }

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const m = await this.prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    return !!m;
  }

  listRooms(userId: string) {
    return this.prisma.chatRoom.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: true,
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async history(roomId: string, userId: string, limit = 50) {
    if (!(await this.isMember(roomId, userId))) throw new ForbiddenException('Siz bu chat a\'zosi emassiz');
    return this.prisma.message.findMany({
      where: { roomId, deletedAt: null },
      include: { sender: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async createMessage(roomId: string, senderId: string, body: string) {
    if (!(await this.isMember(roomId, senderId))) {
      throw new ForbiddenException('Siz bu chat a\'zosi emassiz');
    }
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Chat topilmadi');
    return this.prisma.message.create({
      data: { roomId, senderId, body },
      include: { sender: { select: { fullName: true } } },
    });
  }
}
