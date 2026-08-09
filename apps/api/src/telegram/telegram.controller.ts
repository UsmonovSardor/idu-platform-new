import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { telegramAuthSchema } from '@idu/validation';
import { CurrentUser, Public } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}

  @Public()
  @Post('auth')
  @ApiOperation({ summary: 'Telegram Mini App kirishi (initData tekshiriladi)' })
  auth(
    @Body(new ZodValidationPipe(telegramAuthSchema)) dto: { initData: string },
    @Req() req: Request,
  ) {
    return this.telegram.authenticate(dto.initData, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('link')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Telegram akkauntini bog\'lash' })
  link(
    @Body(new ZodValidationPipe(telegramAuthSchema)) dto: { initData: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.telegram.link(dto.initData, userId);
  }
}
