import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreatePaymentDto } from '@idu/validation';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { verifyClickSign, type ClickSignParams } from './click-signature';
import { buildClickCheckoutUrl, buildPaymeCheckoutUrl } from './gateways';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  // ── Kontrakt / to'lov ──
  create(dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        amount: dto.amount,
        gateway: dto.gateway,
        dueDate: dto.dueDate ?? null,
      },
    });
  }

  async findMine(userId: string) {
    const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Talaba profili topilmadi');
    return this.findByStudent(student.id);
  }

  async findByStudent(studentId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { studentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const balance = payments
      .filter((p) => p.status !== 'PAID')
      .reduce((sum, p) => sum + (Number(p.amount) - Number(p.paidAmount)), 0);
    return { payments, balance };
  }

  /** Checkout URL — tanlangan shlyuz bo'yicha (Payme/Click). */
  async checkout(paymentId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, deletedAt: null } });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');
    if (payment.status === 'PAID') throw new BadRequestException('To\'lov allaqachon amalga oshirilgan');

    const amount = Number(payment.amount);
    if (payment.gateway === 'CLICK') {
      const url = buildClickCheckoutUrl(
        {
          serviceId: this.config.get('CLICK_SERVICE_ID', 'SANDBOX'),
          merchantId: this.config.get('CLICK_MERCHANT_ID', 'SANDBOX'),
        },
        payment.id,
        amount,
      );
      return { gateway: 'CLICK', url };
    }
    const url = buildPaymeCheckoutUrl(
      { merchantId: this.config.get('PAYME_MERCHANT_ID', 'SANDBOX') },
      payment.id,
      amount,
    );
    return { gateway: 'PAYME', url };
  }

  private async markPaid(paymentId: string, transactionId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return null;
    if (payment.status === 'PAID') return payment; // idempotent
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAmount: payment.amount, transactionId },
    });
    await this.audit.record({
      action: 'PAYMENT_PAID',
      entity: 'Payment',
      after: { paymentId, transactionId, amount: Number(payment.amount) },
    });
    return updated;
  }

  // ── Click webhook (Prepare/Complete + imzo) ──
  async clickPrepare(body: ClickSignParams) {
    const secret = this.config.get<string>('CLICK_SECRET', 'SANDBOX_SECRET');
    if (!verifyClickSign(body, secret)) {
      return { error: -1, error_note: 'SIGN CHECK FAILED' };
    }
    const payment = await this.prisma.payment.findUnique({ where: { id: body.merchant_trans_id } });
    if (!payment) return { error: -5, error_note: 'Order not found' };
    if (Number(body.amount) !== Number(payment.amount)) {
      return { error: -2, error_note: 'Incorrect amount' };
    }
    if (payment.status === 'PAID') return { error: -4, error_note: 'Already paid' };

    return {
      click_trans_id: body.click_trans_id,
      merchant_trans_id: body.merchant_trans_id,
      merchant_prepare_id: Date.now(),
      error: 0,
      error_note: 'Success',
    };
  }

  async clickComplete(body: ClickSignParams & { error?: number }) {
    const secret = this.config.get<string>('CLICK_SECRET', 'SANDBOX_SECRET');
    if (!verifyClickSign(body, secret)) {
      return { error: -1, error_note: 'SIGN CHECK FAILED' };
    }
    const payment = await this.prisma.payment.findUnique({ where: { id: body.merchant_trans_id } });
    if (!payment) return { error: -5, error_note: 'Order not found' };
    if (typeof body.error === 'number' && body.error < 0) {
      return { error: body.error, error_note: 'Cancelled by client' };
    }
    await this.markPaid(payment.id, String(body.click_trans_id));
    return {
      click_trans_id: body.click_trans_id,
      merchant_trans_id: body.merchant_trans_id,
      merchant_confirm_id: Date.now(),
      error: 0,
      error_note: 'Success',
    };
  }

  // ── Payme webhook (JSON-RPC + Basic auth) ──
  verifyPaymeAuth(authHeader?: string): boolean {
    const key = this.config.get<string>('PAYME_KEY', 'SANDBOX_KEY');
    const expected = 'Basic ' + Buffer.from(`Paycom:${key}`).toString('base64');
    return authHeader === expected;
  }

  async handlePayme(method: string, params: any) {
    switch (method) {
      case 'CheckPerformTransaction': {
        const payment = await this.findPaymeOrder(params);
        if (!payment) return this.paymeError(-31050, 'Order not found');
        if (Number(params.amount) !== Number(payment.amount) * 100) {
          return this.paymeError(-31001, 'Incorrect amount');
        }
        return { result: { allow: true } };
      }
      case 'CreateTransaction': {
        const payment = await this.findPaymeOrder(params);
        if (!payment) return this.paymeError(-31050, 'Order not found');
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { transactionId: params.id },
        });
        return { result: { create_time: Date.now(), transaction: params.id, state: 1 } };
      }
      case 'PerformTransaction': {
        const payment = await this.prisma.payment.findFirst({ where: { transactionId: params.id } });
        if (!payment) return this.paymeError(-31003, 'Transaction not found');
        await this.markPaid(payment.id, params.id);
        return { result: { transaction: params.id, perform_time: Date.now(), state: 2 } };
      }
      case 'CheckTransaction': {
        const payment = await this.prisma.payment.findFirst({ where: { transactionId: params.id } });
        if (!payment) return this.paymeError(-31003, 'Transaction not found');
        return { result: { transaction: params.id, state: payment.status === 'PAID' ? 2 : 1 } };
      }
      case 'CancelTransaction': {
        const payment = await this.prisma.payment.findFirst({ where: { transactionId: params.id } });
        if (!payment) return this.paymeError(-31003, 'Transaction not found');
        await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } });
        return { result: { transaction: params.id, cancel_time: Date.now(), state: -1 } };
      }
      default:
        return this.paymeError(-32601, 'Method not found');
    }
  }

  private async findPaymeOrder(params: any) {
    const orderId = params?.account?.order_id;
    if (!orderId) return null;
    return this.prisma.payment.findUnique({ where: { id: orderId } });
  }

  private paymeError(code: number, message: string) {
    return { error: { code, message: { uz: message, ru: message, en: message } } };
  }
}
