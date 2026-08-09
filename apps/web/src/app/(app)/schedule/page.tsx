'use client';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const WEEKDAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

type Lesson = {
  course?: { name?: string };
  startTime?: unknown;
  endTime?: unknown;
  room?: unknown;
  teacher?: { fullName?: string };
};

export default function SchedulePage() {
  const { t } = useI18n();
  const schedule = useQuery({ queryKey: ['schedule', 'me'], queryFn: () => api.schedule.mine() });

  const data = schedule.data;
  const hasAny = data && WEEKDAYS.some((d) => (data[d]?.length ?? 0) > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('schedule')} subtitle={t('schedule.subtitle')} icon={CalendarDays} />

      {schedule.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : hasAny ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WEEKDAYS.map((day, i) => {
            const lessons = (data?.[day] ?? []) as Lesson[];
            return (
              <Card
                key={day}
                className="animate-fade-up overflow-hidden"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="border-b border-border bg-muted-bg/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-primary">
                  {day}
                </div>
                <CardContent className="flex flex-col gap-2 p-3">
                  {lessons.length > 0 ? (
                    lessons.map((s, j) => (
                      <div key={j} className="rounded-md border border-border p-3">
                        <div className="text-sm font-semibold">{s.course?.name ?? '—'}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3.5 w-3.5" />
                            {String(s.startTime ?? '')}–{String(s.endTime ?? '')}
                          </span>
                          {s.room != null && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {String(s.room)}
                            </span>
                          )}
                        </div>
                        {s.teacher?.fullName && (
                          <div className="mt-1 text-xs text-muted">{s.teacher.fullName}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="px-1 py-3 text-center text-xs text-muted">{t('no.data')}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState icon={CalendarDays} title={t('no.data')} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
