'use client';
import { useI18n, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';

const locales: Locale[] = ['uz', 'ru', 'en'];

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center rounded-md border border-border bg-card p-0.5 text-xs font-semibold">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            'rounded px-2 py-1 uppercase transition-colors',
            locale === l ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
