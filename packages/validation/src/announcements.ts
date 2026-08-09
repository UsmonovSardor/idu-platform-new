import { z } from 'zod';

const scopeRegex = /^(UNIVERSITY|FACULTY:[0-9a-fA-F-]{36}|GROUP:[0-9a-fA-F-]{36})$/;

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(10000), // HTML — serverda sanitize qilinadi
  scope: z.string().regex(scopeRegex, 'scope: UNIVERSITY | FACULTY:<uuid> | GROUP:<uuid>'),
});
export type AnnouncementDto = z.infer<typeof announcementSchema>;

export const forumTopicSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(1).max(5000),
});
export type ForumTopicDto = z.infer<typeof forumTopicSchema>;

export const forumPostSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});
export type ForumPostDto = z.infer<typeof forumPostSchema>;

export const chatMessageSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});
export type ChatMessageDto = z.infer<typeof chatMessageSchema>;

export const createRoomSchema = z.object({
  name: z.string().trim().max(100).optional(),
  memberIds: z.array(z.string().uuid()).min(1).max(200),
  isGroup: z.boolean().default(false),
});
export type CreateRoomDto = z.infer<typeof createRoomSchema>;
