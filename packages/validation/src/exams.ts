import { z } from 'zod';
import { EXAM_TYPES, QUESTION_TYPES } from '@idu/types';

/** Savol varianti (o'qituvchi kiritadi; id serverda beriladi). */
const optionInputSchema = z.object({
  text: z.string().trim().min(1).max(500),
  correct: z.boolean().default(false),
});

export const questionSchema = z
  .object({
    courseId: z.string().uuid().optional(),
    examId: z.string().uuid().optional(),
    type: z.enum(QUESTION_TYPES),
    text: z.string().trim().min(1).max(2000),
    points: z.number().min(0.5).max(100).default(1),
    options: z.array(optionInputSchema).max(10).optional(),
  })
  .refine((q) => q.courseId || q.examId, {
    message: "courseId yoki examId ko'rsatilishi kerak",
    path: ['courseId'],
  })
  .refine((q) => q.type === 'OPEN' || (q.options && q.options.length >= 2), {
    message: 'Test savoli kamida 2 variant talab qiladi',
    path: ['options'],
  })
  .refine((q) => q.type === 'OPEN' || (q.options ?? []).some((o) => o.correct), {
    message: "Kamida bitta to'g'ri variant belgilanishi kerak",
    path: ['options'],
  });
export type QuestionDto = z.infer<typeof questionSchema>;

export const examSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(150),
  type: z.enum(EXAM_TYPES).default('QUIZ'),
  timeLimitMin: z.number().int().min(1).max(360).default(30),
  maxAttempts: z.number().int().min(1).max(10).default(1),
  shuffle: z.boolean().default(true),
  proctoring: z.boolean().default(false),
  opensAt: z.coerce.date().optional(),
  closesAt: z.coerce.date().optional(),
});
export type ExamDto = z.infer<typeof examSchema>;

export const submitAttemptSchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string().uuid(), value: z.unknown() }))
    .min(1)
    .max(200),
});
export type SubmitAttemptDto = z.infer<typeof submitAttemptSchema>;

/** Proctoring hodisasi — tab almashtirish/nusxa (§7.6, R25). */
export const proctorEventSchema = z.object({
  type: z.enum(['TAB_SWITCH', 'COPY', 'BLUR', 'FULLSCREEN_EXIT']),
});
export type ProctorEventDto = z.infer<typeof proctorEventSchema>;

export const gradeOpenAnswerSchema = z.object({
  score: z.number().min(0),
});
