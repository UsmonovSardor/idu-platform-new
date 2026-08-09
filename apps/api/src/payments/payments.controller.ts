import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createPaymentSchema, type CreatePaymentDto } from '@idu/validation';
import { CurrentUser, Public } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @ApiBearerAuth()
  @CheckPolicies({ action: 'create', subject: 'Payment' })
  @ApiOperation({ summary: 'Kontrakt to\'lovi yaratish (dekanat)' })
  create(@Body(new ZodValidationPipe(createPaymentSchema)) dto: CreatePaymentDto) {
    return this.payments.create(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Payment' })
  @ApiOperation({ summary: 'Mening to\'lovlarim va qoldiq' })
  mine(@CurrentUser('id') userId: string) {
    return this.payments.findMine(userId);
  }

  @Get('student/:studentId')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Payment' })
  byStudent(@Param('studentId') studentId: string) {
    return this.payments.findByStudent(studentId);
  }

  @Post(':id/checkout')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Payment' })
  @ApiOperation({ summary: 'To\'lovni boshlash — checkout URL (Payme/Click)' })
  checkout(@Param('id') id: string) {
    return this.payments.checkout(id);
  }

  // ── Webhooks (shlyuz chaqiradi — auth JWT emas) ──
  @Public()
  @Post('click/prepare')
  @ApiOperation({ summary: 'Click Prepare callback (imzo tekshiriladi)' })
  clickPrepare(@Body() body: any) {
    return this.payments.clickPrepare(body);
  }

  @Public()
  @Post('click/complete')
  @ApiOperation({ summary: 'Click Complete callback' })
  clickComplete(@Body() body: any) {
    return this.payments.clickComplete(body);
  }

  @Public()
  @Post('payme')
  @ApiOperation({ summary: 'Payme JSON-RPC callback (Basic auth)' })
  async payme(@Body() body: any, @Headers('authorization') auth?: string) {
    if (!this.payments.verifyPaymeAuth(auth)) {
      return { error: { code: -32504, message: 'Insufficient privileges' }, id: body?.id };
    }
    const result = await this.payments.handlePayme(body?.method, body?.params ?? {});
    return { ...result, id: body?.id };
  }
}
