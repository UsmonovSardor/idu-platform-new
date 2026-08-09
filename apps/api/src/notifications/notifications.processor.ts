import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { NotificationChannel } from '@idu/types';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATIONS_QUEUE } from './notifications.service';

interface SendJob {
  userId: string;
  title: string;
  body: string;
  channels: NotificationChannel[];
}

/** Asinxron bildirishnoma yuboruvchi (BullMQ worker) — push/telegram/email/sms (R19). */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<SendJob>): Promise<void> {
    const { userId, title, body, channels } = job.data;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, email: true, phone: true },
    });
    if (!user) return;

    for (const channel of channels) {
      if (channel === 'TELEGRAM' && user.telegramId) {
        await this.sendTelegram(user.telegramId, title, body);
      } else {
        // EMAIL/SMS/PUSH adapterlari keyin ulanadi (Eskiz/SMTP/VAPID)
        this.logger.debug(`[${channel}] → ${userId}: ${title}`);
      }
    }
  }

  private async sendTelegram(chatId: string, title: string, body: string): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: `*${title}*\n${body}`, parse_mode: 'Markdown' }),
      });
    } catch (err) {
      this.logger.warn(`Telegram yuborilmadi: ${(err as Error).message}`);
    }
  }
}
