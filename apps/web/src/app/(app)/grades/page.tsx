'use client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, GraduationCap, Layers, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/dashboards/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function GradesPage() {
  const { t } = useI18n();
  const grades = useQuery({ queryKey: ['grades', 'me'], queryFn: () => api.grades.mine() });

  const rows = grades.data?.grades ?? [];
  const totalCredits = rows.reduce((sum, g) => sum + (g.course.credits ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('grades')} subtitle={t('grades.subtitle')} icon={BookOpen} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label={t('gpa')}
          value={grades.data ? grades.data.gpa.toFixed(2) : <Skeleton className="h-8 w-16" />}
          icon={TrendingUp}
          hint="4.0 shkala"
          delay={0}
        />
        <StatCard
          label={t('grades.credits.total')}
          value={grades.data ? totalCredits : <Skeleton className="h-8 w-12" />}
          icon={Layers}
          accent="accent"
          delay={60}
        />
        <StatCard
          label={t('grades.course')}
          value={grades.data ? rows.length : <Skeleton className="h-8 w-12" />}
          icon={GraduationCap}
          accent="success"
          delay={120}
        />
      </div>

      <Card className="animate-fade-up" style={{ animationDelay: '160ms' }}>
        <CardContent className="p-0">
          {grades.isLoading ? (
            <div className="flex flex-col gap-2 p-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted-bg/50 text-left text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">{t('grades.course')}</th>
                    <th className="px-5 py-3 font-semibold">{t('grades.credit')}</th>
                    <th className="px-5 py-3 text-right font-semibold">{t('grades.score')}</th>
                    <th className="px-5 py-3 text-right font-semibold">{t('grades.letter')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((g) => (
                    <tr key={g.id} className="border-t border-border transition-colors hover:bg-muted-bg/40">
                      <td className="px-5 py-3">
                        <div className="font-medium">{g.course.name}</div>
                        <div className="font-mono text-xs text-muted">{g.course.code}</div>
                      </td>
                      <td className="px-5 py-3 text-muted">{g.course.credits}</td>
                      <td className="px-5 py-3 text-right font-mono">{g.total}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge tone={letterTone(g.letter)}>{g.letter ?? '—'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={BookOpen} title={t('no.data')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function letterTone(letter: string | null) {
  if (!letter) return 'default' as const;
  if (['A', 'B'].includes(letter)) return 'success' as const;
  if (['C', 'D'].includes(letter)) return 'primary' as const;
  if (letter === 'E') return 'warning' as const;
  return 'danger' as const;
}
