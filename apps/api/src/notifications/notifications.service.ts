import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { NotificationChannel } from '@idu/types';
import { PrismaService } from '../prisma/prisma.service';

export interface DispatchInput {
  title: string;
  body: string;
  channels?: NotificationChannel[];
  payload?: Record<string, unknown>;
}

export const NOTIFICATIONS_QUEUE = 'notifications';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /** In-app bildirishnoma yaratadi + boshqa kanallarni navbatga qo'yadi (R19). */
  async dispatch(userId: string, input: DispatchInput) {
    const channels = input.channels ?? ['IN_APP'];
    const inApp = await this.prisma.notification.create({
      data: {
        userId,
        channel: 'IN_APP',
        title: input.title,
        body: input.body,
        payload: (input.payload ?? undefined) as never,
      },
    });

    const async = channels.filter((c) => c !== 'IN_APP');
    if (async.length > 0) {
      await this.queue.add(
        'send',
        { userId, title: input.title, body: input.body, channels: async, payload: input.payload },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 100 },
      );
    }
    return inApp;
  }

  /** Ko'p foydalanuvchiga (masalan e'lon) — asosiy so'rovni bloklamaydi. */
  async dispatchMany(userIds: string[], input: DispatchInput) {
    await Promise.all(userIds.map((id) => this.dispatch(id, input)));
    return { count: userIds.length };
  }

  list(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
    return { success: true };
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: res.count };
  }
}
