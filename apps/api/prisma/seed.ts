import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ACTIONS,
  ROLE_LABELS,
  ROLES,
  SUBJECTS,
  type Action,
  type Role,
  type Subject,
} from '@idu/types';

const prisma = new PrismaClient();

/**
 * Rol → ruxsatlar xaritasi (TZ §6, Table 7 asosida).
 * 'manage' = to'liq (yozish/o'zgartirish), 'read' = faqat ko'rish.
 */
const ROLE_POLICIES: Record<Role, Array<{ action: Action; subject: Subject }>> = {
  ADMIN: [{ action: 'manage', subject: 'all' }],
  RECTOR: [
    { action: 'read', subject: 'all' },
    { action: 'manage', subject: 'Report' },
  ],
  DEANERY: [
    { action: 'manage', subject: 'Student' },
    { action: 'manage', subject: 'Schedule' },
    { action: 'manage', subject: 'Payment' },
    { action: 'manage', subject: 'Document' },
    { action: 'manage', subject: 'Admission' },
    { action: 'manage', subject: 'Announcement' },
    { action: 'read', subject: 'Grade' },
    { action: 'read', subject: 'Report' },
    { action: 'read', subject: 'Faculty' },
    { action: 'read', subject: 'Course' },
  ],
  DEPARTMENT_HEAD: [
    { action: 'manage', subject: 'Course' },
    { action: 'read', subject: 'Teacher' },
    { action: 'read', subject: 'Grade' },
    { action: 'read', subject: 'Schedule' },
    { action: 'read', subject: 'Report' },
  ],
  CURATOR: [
    { action: 'read', subject: 'Student' },
    { action: 'read', subject: 'Grade' },
    { action: 'update', subject: 'Attendance' },
    { action: 'read', subject: 'Attendance' },
  ],
  TEACHER: [
    { action: 'create', subject: 'Grade' },
    { action: 'update', subject: 'Grade' },
    { action: 'read', subject: 'Grade' },
    { action: 'manage', subject: 'Attendance' },
    { action: 'manage', subject: 'Exam' },
    { action: 'manage', subject: 'Assignment' },
    { action: 'read', subject: 'Schedule' },
    { action: 'read', subject: 'Student' },
  ],
  STUDENT: [
    { action: 'read', subject: 'Grade' },
    { action: 'read', subject: 'Schedule' },
    { action: 'read', subject: 'Attendance' },
    { action: 'create', subject: 'Submission' },
    { action: 'read', subject: 'Payment' },
    { action: 'read', subject: 'Document' },
    { action: 'read', subject: 'Announcement' },
  ],
  PARENT: [
    { action: 'read', subject: 'Grade' },
    { action: 'read', subject: 'Attendance' },
    { action: 'read', subject: 'Payment' },
  ],
  APPLICANT: [{ action: 'create', subject: 'Admission' }],
};

async function seedPermissions() {
  // Barcha action×subject kombinatsiyalari (idempotent)
  for (const action of ACTIONS) {
    for (const subject of SUBJECTS) {
      await prisma.permission.upsert({
        where: { action_subject: { action, subject } },
        create: { action, subject },
        update: {},
      });
    }
  }
}

async function seedRoles() {
  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { name },
      create: { name, label: ROLE_LABELS[name].uz, isSystem: true },
      update: { label: ROLE_LABELS[name].uz },
    });

    // Ruxsatlarni biriktirish
    const policies = ROLE_POLICIES[name];
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const { action, subject } of policies) {
      const perm = await prisma.permission.findUnique({
        where: { action_subject: { action, subject } },
      });
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }
}

async function seedAdmin() {
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  // Dev uchun barqaror 2FA secret (R22 — admin uchun majburiy). Prod'da har admin o'zi enroll qiladi.
  const devSecret = 'JBSWY3DPEHPK3PXP';
  await prisma.user.upsert({
    where: { login: 'admin' },
    create: {
      fullName: 'Tizim Administratori',
      login: 'admin',
      email: 'admin@idu.uz',
      passwordHash,
      roleId: adminRole.id,
      status: 'ACTIVE',
      emailVerified: true,
      twoFactorEnabled: true,
      twoFactorSecret: devSecret,
    },
    update: { twoFactorSecret: devSecret, twoFactorEnabled: true },
  });
  const otpauth = `otpauth://totp/IDU:admin?secret=${devSecret}&issuer=IDU`;
  console.log(`   2FA (dev): ${otpauth}`);
}

async function seedDemo() {
  // Namunaviy akademik struktura
  const faculty = await prisma.faculty.upsert({
    where: { code: 'ICT' },
    create: { name: 'Axborot texnologiyalari', code: 'ICT' },
    update: {},
  });
  const program = await prisma.program.create({
    data: { name: 'Kompyuter injiniringi', facultyId: faculty.id, degree: 'BACHELOR' },
  });
  await prisma.group.create({ data: { name: 'CS-21', programId: program.id, year: 2 } });

  // Demo o'qituvchi
  const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: 'TEACHER' } });
  const teacherUser = await prisma.user.upsert({
    where: { login: 'teacher' },
    create: {
      fullName: 'Aliyev Vali',
      login: 'teacher',
      passwordHash: await bcrypt.hash('Teacher123!', 12),
      roleId: teacherRole.id,
      status: 'ACTIVE',
    },
    update: {},
  });
  await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    create: { userId: teacherUser.id, title: 'dotsent' },
    update: {},
  });

  // Demo talaba
  const studentRole = await prisma.role.findUniqueOrThrow({ where: { name: 'STUDENT' } });
  const studentUser = await prisma.user.upsert({
    where: { login: 'student' },
    create: {
      fullName: 'Karimov Sardor',
      login: 'student',
      passwordHash: await bcrypt.hash('Student123!', 12),
      roleId: studentRole.id,
      status: 'ACTIVE',
    },
    update: {},
  });
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    create: { userId: studentUser.id, studentNumber: '2021001', status: 'STUDYING' },
    update: {},
  });
}

async function main() {
  console.log('🌱 Seeding...');
  await seedPermissions();
  await seedRoles();
  await seedAdmin();
  await seedDemo();
  console.log('✅ Seed tugadi. Kirish: admin / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
