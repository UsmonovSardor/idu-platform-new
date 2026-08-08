import { z } from 'zod';
import { DEGREES, SEMESTER_SEASONS } from '@idu/types';

export const facultySchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().min(1).max(20),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(150),
  facultyId: z.string().uuid(),
});

export const programSchema = z.object({
  name: z.string().trim().min(2).max(150),
  facultyId: z.string().uuid(),
  degree: z.enum(DEGREES),
});

export const groupSchema = z.object({
  name: z.string().trim().min(1).max(30),
  programId: z.string().uuid(),
  year: z.number().int().min(1).max(7),
  curatorId: z.string().uuid().optional(),
});

export const courseSchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().min(1).max(20),
  credits: z.number().int().min(1).max(30),
  teacherId: z.string().uuid().optional(),
});

export const semesterSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Masalan: 2025-2026'),
  season: z.enum(SEMESTER_SEASONS),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
