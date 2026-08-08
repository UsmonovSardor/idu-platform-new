import { z } from 'zod';
import { passwordSchema, phoneSchema } from './common';

export const loginSchema = z.object({
  login: z.string().trim().min(3, 'Login kamida 3 belgi').max(64),
  password: z.string().min(1, 'Parol majburiy'),
  otp: z.string().length(6).optional(), // 2FA kod (R22)
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(), // yo'q bo'lsa httpOnly cookie'dan olinadi
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'Yangi parol eskisidan farq qilishi kerak',
    path: ['newPassword'],
  });

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: phoneSchema.optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

/** Telegram Mini App initData tekshiruvi — TZ §8.2.2. */
export const telegramAuthSchema = z.object({
  initData: z.string().min(1),
});
