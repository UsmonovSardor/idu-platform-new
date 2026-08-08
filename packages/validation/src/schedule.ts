import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:MM"

export const scheduleSchema = z
  .object({
    courseId: z.string().uuid(),
    groupId: z.string().uuid(),
    weekday: z.number().int().min(1).max(7), // 1=Dushanba ... 7=Yakshanba
    startTime: z.string().regex(timeRegex, 'Vaqt HH:MM formatida'),
    endTime: z.string().regex(timeRegex, 'Vaqt HH:MM formatida'),
    room: z.string().trim().min(1).max(30),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "Boshlanish vaqti tugash vaqtidan oldin bo'lishi kerak",
    path: ['endTime'],
  });
export type ScheduleDto = z.infer<typeof scheduleSchema>;
