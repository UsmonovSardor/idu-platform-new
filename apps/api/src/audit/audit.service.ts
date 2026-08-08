import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string;
  action: string; // GRADE_UPDATE, ATTENDANCE_MARK, ...
  entity: string; // Grade, Attendance, ...
  before?: unknown;
  after?: unknown;
  ip?: string;
}

/** Muhim amallarni AuditLog'ga yozadi (R23, §13). Xato bo'lsa asosiy oqimni bloklamaydi. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          action: entry.action,
          entity: entry.entity,
          before: (entry.before ?? undefined) as never,
          after: (entry.after ?? undefined) as never,
          ip: entry.ip ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Audit yozib bo'lmadi: ${(err as Error).message}`);
    }
  }
}
