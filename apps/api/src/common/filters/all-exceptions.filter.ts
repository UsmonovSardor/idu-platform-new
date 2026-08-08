import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/** Barcha xatolar uchun yagona format: { error: { code, message, details } } — §12.1. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Kutilmagan xatolik yuz berdi';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code = HttpStatus[status] ?? 'ERROR';
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = (Array.isArray(b.message) ? b.message[0] : b.message) as string;
        details = b.message ?? b.details;
        if (typeof b.code === 'string') code = b.code;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ status, code, message } = this.mapPrismaError(exception));
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} → ${status}`, (exception as Error)?.stack);
    }

    res.status(status).json({
      error: { code, message, ...(details ? { details } : {}) },
    });
  }

  private mapPrismaError(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    code: string;
    message: string;
  } {
    switch (e.code) {
      case 'P2002':
        return { status: HttpStatus.CONFLICT, code: 'DUPLICATE', message: 'Bunday yozuv mavjud' };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Yozuv topilmadi' };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'FK_CONSTRAINT',
          message: "Bog'liq yozuv topilmadi",
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'DB_ERROR',
          message: "Ma'lumotlar bazasi xatosi",
        };
    }
  }
}
