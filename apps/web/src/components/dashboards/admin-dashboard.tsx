'use client';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, TrendingUp, UserCheck, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { StatCard } from './stat-card';

export function AdminDashboard() {
  const { user } = useAuth();
  const kpi = useQuery({ queryKey: ['kpi'], queryFn: () => api.reports.kpi() });
  const perf = useQuery({ queryKey: ['perf'], queryFn: () => api.reports.performance() });

  const maxScore = Math.max(1, ...(perf.data?.map((p) => p.avgScore) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      <header className="animate-fade-up">
        <div className="text-sm text-muted">Rahbariyat paneli</div>
        <h1 className="text-2xl font-extrabold tracking-tight">Xush kelibsiz, {user?.login}</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Talabalar"
          value={kpi.data ? kpi.data.students.total : <Skeleton className="h-8 w-14" />}
          icon={GraduationCap}
          delay={0}
        />
        <StatCard
          label="O'rtacha GPA"
          value={kpi.data ? kpi.data.performance.avgGpa.toFixed(2) : <Skeleton className="h-8 w-14" />}
          icon={TrendingUp}
          accent="success"
          delay={60}
        />
        <StatCard
          label="Davomat"
          value={kpi.data ? `${kpi.data.attendance.rate}%` : <Skeleton className="h-8 w-14" />}
          icon={UserCheck}
          delay={120}
        />
        <StatCard
          label="To'lov yig'imi"
          value={kpi.data ? `${kpi.data.payments.collectionRate}%` : <Skeleton className="h-8 w-14" />}
          icon={Wallet}
          accent="accent"
          hint={kpi.data ? `${kpi.data.payments.pendingAmount.toLocaleString()} so'm qoldiq` : undefined}
          delay={180}
        />
      </div>

      <Card className="animate-fade-up" style={{ animationDelay: '220ms' }}>
        <CardHeader>
          <CardTitle>Fakultet bo&apos;yicha o&apos;zlashtirish</CardTitle>
        </CardHeader>
        <CardContent>
          {perf.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : perf.data && perf.data.length > 0 ? (
            <div className="flex flex-col gap-4">
              {perf.data.map((p) => (
                <div key={p.faculty}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{p.faculty}</span>
                    <span className="font-mono text-muted">
                      {p.avgScore} · {p.gradedCount} baho
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted-bg">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(p.avgScore / maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">Ma&apos;lumot yo&apos;q</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
