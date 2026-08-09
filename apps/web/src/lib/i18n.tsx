'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Locale = 'uz' | 'ru' | 'en';

const dict: Record<Locale, Record<string, string>> = {
  uz: {
    login: 'Kirish',
    'login.title': 'Tizimga kirish',
    'login.subtitle': 'IDU platformasiga xush kelibsiz',
    'login.username': 'Login',
    'login.password': 'Parol',
    'login.otp': '2FA kod (agar yoqilgan bo\'lsa)',
    'login.submit': 'Kirish',
    logout: 'Chiqish',
    dashboard: 'Boshqaruv paneli',
    grades: 'Baholar',
    schedule: 'Jadval',
    payments: "To'lovlar",
    announcements: "E'lonlar",
    gpa: 'GPA',
    level: 'Daraja',
    streak: 'Streak',
    rank: 'O\'rin',
    'welcome': 'Xush kelibsiz',
    'today': 'Bugungi kun',
    'my.grades': 'Baholarim',
    'my.schedule': 'Jadvalim',
    'no.data': "Ma'lumot yo'q",
  },
  ru: {
    login: 'Вход',
    'login.title': 'Вход в систему',
    'login.subtitle': 'Добро пожаловать в IDU',
    'login.username': 'Логин',
    'login.password': 'Пароль',
    'login.otp': 'Код 2FA (если включён)',
    'login.submit': 'Войти',
    logout: 'Выйти',
    dashboard: 'Панель',
    grades: 'Оценки',
    schedule: 'Расписание',
    payments: 'Платежи',
    announcements: 'Объявления',
    gpa: 'GPA',
    level: 'Уровень',
    streak: 'Серия',
    rank: 'Место',
    welcome: 'Добро пожаловать',
    today: 'Сегодня',
    'my.grades': 'Мои оценки',
    'my.schedule': 'Моё расписание',
    'no.data': 'Нет данных',
  },
  en: {
    login: 'Login',
    'login.title': 'Sign in',
    'login.subtitle': 'Welcome to IDU platform',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.otp': '2FA code (if enabled)',
    'login.submit': 'Sign in',
    logout: 'Log out',
    dashboard: 'Dashboard',
    grades: 'Grades',
    schedule: 'Schedule',
    payments: 'Payments',
    announcements: 'Announcements',
    gpa: 'GPA',
    level: 'Level',
    streak: 'Streak',
    rank: 'Rank',
    welcome: 'Welcome',
    today: 'Today',
    'my.grades': 'My grades',
    'my.schedule': 'My schedule',
    'no.data': 'No data',
  },
};

const I18nCtx = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (k: string) => string }>({
  locale: 'uz',
  setLocale: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uz');
  useEffect(() => {
    const saved = localStorage.getItem('idu.locale') as Locale | null;
    if (saved) setLocaleState(saved);
  }, []);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('idu.locale', l);
  }, []);
  const t = useCallback((k: string) => dict[locale][k] ?? dict.uz[k] ?? k, [locale]);
  return <I18nCtx.Provider value={{ locale, setLocale, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
