import { z } from 'zod';
import { PAYMENT_GATEWAYS } from '@idu/types';

export const createPaymentSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000_000),
  gateway: z.enum(PAYMENT_GATEWAYS).default('PAYME'),
  dueDate: z.coerce.date().optional(),
});
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;

export const checkoutSchema = z.object({
  gateway: z.enum(PAYMENT_GATEWAYS).optional(),
});
