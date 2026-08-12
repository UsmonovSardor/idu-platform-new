import { cn } from '@/lib/cn';

/**
 * IDU wordmark — idu.uz brendiga sodiq.
 * Royal-blue "IDU" harflari, "I" ustida qizil kvadrat nuqta,
 * yonida stacked "INTERNATIONAL DIGITAL UNIVERSITY".
 */
export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* IDU harflari + qizil nuqta */}
      <div className="relative leading-none">
        <span className="block text-[26px] font-extrabold leading-none tracking-[-0.04em] text-primary">
          IDU
        </span>
        {/* "I" ustidagi qizil kvadrat (tittle) */}
        <span
          className="absolute -top-[3px] left-[1px] h-[7px] w-[8px] rounded-[1.5px] bg-accent"
          aria-hidden
        />
      </div>
      {subtitle ? (
        <div className="flex flex-col gap-[1px] border-l border-border pl-2 leading-none">
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted">
            International
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-fg">Digital</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted">
            University
          </span>
        </div>
      ) : null}
    </div>
  );
}
