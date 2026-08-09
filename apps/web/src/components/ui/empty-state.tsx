import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon?: React.ElementType;
  title: string;
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {Icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-muted-bg text-muted">
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <p className="text-sm font-medium text-fg">{title}</p>
      {hint ? <p className="max-w-xs text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
