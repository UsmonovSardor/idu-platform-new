/**
 * Fine-grained ruxsatlar — CASL uchun (R21).
 * Format: `<action>:<subject>`. Wildcard `manage` = barcha amallar, `all` = barcha subyektlar.
 */
export const ACTIONS = ['manage', 'create', 'read', 'update', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

export const SUBJECTS = [
  'all',
  'User',
  'Role',
  'Faculty',
  'Department',
  'Program',
  'Group',
  'Student',
  'Teacher',
  'Course',
  'Grade',
  'Schedule',
  'Attendance',
  'Exam',
  'Assignment',
  'Submission',
  'Admission',
  'Payment',
  'Document',
  'Announcement',
  'Chat',
  'Forum',
  'Notification',
  'AuditLog',
  'Report',
  'Setting',
] as const;
export type Subject = (typeof SUBJECTS)[number];

export type PermissionTuple = { action: Action; subject: Subject };
