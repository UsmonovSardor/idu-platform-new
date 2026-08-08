import { z } from 'zod';
import { GRADE_COMPONENTS } from '@idu/types';

/** Baho kiritish — har komponent o'z chegarasida (TZ §7.3 validatsiya). */
export const gradeInputSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  jn: z.number().min(0).max(GRADE_COMPONENTS.JN.max),
  on: z.number().min(0).max(GRADE_COMPONENTS.ON.max),
  yn: z.number().min(0).max(GRADE_COMPONENTS.YN.max),
  mi: z.number().min(0).max(GRADE_COMPONENTS.MI.max),
});
export type GradeInputDto = z.infer<typeof gradeInputSchema>;

/** Guruhga ommaviy baho kiritish. */
export const bulkGradeSchema = z.object({
  courseId: z.string().uuid(),
  grades: z.array(gradeInputSchema.omit({ courseId: true })).min(1).max(200),
});
