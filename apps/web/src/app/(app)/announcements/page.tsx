'use client';
import { useQuery } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function AnnouncementsPage() {
  const { t } = useI18n();
  const q = useQuery({ queryKey: ['announcements'], queryFn: () => api.announcements.list() });

  const items = q.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('announcements')} subtitle={t('announcements.subtitle')} icon={Megaphone} />

      {q.isLoading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-4">
          {items.map((a, i) => (
            <Card key={a.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold tracking-tight">{a.title}</h3>
                    {/* Body backend'da sanitize qilinadi (Phase 4) — xavfsiz HTML */}
                    <div
                      className="prose-idu mt-1 text-sm leading-relaxed text-muted"
                      dangerouslySetInnerHTML={{ __html: a.body }}
                    />

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>
                        {t('by')}: <span className="font-medium text-fg">{a.author?.fullName ?? '—'}</span>
                      </span>
                      <span className="font-mono">
                        {new Date(a.createdAt).toLocaleDateString('uz-UZ', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState icon={Megaphone} title={t('announcements.empty')} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
