'use client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, TrendingUp, UserCheck, Users, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/dashboards/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

function num(v: number): string {
  return new Intl.NumberFormat('uz-UZ').format(v);
}

export default function ReportsPage() {
  const { t } = useI18n();
  const kpi = useQuery({ queryKey: ['kpi'], queryFn: () => api.reports.kpi() });
  const perf = useQuery({ queryKey: ['perf'], queryFn: () => api.reports.performance() });

  function exportCsv() {
    if (!perf.data) return;
    const header = ['Faculty', 'AvgScore', 'GradedCount'];
    const lines = perf.data.map((p) => [p.faculty, p.avgScore, p.gradedCount].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idu-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('reports')}
        subtitle={t('reports.subtitle')}
        icon={BarChart3}
        action={
          <Button variant="outline" onClick={exportCsv} disabled={!perf.data?.length}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('students')}
          value={kpi.data ? kpi.data.students.total : <Skeleton className="h-8 w-14" />}
          icon={Users}
          delay={0}
        />
        <StatCard
          label={t('gpa')}
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
          delay={180}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student status breakdown */}
        <Card className="animate-fade-up" style={{ animationDelay: '220ms' }}>
          <CardHeader>
            <CardTitle>Talaba holati bo&apos;yicha</CardTitle>
          </CardHeader>
          <CardContent>
            {kpi.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : kpi.data ? (
              <div className="flex flex-col gap-2.5">
                {Object.entries(kpi.data.students.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{status}</span>
                    <span className="font-mono font-semibold">{num(count)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title={t('no.data')} />
            )}
          </CardContent>
        </Card>

        {/* Payment breakdown */}
        <Card className="animate-fade-up" style={{ animationDelay: '260ms' }}>
          <CardHeader>
            <CardTitle>To&apos;lov ko&apos;rsatkichlari</CardTitle>
          </CardHeader>
          <CardContent>
            {kpi.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : kpi.data ? (
              <div className="flex flex-col gap-2.5 text-sm">
                <Row label={t('payments.amount')} value={`${num(kpi.data.payments.totalAmount)} so'm`} />
                <Row label={t('payments.paid')} value={`${num(kpi.data.payments.paidAmount)} so'm`} />
                <Row label={t('payments.pending')} value={`${num(kpi.data.payments.pendingAmount)} so'm`} />
                <Row label="Yig'im darajasi" value={`${kpi.data.payments.collectionRate}%`} />
              </div>
            ) : (
              <EmptyState icon={Wallet} title={t('no.data')} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Faculty performance table */}
      <Card className="animate-fade-up" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle>Fakultet bo&apos;yicha o&apos;zlashtirish</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {perf.isLoading ? (
            <div className="flex flex-col gap-2 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : perf.data && perf.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted-bg/50 text-left text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">{t('reports.faculty')}</th>
                    <th className="px-5 py-3 text-right font-semibold">{t('reports.avg.score')}</th>
                    <th className="px-5 py-3 text-right font-semibold">{t('reports.graded')}</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.data.map((p) => (
                    <tr key={p.faculty} className="border-t border-border transition-colors hover:bg-muted-bg/40">
                      <td className="px-5 py-3 font-medium">{p.faculty}</td>
                      <td className="px-5 py-3 text-right font-mono">{p.avgScore}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted">{p.gradedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={BarChart3} title={t('no.data')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
