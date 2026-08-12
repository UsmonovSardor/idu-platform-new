'use client';
import { useEffect } from 'react';

/** Service worker'ni ro'yxatdan o'tkazadi (faqat production'da). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* SW ro'yxatdan o'tmasa — jim, ilova baribir ishlaydi */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
