'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { CircleStop, QrCode, RadioTower, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';

const TTL_SECONDS = 45; // QR muddati — proxy/skrinshot hujumidan himoya uchun qisqa

export default function AttendancePage() {
  const { t } = useI18n();

  const courses = useQuery({ queryKey: ['courses', 'mine'], queryFn: () => api.courses.mine() });
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    const first = courses.data?.[0];
    if (!courseId && first) setCourseId(first.id);
  }, [courses.data, courseId]);

  // ── Sessiya holati ──
  const [active, setActive] = useState(false);
  const [token, setToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TTL_SECONDS);

  const generate = useMutation({
    mutationFn: () => api.attendance.qrGenerate({ courseId, ttlSeconds: TTL_SECONDS }),
    onSuccess: (data) => {
      setToken(data.token);
      setExpiresAt(new Date(data.expiresAt).getTime());
    },
  });

  const start = useCallback(() => {
    setActive(true);
    generate.mutate();
  }, [generate]);

  const stop = useCallback(() => {
    setActive(false);
    setToken('');
    setExpiresAt(0);
  }, []);

  // Fan almashtirilsa — sessiyani to'xtatamiz
  useEffect(() => {
    stop();
  }, [courseId, stop]);

  // Countdown + tugaganda avto-yangilash
  const genRef = useRef(generate);
  genRef.current = generate;
  useEffect(() => {
    if (!active || !expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !genRef.current.isPending) genRef.current.mutate();
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [active, expiresAt]);

  // Jonli statistika — sessiya faol bo'lganda har 4s
  const stats = useQuery({
    queryKey: ['attendance', 'stats', courseId],
    queryFn: () => api.attendance.courseStats(courseId),
    enabled: active && !!courseId,
    refetchInterval: 4000,
  });
  const present = stats.data?.byStatus.PRESENT ?? 0;

  const noCourses = courses.data && courses.data.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('attendance.session')}
        subtitle={t('attendance.session.subtitle')}
        icon={QrCode}
        action={
          active ? (
            <Button variant="ghost" onClick={stop}>
              <CircleStop className="h-4 w-4" />
              {t('attendance.stop')}
            </Button>
          ) : (
            <Button onClick={start} disabled={!courseId || generate.isPending}>
              <RadioTower className="h-4 w-4" />
              {t('attendance.start')}
            </Button>
          )
        }
      />

      {/* Course selector */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-up">
        <label className="text-sm font-medium text-muted">{t('attendance.select.course')}</label>
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
        {active && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {t('attendance.live')}
          </span>
        )}
      </div>

      {noCourses ? (
        <Card>
          <CardContent>
            <EmptyState icon={QrCode} title={t('attendance.no.courses')} />
          </CardContent>
        </Card>
      ) : !active ? (
        <Card className="animate-fade-up">
          <CardContent className="grid place-items-center gap-4 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <QrCode className="h-8 w-8" />
            </div>
            <p className="max-w-sm text-sm text-muted">{t('attendance.scan.hint')}</p>
            <Button onClick={start} disabled={!courseId || generate.isPending}>
              <RadioTower className="h-4 w-4" />
              {t('attendance.start')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          {/* QR panel */}
          <Card className="animate-fade-up">
            <CardContent className="flex flex-col items-center gap-5 py-8">
              <div className="relative rounded-2xl bg-white p-5 shadow-lift">
                {token ? (
                  <QRCodeSVG value={token} size={288} level="M" marginSize={0} fgColor="#0b1220" />
                ) : (
                  <div className="grid h-[288px] w-[288px] place-items-center">
                    <Skeleton className="h-full w-full rounded-xl" />
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-muted">{t('attendance.scan.hint')}</p>

              {/* Countdown */}
              <div className="flex w-full max-w-xs flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{t('attendance.refresh.in')}</span>
                  <span className="font-mono font-semibold text-fg">
                    {secondsLeft} {t('attendance.sec')}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted-bg">
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width] duration-500 ease-linear',
                      secondsLeft <= 8 ? 'bg-warning' : 'bg-primary',
                    )}
                    style={{ width: `${(secondsLeft / TTL_SECONDS) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live stats */}
          <div className="flex flex-col gap-4">
            <Card className="animate-fade-up">
              <CardContent className="flex flex-col items-center gap-1 py-7 text-center">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  <Users className="h-3.5 w-3.5" />
                  {t('attendance.present')}
                </div>
                <div className="font-mono text-5xl font-bold tabular-nums text-primary">
                  {present}
                </div>
                <p className="text-xs text-muted">
                  {present} {t('attendance.marked')}
                </p>
              </CardContent>
            </Card>

            {stats.data && stats.data.total > 0 && (
              <Card className="animate-fade-up">
                <CardContent className="flex flex-col gap-2.5 py-5">
                  {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as const).map((s) => {
                    const val = stats.data?.byStatus[s] ?? 0;
                    if (!val) return null;
                    return (
                      <div key={s} className="flex items-center justify-between text-sm">
                        <Badge tone={STATUS_TONE[s]}>{STATUS_LABEL[s]}</Badge>
                        <span className="font-mono font-semibold">{val}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {present === 0 && (
              <p className="px-1 text-center text-sm text-muted animate-fade-up">
                {t('attendance.waiting')}
              </p>
            )}
          </div>
        </div>
      )}

      {generate.isError && (
        <p className="text-sm text-danger">{(generate.error as Error)?.message ?? 'Xatolik'}</p>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED', string> = {
  PRESENT: 'Keldi',
  LATE: 'Kechikdi',
  ABSENT: 'Kelmadi',
  EXCUSED: 'Sababli',
};
const STATUS_TONE: Record<
  'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED',
  'success' | 'warning' | 'danger' | 'primary'
> = {
  PRESENT: 'success',
  LATE: 'warning',
  ABSENT: 'danger',
  EXCUSED: 'primary',
};
