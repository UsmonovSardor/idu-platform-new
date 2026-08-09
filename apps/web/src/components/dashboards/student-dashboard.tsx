'use client';
import { useQuery } from '@tanstack/react-query';
import { Award, CalendarDays, Flame, GraduationCap, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { StatCard } from './stat-card';

const WEEKDAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();

  const grades = useQuery({ queryKey: ['grades', 'me'], queryFn: () => api.grades.mine() });
  const game = useQuery({ queryKey: ['game', 'me'], queryFn: () => api.gamification.me() });
  const schedule = useQuery({ queryKey: ['schedule', 'me'], queryFn: () => api.schedule.mine() });

  return (
    <div className="flex flex-col gap-6">
      <header className="animate-fade-up">
        <div className="text-sm text-muted">{t('welcome')},</div>
        <h1 className="text-2xl font-extrabold tracking-tight">{user?.login}</h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('gpa')}
          value={grades.data ? grades.data.gpa.toFixed(2) : <Skeleton className="h-8 w-16" />}
          icon={TrendingUp}
          hint="4.0 shkala"
          delay={0}
        />
        <StatCard
          label={t('level')}
          value={game.data ? game.data.level : <Skeleton className="h-8 w-12" />}
          icon={GraduationCap}
          hint={game.data ? `${game.data.xpToNext} XP keyingiga` : undefined}
          delay={60}
        />
        <StatCard
          label={t('streak')}
          value={game.data ? `${game.data.streak}` : <Skeleton className="h-8 w-12" />}
          icon={Flame}
          accent="accent"
          hint="kun ketma-ket"
          delay={120}
        />
        <StatCard
          label={t('rank')}
          value={game.data?.rank ? `#${game.data.rank}` : <Skeleton className="h-8 w-12" />}
          icon={Award}
          accent="success"
          delay={180}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Grades */}
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '220ms' }}>
          <CardHeader>
            <CardTitle>{t('my.grades')}</CardTitle>
          </CardHeader>
          <CardContent>
            {grades.isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : grades.data && grades.data.grades.length > 0 ? (
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted-bg/60 text-left text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Fan</th>
                      <th className="px-3 py-2 font-semibold">Kredit</th>
                      <th className="px-3 py-2 text-right font-semibold">Ball</th>
                      <th className="px-3 py-2 text-right font-semibold">Baho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.data.grades.map((g) => (
                      <tr key={g.id} className="border-t border-border">
                        <td className="px-3 py-2.5 font-medium">{g.course.name}</td>
                        <td className="px-3 py-2.5 text-muted">{g.course.credits}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{g.total}</td>
                        <td className="px-3 py-2.5 text-right">
                          <Badge tone={letterTone(g.letter)}>{g.letter ?? '—'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
          </CardContent>
        </Card>

        {/* Gamification badges */}
        <Card className="animate-fade-up" style={{ animationDelay: '280ms' }}>
          <CardHeader>
            <CardTitle>Nishonlar</CardTitle>
          </CardHeader>
          <CardContent>
            {game.data ? (
              game.data.badges.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {game.data.badges.map((b) => (
                    <div key={b.code} className="flex items-center gap-3 rounded-md border border-border p-2.5">
                      <span className="text-2xl">{b.icon ?? '🏅'}</span>
                      <span className="text-sm font-semibold">{b.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Hali nishon yo&apos;q — faol bo&apos;ling!</p>
              )
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card className="animate-fade-up" style={{ animationDelay: '320ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> {t('my.schedule')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedule.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : schedule.data && Object.keys(schedule.data).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {WEEKDAYS.filter((d) => schedule.data![d]?.length).map((day) => (
                <div key={day} className="rounded-md border border-border p-3">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">{day}</div>
                  <div className="flex flex-col gap-2">
                    {(schedule.data![day] as Array<Record<string, unknown>>).map((s, i) => (
                      <div key={i} className="text-sm">
                        <div className="font-medium">{(s.course as { name?: string })?.name ?? '—'}</div>
                        <div className="font-mono text-xs text-muted">
                          {String(s.startTime)}–{String(s.endTime)} · {String(s.room)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
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

function Empty() {
  const { t } = useI18n();
  return <p className="py-6 text-center text-sm text-muted">{t('no.data')}</p>;
}
