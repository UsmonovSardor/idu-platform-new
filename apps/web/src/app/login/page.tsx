'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@idu/api-client';
import { loginSchema, type LoginDto } from '@idu/validation';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { setToken, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginDto) => {
    setError(null);
    try {
      const { accessToken } = await api.auth.login(data);
      setToken(accessToken);
      const me = await api.auth.me();
      setUser(me);
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Kirishda xatolik');
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel — IDU navy hero */}
      <div
        className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ background: 'linear-gradient(155deg, #0e1b34 0%, #234991 58%, #1d3c78 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(45% 35% at 85% 8%, rgba(255,255,255,0.14), transparent 60%), radial-gradient(50% 45% at 0% 100%, rgba(226,9,47,0.28), transparent 60%)',
          }}
        />
        <div className="relative">
          <Logo className="[&_.text-primary]:!text-white [&_.text-muted]:!text-white/60 [&_.text-fg]:!text-white [&_.border-border]:!border-white/25" />
        </div>
        <div className="relative max-w-md">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            Xalqaro Raqamli Universitet
          </span>
          <h1 className="mt-5 text-4xl font-extrabold uppercase leading-[1.05] tracking-tight">
            Bugun o&apos;rgan —<br />ertangi kunni yarat.
          </h1>
          <p className="mt-4 text-white/75">
            Baholash, jadval, imtihon, to&apos;lov va real vaqtli aloqa — hammasi yagona, zamonaviy va
            xavfsiz IDU platformasida.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-white/65">
          <ShieldCheck className="h-4 w-4" /> 2FA · RBAC · shifrlangan sessiyalar
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col items-center justify-center px-6 py-10">
        <div className="mb-6 flex w-full max-w-sm items-center justify-between lg:hidden">
          <Logo />
          <LocaleSwitcher />
        </div>
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 hidden justify-end lg:flex">
            <LocaleSwitcher />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">{t('login.title')}</h2>
          <p className="mt-1 text-sm text-muted">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
            <Field label={t('login.username')} error={errors.login?.message}>
              <Input placeholder="admin" autoComplete="username" {...register('login')} />
            </Field>
            <Field label={t('login.password')} error={errors.password?.message}>
              <Input type="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
            </Field>
            <Field label={t('login.otp')} error={errors.otp?.message}>
              <Input
                inputMode="numeric"
                placeholder="000000"
                className="font-mono tracking-widest"
                {...register('otp', { setValueAs: (v) => (v === '' ? undefined : v) })}
              />
            </Field>

            {error && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t('login.submit')} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Demo: <span className="font-mono text-fg">student / Student123!</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
