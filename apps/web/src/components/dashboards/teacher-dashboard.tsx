'use client';
import { BookOpen, ClipboardCheck, FileQuestion, QrCode } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/cn';

const ACTIONS: Array<{ icon: React.ElementType; title: string; desc: string; href?: string }> = [
  { icon: BookOpen, title: 'Baho kiritish', desc: 'JN/ON/YN/MI → avtomatik harf va GPA', href: '/grade-entry' },
  { icon: QrCode, title: 'QR davomat', desc: 'Sessiya oching, talabalar skanerlaydi' },
  { icon: FileQuestion, title: 'Imtihon', desc: 'Savol banki va onlayn test' },
  { icon: ClipboardCheck, title: 'Topshiriqlar', desc: 'Yuklamalarni baholang' },
];

export function TeacherDashboard() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-6">
      <header className="animate-fade-up">
        <div className="text-sm text-muted">O&apos;qituvchi paneli</div>
        <h1 className="text-2xl font-extrabold tracking-tight">Xush kelibsiz, {user?.login}</h1>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {ACTIONS.map((a, i) => {
          const card = (
            <Card
              className={cn(
                'h-full animate-fade-up transition-shadow',
                a.href ? 'cursor-pointer hover:shadow-card' : 'opacity-70',
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="flex items-start gap-4 pt-5">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/12 text-primary">
                  <a.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="mt-0.5 text-sm text-muted">{a.desc}</div>
                </div>
              </CardContent>
            </Card>
          );
          return a.href ? (
            <Link key={a.title} href={a.href}>
              {card}
            </Link>
          ) : (
            <div key={a.title}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
