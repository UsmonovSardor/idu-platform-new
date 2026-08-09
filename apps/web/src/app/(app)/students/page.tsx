'use client';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

function statusTone(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success' as const;
    case 'GRADUATED':
      return 'primary' as const;
    case 'EXPELLED':
      return 'danger' as const;
    case 'ACADEMIC_LEAVE':
      return 'warning' as const;
    default:
      return 'default' as const;
  }
}

export default function StudentsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: ['students'], queryFn: () => api.students.list('?limit=100') });

  const rows = (q.data?.data ?? []).filter((s) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      s.user.fullName.toLowerCase().includes(needle) ||
      s.studentNumber.toLowerCase().includes(needle) ||
      (s.group?.name.toLowerCase().includes(needle) ?? false)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('students')}
        subtitle={t('students.subtitle')}
        icon={Users}
        action={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t('students.name')}…`}
            className="w-52"
          />
        }
      />

      <Card className="animate-fade-up">
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="flex flex-col gap-2 p-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted-bg/50 text-left text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">{t('students.number')}</th>
                    <th className="px-5 py-3 font-semibold">{t('students.name')}</th>
                    <th className="px-5 py-3 font-semibold">{t('students.group')}</th>
                    <th className="px-5 py-3 text-right font-semibold">{t('gpa')}</th>
                    <th className="px-5 py-3 text-right font-semibold">{t('students.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t border-border transition-colors hover:bg-muted-bg/40">
                      <td className="px-5 py-3 font-mono text-xs">{s.studentNumber}</td>
                      <td className="px-5 py-3 font-medium">{s.user.fullName}</td>
                      <td className="px-5 py-3 text-muted">{s.group?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-mono">{Number(s.gpa).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Users} title={t('no.data')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
