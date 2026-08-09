'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, PenSquare, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { computeGrade, GRADE_COMPONENTS } from '@idu/types';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';

const COMPONENTS = [
  { key: 'jn', max: GRADE_COMPONENTS.JN.max },
  { key: 'on', max: GRADE_COMPONENTS.ON.max },
  { key: 'yn', max: GRADE_COMPONENTS.YN.max },
  { key: 'mi', max: GRADE_COMPONENTS.MI.max },
] as const;

type CompKey = (typeof COMPONENTS)[number]['key'];
type Row = Record<CompKey, string>;

const EMPTY_ROW: Row = { jn: '', on: '', yn: '', mi: '' };
const num = (s: string) => (s === '' ? 0 : Number(s));

function letterTone(letter: string | null) {
  if (!letter) return 'default' as const;
  if (['A', 'B'].includes(letter)) return 'success' as const;
  if (['C', 'D'].includes(letter)) return 'primary' as const;
  if (letter === 'E') return 'warning' as const;
  return 'danger' as const;
}

export default function GradeEntryPage() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const courses = useQuery({ queryKey: ['courses', 'mine'], queryFn: () => api.courses.mine() });
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    const first = courses.data?.[0];
    if (!courseId && first) setCourseId(first.id);
  }, [courses.data, courseId]);

  const roster = useQuery({
    queryKey: ['roster', courseId],
    queryFn: () => api.grades.roster(courseId),
    enabled: !!courseId,
  });

  const [rows, setRows] = useState<Record<string, Row>>({});
  useEffect(() => {
    if (!roster.data) return;
    const next: Record<string, Row> = {};
    for (const s of roster.data.students) {
      next[s.studentId] = {
        jn: s.jn?.toString() ?? '',
        on: s.on?.toString() ?? '',
        yn: s.yn?.toString() ?? '',
        mi: s.mi?.toString() ?? '',
      };
    }
    setRows(next);
  }, [roster.data]);

  function setCell(studentId: string, key: CompKey, raw: string, max: number) {
    let v = raw.replace(/[^0-9.]/g, '');
    if (v !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) v = String(Math.min(Math.max(n, 0), max));
    }
    setRows((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] ?? EMPTY_ROW), [key]: v } }));
  }

  const save = useMutation({
    mutationFn: () =>
      api.grades.bulk({
        courseId,
        grades: (roster.data?.students ?? []).map((s) => {
          const r = rows[s.studentId] ?? EMPTY_ROW;
          return { studentId: s.studentId, jn: num(r.jn), on: num(r.on), yn: num(r.yn), mi: num(r.mi) };
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roster', courseId] });
      qc.invalidateQueries({ queryKey: ['grades', 'me'] });
    },
  });

  const students = roster.data?.students ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('grade.entry')}
        subtitle={t('grade.entry.subtitle')}
        icon={PenSquare}
        action={
          <Button onClick={() => save.mutate()} disabled={save.isPending || students.length === 0}>
            <Save className="h-4 w-4" />
            {save.isPending ? t('grade.saving') : t('grade.save')}
          </Button>
        }
      />

      {/* Course selector */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-up">
        <label className="text-sm font-medium text-muted">{t('grade.select.course')}</label>
        {courses.isLoading ? (
          <Skeleton className="h-11 w-64" />
        ) : (
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="h-11 min-w-[16rem] rounded-md border border-border bg-card px-3.5 text-sm font-medium text-fg outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
          >
            {(courses.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.code} ({c.credits} kredit)
              </option>
            ))}
          </select>
        )}
        {save.isSuccess && !save.isPending && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-success animate-fade-up">
            <CheckCircle2 className="h-4 w-4" /> {t('grade.saved')}
          </span>
        )}
      </div>

      {courses.data && courses.data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={PenSquare} title={t('grade.no.courses')} />
          </CardContent>
        </Card>
      ) : (
        <Card className="animate-fade-up">
          <CardContent className="p-0">
            {roster.isLoading ? (
              <div className="flex flex-col gap-2 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted-bg/50 text-left text-xs text-muted">
                    <tr>
                      <th className="px-5 py-3 font-semibold">{t('grade.student')}</th>
                      {COMPONENTS.map((c) => (
                        <th key={c.key} className="px-3 py-3 text-center font-semibold uppercase">
                          {c.key} <span className="font-mono text-[10px] text-muted/70">/{c.max}</span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right font-semibold">{t('grade.total')}</th>
                      <th className="px-5 py-3 text-right font-semibold">{t('grades.letter')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const r = rows[s.studentId] ?? EMPTY_ROW;
                      const result = computeGrade({
                        jn: num(r.jn),
                        on: num(r.on),
                        yn: num(r.yn),
                        mi: num(r.mi),
                      });
                      return (
                        <tr key={s.studentId} className="border-t border-border">
                          <td className="px-5 py-2.5">
                            <div className="font-medium">{s.fullName}</div>
                            <div className="font-mono text-xs text-muted">{s.studentNumber}</div>
                          </td>
                          {COMPONENTS.map((c) => (
                            <td key={c.key} className="px-3 py-2.5 text-center">
                              <input
                                inputMode="decimal"
                                value={r[c.key]}
                                onChange={(e) => setCell(s.studentId, c.key, e.target.value, c.max)}
                                placeholder="0"
                                aria-label={`${s.fullName} ${c.key}`}
                                className="h-9 w-16 rounded-md border border-border bg-bg px-2 text-center font-mono text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-right font-mono font-semibold">
                            {result.total}
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            <Badge tone={letterTone(result.letter)}>{result.letter ?? '—'}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={PenSquare} title={t('grade.no.students')} />
            )}
          </CardContent>
        </Card>
      )}

      {save.isError && (
        <p className={cn('text-sm text-danger')}>
          {(save.error as Error)?.message ?? 'Xatolik'}
        </p>
      )}
    </div>
  );
}
