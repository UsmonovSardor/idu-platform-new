import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ACTIONS,
  MFA_REQUIRED_ROLES,
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
    { action: 'read', subject: 'Course' },
    { action: 'read', subject: 'Schedule' },
    { action: 'read', subject: 'Student' },
    { action: 'read', subject: 'Forum' },
    { action: 'create', subject: 'Forum' },
    { action: 'read', subject: 'Chat' },
    { action: 'create', subject: 'Chat' },
  ],
  STUDENT: [
    { action: 'read', subject: 'Grade' },
    { action: 'read', subject: 'Schedule' },
    { action: 'read', subject: 'Attendance' },
    { action: 'create', subject: 'Submission' },
    { action: 'read', subject: 'Exam' },
    { action: 'read', subject: 'Payment' },
    { action: 'read', subject: 'Document' },
    { action: 'read', subject: 'Announcement' },
    { action: 'read', subject: 'Forum' },
    { action: 'create', subject: 'Forum' },
    { action: 'read', subject: 'Chat' },
    { action: 'create', subject: 'Chat' },
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
  const program =
    (await prisma.program.findFirst({ where: { name: 'Kompyuter injiniringi', facultyId: faculty.id } })) ??
    (await prisma.program.create({
      data: { name: 'Kompyuter injiniringi', facultyId: faculty.id, degree: 'BACHELOR' },
    }));
  const group =
    (await prisma.group.findFirst({ where: { name: 'CS-21', programId: program.id } })) ??
    (await prisma.group.create({ data: { name: 'CS-21', programId: program.id, year: 2 } }));

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
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    create: { userId: studentUser.id, groupId: group.id, studentNumber: '2021001', status: 'STUDYING' },
    update: { groupId: group.id },
  });

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { userId: teacherUser.id } });

  // Semester + fan + enrollment
  const semester = await prisma.semester.upsert({
    where: { academicYear_season: { academicYear: '2025-2026', season: 'FALL' } },
    create: {
      academicYear: '2025-2026',
      season: 'FALL',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      isActive: true,
    },
    update: { isActive: true },
  });

  const existingCourse = await prisma.course.findFirst({ where: { code: 'CS101' } });
  const course =
    existingCourse ??
    (await prisma.course.create({
      data: {
        name: 'Dasturlash asoslari',
        code: 'CS101',
        credits: 6,
        teacherId: teacher.id,
        semesterId: semester.id,
      },
    }));

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    create: { studentId: student.id, courseId: course.id },
    update: {},
  });

  // Jadval (dushanba 09:00–10:20, xona 201)
  const hasSchedule = await prisma.schedule.findFirst({ where: { courseId: course.id, groupId: group.id } });
  if (!hasSchedule) {
    await prisma.schedule.create({
      data: {
        courseId: course.id,
        groupId: group.id,
        weekday: 1,
        startTime: '09:00',
        endTime: '10:20',
        room: '201',
      },
    });
  }

  // Topshiriq
  const hasAssignment = await prisma.assignment.findFirst({ where: { courseId: course.id } });
  if (!hasAssignment) {
    await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: 'Laboratoriya 1 — massivlar',
        description: 'Massiv ustida asosiy amallar',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        createdBy: teacherUser.id,
      },
    });
  }

  // Namunaviy imtihon + savollar
  const hasExam = await prisma.exam.findFirst({ where: { courseId: course.id } });
  if (!hasExam) {
    const exam = await prisma.exam.create({
      data: {
        courseId: course.id,
        title: 'Oraliq test — massivlar',
        type: 'MIDTERM',
        timeLimitMin: 20,
        maxAttempts: 2,
        shuffle: true,
        proctoring: true,
        createdBy: teacherUser.id,
      },
    });
    await prisma.question.create({
      data: {
        examId: exam.id,
        courseId: course.id,
        type: 'SINGLE',
        text: 'Massiv indeksi qaysi qiymatdan boshlanadi?',
        points: 2,
        options: [
          { id: 'o1', text: '0', correct: true },
          { id: 'o2', text: '1', correct: false },
        ],
      },
    });
    await prisma.question.create({
      data: {
        examId: exam.id,
        courseId: course.id,
        type: 'MULTIPLE',
        text: "Quyidagilardan qaysilari chiziqli ma'lumot tuzilmasi?",
        points: 3,
        options: [
          { id: 'a', text: 'Massiv', correct: true },
          { id: 'b', text: 'Bog\'langan ro\'yxat', correct: true },
          { id: 'c', text: 'Graf', correct: false },
        ],
      },
    });
    console.log(`   Demo exam: ${exam.title} (2 savol)`);
  }

  // Namunaviy kontrakt to'lovi
  const hasPayment = await prisma.payment.findFirst({ where: { studentId: student.id } });
  if (!hasPayment) {
    await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: 12_000_000,
        gateway: 'PAYME',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`   Demo: course ${course.code}, student ${student.studentNumber} enrolled`);
}

/**
 * Qolgan rollar uchun demo akkauntlar (login sinovi uchun).
 * DEANERY va RECTOR — 2FA majburiy (MFA_REQUIRED_ROLES), dev secret bilan.
 */
const DEMO_ACCOUNTS: Array<{
  login: string;
  password: string;
  role: Role;
  fullName: string;
  email: string;
}> = [
  { login: 'curator', password: 'Curator123!', role: 'CURATOR', fullName: 'Nazarova Dilnoza', email: 'curator@idu.uz' },
  { login: 'depthead', password: 'DeptHead123!', role: 'DEPARTMENT_HEAD', fullName: 'Rahimov Jasur', email: 'depthead@idu.uz' },
  { login: 'deanery', password: 'Deanery123!', role: 'DEANERY', fullName: 'Yusupova Kamola', email: 'deanery@idu.uz' },
  { login: 'rector', password: 'Rector123!', role: 'RECTOR', fullName: 'Abdullayev Bekzod', email: 'rector@idu.uz' },
  { login: 'parent', password: 'Parent123!', role: 'PARENT', fullName: 'Karimov Akmal', email: 'parent@idu.uz' },
  { login: 'applicant', password: 'Applicant123!', role: 'APPLICANT', fullName: 'Tosheva Nigora', email: 'applicant@idu.uz' },
];

async function seedRoleAccounts() {
  // Admin bilan bir xil dev 2FA secret — bitta authenticator hammasiga ishlaydi.
  const devSecret = 'JBSWY3DPEHPK3PXP';

  for (const acc of DEMO_ACCOUNTS) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: acc.role } });
    const needs2fa = MFA_REQUIRED_ROLES.includes(acc.role);
    await prisma.user.upsert({
      where: { login: acc.login },
      create: {
        fullName: acc.fullName,
        login: acc.login,
        email: acc.email,
        passwordHash: await bcrypt.hash(acc.password, 12),
        roleId: role.id,
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: needs2fa,
        twoFactorSecret: needs2fa ? devSecret : null,
      },
      update: {
        roleId: role.id,
        status: 'ACTIVE',
        twoFactorEnabled: needs2fa,
        twoFactorSecret: needs2fa ? devSecret : null,
      },
    });
  }

  // Kuratorni CS-21 guruhga biriktiramiz (realizm uchun)
  const curator = await prisma.user.findUnique({ where: { login: 'curator' } });
  const group = await prisma.group.findFirst({ where: { name: 'CS-21' } });
  if (curator && group && group.curatorId !== curator.id) {
    await prisma.group.update({ where: { id: group.id }, data: { curatorId: curator.id } });
  }

  // Demo abituriyent arizasi — dekanat ko'rib chiqishi uchun
  const hasAdmission = await prisma.admission.findFirst({ where: { email: 'applicant@idu.uz' } });
  if (!hasAdmission) {
    await prisma.admission.create({
      data: {
        fullName: 'Tosheva Nigora',
        email: 'applicant@idu.uz',
        phone: '+998901234567',
        status: 'SUBMITTED',
      },
    });
  }

  console.log(`   Demo rol akkauntlari: ${DEMO_ACCOUNTS.map((a) => a.login).join(', ')}`);
}

async function seedBadges() {
  const badges = [
    { code: 'STARTER', name: 'Boshlovchi', icon: '🌱', threshold: 10 },
    { code: 'BRONZE', name: 'Bronza', icon: '🥉', threshold: 100 },
    { code: 'SILVER', name: 'Kumush', icon: '🥈', threshold: 500 },
    { code: 'GOLD', name: 'Oltin', icon: '🥇', threshold: 1000 },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { code: b.code }, create: b, update: b });
  }
}

async function main() {
  console.log('🌱 Seeding...');
  await seedPermissions();
  await seedRoles();
  await seedAdmin();
  await seedBadges();
  await seedDemo();
  await seedRoleAccounts();
  console.log('✅ Seed tugadi. Demo kirish:');
  console.log('   admin / Admin123!  (2FA)');
  console.log('   teacher / Teacher123!');
  console.log('   student / Student123!');
  console.log('   curator / Curator123!');
  console.log('   depthead / DeptHead123!');
  console.log('   deanery / Deanery123!  (2FA)');
  console.log('   rector / Rector123!  (2FA)');
  console.log('   parent / Parent123!');
  console.log('   applicant / Applicant123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
