import { z } from 'zod';

export const assignmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(150),
  description: z.string().max(2000).optional(),
  deadline: z.coerce.date(),
  maxScore: z.number().min(1).max(100).default(100),
});
export type AssignmentDto = z.infer<typeof assignmentSchema>;

export const submitAssignmentSchema = z.object({
  fileUrl: z.string().url().optional(),
  comment: z.string().max(1000).optional(),
});
export type SubmitAssignmentDto = z.infer<typeof submitAssignmentSchema>;

export const gradeSubmissionSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().max(1000).optional(),
});
export type GradeSubmissionDto = z.infer<typeof gradeSubmissionSchema>;
