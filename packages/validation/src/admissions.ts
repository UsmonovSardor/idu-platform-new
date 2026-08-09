import { z } from 'zod';
import { phoneSchema } from './common';

export const admissionSubmitSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  email: z.string().email(),
  phone: phoneSchema,
  programId: z.string().uuid().optional(),
  documents: z.array(z.object({ name: z.string(), url: z.string().url() })).max(20).optional(),
});
export type AdmissionSubmitDto = z.infer<typeof admissionSubmitSchema>;

export const admissionReviewSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'ACCEPTED', 'REJECTED']),
  reviewNote: z.string().max(500).optional(),
});
export type AdmissionReviewDto = z.infer<typeof admissionReviewSchema>;

export const admissionConvertSchema = z.object({
  login: z.string().trim().min(3).max(64),
  studentNumber: z.string().trim().min(1).max(30),
  groupId: z.string().uuid(),
});
export type AdmissionConvertDto = z.infer<typeof admissionConvertSchema>;
