'use client';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Trophy,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { Role } from '@idu/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';
import { LocaleSwitcher } from './locale-switcher';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';

type NavItem = { key: string; icon: React.ElementType };

const NAV_BY_ROLE = {
  STUDENT: [
    { key: 'dashboard', icon: LayoutDashboard },
    { key: 'grades', icon: BookOpen },
    { key: 'schedule', icon: CalendarDays },
    { key: 'payments', icon: Wallet },
    { key: 'announcements', icon: Megaphone },
  ],
  TEACHER: [
    { key: 'dashboard', icon: LayoutDashboard },
    { key: 'grades', icon: BookOpen },
    { key: 'schedule', icon: CalendarDays },
  ],
  _admin: [
    { key: 'dashboard', icon: LayoutDashboard },
    { key: 'students', icon: Users },
    { key: 'reports', icon: BarChart3 },
    { key: 'announcements', icon: Megaphone },
  ],
} satisfies Record<string, NavItem[]>;

function navFor(role: Role): NavItem[] {
  if (role === 'STUDENT') return NAV_BY_ROLE.STUDENT;
  if (role === 'TEACHER') return NAV_BY_ROLE.TEACHER;
  return NAV_BY_ROLE._admin;
}

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Talaba',
  TEACHER: "O'qituvchi",
  DEANERY: 'Dekanat',
  RECTOR: 'Rektor',
  ADMIN: 'Administrator',
  CURATOR: 'Kurator',
  DEPARTMENT_HEAD: 'Kafedra mudiri',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, clear } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const items = user ? navFor(user.role) : [];

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    clear();
    window.location.href = '/login';
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="px-2 py-3">
        <Logo />
      </div>
      <nav className="mt-2 flex flex-col gap-1">
        {items.map((item, i) => (
          <a
            key={item.key}
            href="/dashboard"
            onClick={() => setOpen(false)}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              i === 0 ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-muted-bg hover:text-fg',
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {t(item.key)}
          </a>
        ))}
      </nav>
      <div className="mt-auto rounded-lg border border-border bg-bg/60 p-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <GraduationCap className="h-4 w-4 text-accent" />
          <span>IDU Platform v2</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-card shadow-lift animate-fade-up">
            <button
              className="absolute right-3 top-4 text-muted"
              onClick={() => setOpen(false)}
              aria-label="Yopish"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-md sm:px-6">
          <button
            className="text-muted lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menyu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
            <div className="hidden items-center gap-2.5 rounded-full border border-border bg-card py-1 pl-1 pr-3 sm:flex">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                {user?.login?.slice(0, 2).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-fg">{user?.login}</div>
                <div className="text-[10px] text-muted">{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-muted-bg hover:text-danger"
              aria-label={t('logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
