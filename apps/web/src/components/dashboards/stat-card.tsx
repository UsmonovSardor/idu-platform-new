import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  accent?: 'primary' | 'accent' | 'success';
  delay?: number;
}) {
  const tone =
    accent === 'accent'
      ? 'bg-accent/12 text-accent'
      : accent === 'success'
        ? 'bg-success/12 text-success'
        : 'bg-primary/12 text-primary';
  return (
    <Card className="animate-fade-up p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
          <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-fg">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
        </div>
        <div className={cn('grid h-10 w-10 place-items-center rounded-lg', tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
