import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-fg shadow-soft">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3 3 8l9 5 9-5-9-5Z" fill="currentColor" />
          <path d="M6 11v4.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        </svg>
      </div>
      <div className="leading-none">
        <div className="text-[15px] font-extrabold tracking-tight text-fg">IDU</div>
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Platform</div>
      </div>
    </div>
  );
}
