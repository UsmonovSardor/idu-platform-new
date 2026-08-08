/**
 * Foydalanuvchi rollari — TZ §5 (Table 6).
 * Rollar DB'da saqlanadi (R7), bu yerda kanonik nomlar va yordamchi tiplar.
 */
export const ROLES = [
  'STUDENT', // Talaba
  'TEACHER', // O'qituvchi
  'CURATOR', // Kurator (tьютор)
  'DEPARTMENT_HEAD', // Kafedra mudiri
  'DEANERY', // Dekanat
  'RECTOR', // Rektor
  'PARENT', // Ota-ona
  'APPLICANT', // Abituriyent
  'ADMIN', // Tizim ma'muri
] as const;

export type Role = (typeof ROLES)[number];

/** Rol nomlarining ko'p tilli yorliqlari (UI uchun). */
export const ROLE_LABELS: Record<Role, { uz: string; ru: string; en: string }> = {
  STUDENT: { uz: 'Talaba', ru: 'Студент', en: 'Student' },
  TEACHER: { uz: "O'qituvchi", ru: 'Преподаватель', en: 'Teacher' },
  CURATOR: { uz: 'Kurator', ru: 'Куратор', en: 'Curator' },
  DEPARTMENT_HEAD: { uz: 'Kafedra mudiri', ru: 'Заведующий кафедрой', en: 'Department Head' },
  DEANERY: { uz: 'Dekanat', ru: 'Деканат', en: 'Deanery' },
  RECTOR: { uz: 'Rektor', ru: 'Ректор', en: 'Rector' },
  PARENT: { uz: 'Ota-ona', ru: 'Родитель', en: 'Parent' },
  APPLICANT: { uz: 'Abituriyent', ru: 'Абитуриент', en: 'Applicant' },
  ADMIN: { uz: 'Administrator', ru: 'Администратор', en: 'Administrator' },
};

/** 2FA majburiy bo'lgan rollar — TZ §7.1 (R22). */
export const MFA_REQUIRED_ROLES: readonly Role[] = ['ADMIN', 'DEANERY', 'RECTOR'];
