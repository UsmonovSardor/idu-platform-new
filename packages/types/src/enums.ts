/** Domen enumlari — Prisma schema bilan sinxron (single source of truth: DB). */

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const STUDENT_STATUSES = [
  'STUDYING', // O'qimoqda
  'ACADEMIC_LEAVE', // Akademik ta'til
  'EXPELLED', // Chetlashtirilgan
  'GRADUATED', // Bitirgan
  'TRANSFERRED', // Ko'chirilgan
] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const DEGREES = ['BACHELOR', 'MASTER', 'PHD'] as const;
export type Degree = (typeof DEGREES)[number];

export const SEMESTER_SEASONS = ['FALL', 'SPRING', 'SUMMER'] as const;
export type SemesterSeason = (typeof SEMESTER_SEASONS)[number];

/** Davomat holatlari — TZ §7.5. */
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const EXAM_TYPES = ['QUIZ', 'MIDTERM', 'FINAL', 'PRACTICE'] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const QUESTION_TYPES = ['SINGLE', 'MULTIPLE', 'OPEN', 'TRUE_FALSE'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const ADMISSION_STATUSES = [
  'SUBMITTED', // Topshirildi
  'UNDER_REVIEW', // Ko'rib chiqilmoqda
  'ACCEPTED', // Qabul
  'REJECTED', // Rad etildi
] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_GATEWAYS = ['PAYME', 'CLICK', 'CASH', 'BANK'] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

export const DOCUMENT_TYPES = ['REFERENCE', 'TRANSCRIPT', 'CERTIFICATE', 'ORDER'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const NOTIFICATION_CHANNELS = ['IN_APP', 'PUSH', 'TELEGRAM', 'EMAIL', 'SMS'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const LOCALES = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];
