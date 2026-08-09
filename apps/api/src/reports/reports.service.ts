import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Rahbariyat KPI dashboard (R35): talaba, o'zlashtirish, davomat, to'lov. */
  async kpi() {
    const [students, byStatus, gpaAgg, attendance, payments] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.student.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
      this.prisma.student.aggregate({ where: { deletedAt: null }, _avg: { gpa: true } }),
      this.prisma.attendance.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.payment.aggregate({ where: { deletedAt: null }, _sum: { amount: true, paidAmount: true } }),
    ]);

    const attTotal = attendance.reduce((s, a) => s + a._count._all, 0);
    const attPresent = attendance.find((a) => a.status === 'PRESENT')?._count._all ?? 0;
    const totalAmount = Number(payments._sum.amount ?? 0);
    const paidAmount = Number(payments._sum.paidAmount ?? 0);

    return {
      students: {
        total: students,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      },
      performance: { avgGpa: Math.round((gpaAgg._avg.gpa ?? 0) * 100) / 100 },
      attendance: {
        total: attTotal,
        rate: attTotal ? Math.round((attPresent / attTotal) * 100) : 0,
      },
      payments: {
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
        collectionRate: totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0,
      },
    };
  }

  /** Fakultet bo'yicha o'rtacha o'zlashtirish (filtrlanadigan hisobot). */
  async performanceByFaculty() {
    const grades = await this.prisma.grade.findMany({
      where: { deletedAt: null },
      select: {
        total: true,
        student: { select: { group: { select: { program: { select: { faculty: { select: { name: true } } } } } } } },
      },
    });
    const acc = new Map<string, { sum: number; count: number }>();
    for (const g of grades) {
      const name = g.student.group?.program.faculty.name ?? 'Noma\'lum';
      const cur = acc.get(name) ?? { sum: 0, count: 0 };
      cur.sum += g.total;
      cur.count += 1;
      acc.set(name, cur);
    }
    return [...acc.entries()].map(([faculty, v]) => ({
      faculty,
      avgScore: Math.round((v.sum / v.count) * 10) / 10,
      gradedCount: v.count,
    }));
  }

  /** Talabalar CSV eksporti (Excel'da ochiladi). */
  async studentsCsv(): Promise<string> {
    const students = await this.prisma.student.findMany({
      where: { deletedAt: null },
      include: { user: { select: { fullName: true, email: true } }, group: { select: { name: true } } },
      orderBy: { studentNumber: 'asc' },
    });
    const header = ['Talaba raqami', 'F.I.Sh', 'Email', 'Guruh', 'GPA', 'Holat'];
    const rows = students.map((s) => [
      s.studentNumber,
      s.user.fullName,
      s.user.email ?? '',
      s.group?.name ?? '',
      String(s.gpa),
      s.status,
    ]);
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    return [header, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  }
}
