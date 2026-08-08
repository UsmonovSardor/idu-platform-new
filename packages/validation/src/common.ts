import { z } from 'zod';
import { LOCALES, THEMES } from '@idu/types';

/** UUID id parametri. */
export const idSchema = z.string().uuid();

/** Pagination + saralash — TZ §12.1. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  search: z.string().trim().max(200).optional(),
});
export type PaginationDto = z.infer<typeof paginationSchema>;

export const localeSchema = z.enum(LOCALES);
export const themeSchema = z.enum(THEMES);

/** O'zbekiston telefon formati (+998XXXXXXXXX). */
export const phoneSchema = z
  .string()
  .regex(/^\+998\d{9}$/, 'Telefon +998XXXXXXXXX formatida bo\'lishi kerak');

/** Kuchli parol siyosati. */
export const passwordSchema = z
  .string()
  .min(8, 'Parol kamida 8 belgi')
  .max(72, 'Parol 72 belgidan oshmasin')
  .regex(/[a-z]/, 'Kamida bitta kichik harf')
  .regex(/[A-Z]/, 'Kamida bitta katta harf')
  .regex(/\d/, 'Kamida bitta raqam');
