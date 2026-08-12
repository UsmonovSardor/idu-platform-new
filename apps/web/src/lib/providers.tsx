'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { PwaRegister } from '@/components/pwa-register';
import { api } from './api';
import { useAuth } from './auth-store';
import { I18nProvider } from './i18n';

/** Sessiyani tiklaydi: refresh cookie orqali access token + profil (silent login). */
function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setReady } = useAuth();
  useEffect(() => {
    (async () => {
      try {
        const ok = await api.auth.refresh();
        if (ok) {
          const me = await api.auth.me();
          setUser(me);
        }
      } catch {
        /* mehmon */
      } finally {
        setReady(true);
      }
    })();
  }, [setUser, setReady]);
  return <>{children}</>;
}

function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem('idu.theme');
    const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <ThemeInit />
        <PwaRegister />
        <SessionBootstrap>{children}</SessionBootstrap>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
        />
      </I18nProvider>
    </QueryClientProvider>
  );
}
