'use client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/dashboards/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

function money(v: number | string): string {
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('uz-UZ').format(n);
}

function statusTone(status: string) {
  switch (status) {
    case 'PAID':
      return 'success' as const;
    case 'PARTIAL':
      return 'primary' as const;
    case 'PENDING':
      return 'warning' as const;
    case 'OVERDUE':
      return 'danger' as const;
    default:
      return 'default' as const;
  }
}

export default function PaymentsPage() {
  const { t } = useI18n();
  const q = useQuery({ queryKey: ['payments', 'me'], queryFn: () => api.payments.mine() });

  const payments = q.data?.payments ?? [];
  const paid = payments.reduce((s, p) => s + Number(p.paidAmount || 0), 0);
  const pending = payments.reduce((s, p) => s + Math.max(Number(p.amount || 0) - Number(p.paidAmount || 0), 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('payments')} subtitle={t('payments.subtitle')} icon={Wallet} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t('payments.balance')}
          value={q.data ? money(q.data.balance) : <Skeleton className="h-8 w-24" />}
          icon={Wallet}
          hint="so'm"
          delay={0}
        />
        <StatCard
          label={t('payments.paid')}
          value={q.data ? money(paid) : <Skeleton className="h-8 w-24" />}
          icon={CheckCircle2}
          accent="success"
          hint="so'm"
          delay={60}
        />
        <StatCard
          label={t('payments.pending')}
          value={q.data ? money(pending) : <Skeleton className="h-8 w-24" />}
          icon={Clock}
          accent="accent"
          hint="so'm"
          delay={120}
        />
      </div>

      <Card className="animate-fade-up" style={{ animationDelay: '160ms' }}>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="flex flex-col gap-2 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted-bg/50 text-left text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 text-right font-semibold">{t('payments.amount')}</th>
                    <th className="px-5 py-3 text-right font-semibold">{t('payments.paid')}</th>
                    <th className="px-5 py-3 font-semibold">{t('payments.gateway')}</th>
                    <th className="px-5 py-3 font-semibold">{t('payments.due')}</th>
                    <th className="px-5 py-3 text-right font-semibold">{t('payments.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-border transition-colors hover:bg-muted-bg/40">
                      <td className="px-5 py-3 text-right font-mono">{money(p.amount)}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted">{money(p.paidAmount)}</td>
                      <td className="px-5 py-3 capitalize">{p.gateway?.toLowerCase() ?? '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">
                        {p.dueDate ? new Date(p.dueDate).toLocaleDateString('uz-UZ') : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge tone={statusTone(p.status)}>
                          {t(`payments.status.${p.status}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Wallet} title={t('no.data')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
