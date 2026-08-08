import { z } from 'zod';
import { ATTENDANCE_STATUSES } from '@idu/types';

export const markAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  date: z.coerce.date(),
  status: z.enum(ATTENDANCE_STATUSES),
  note: z.string().max(200).optional(),
});
export type MarkAttendanceDto = z.infer<typeof markAttendanceSchema>;

/** Guruhga ommaviy davomat belgilash. */
export const bulkAttendanceSchema = z.object({
  courseId: z.string().uuid(),
  date: z.coerce.date(),
  records: z
    .array(z.object({ studentId: z.string().uuid(), status: z.enum(ATTENDANCE_STATUSES) }))
    .min(1)
    .max(200),
});
export type BulkAttendanceDto = z.infer<typeof bulkAttendanceSchema>;

/** O'qituvchi QR sessiya ochadi (§7.5). */
export const qrGenerateSchema = z.object({
  courseId: z.string().uuid(),
  ttlSeconds: z.number().int().min(30).max(1800).default(300),
});
export type QrGenerateDto = z.infer<typeof qrGenerateSchema>;

/** Talaba QR token bilan o'zini belgilaydi (soxta oldi olinadi). */
export const qrSubmitSchema = z.object({
  token: z.string().min(10),
});
export type QrSubmitDto = z.infer<typeof qrSubmitSchema>;
