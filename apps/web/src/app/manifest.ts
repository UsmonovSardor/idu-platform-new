import type { MetadataRoute } from 'next';

/** PWA manifest — IDU'ni telefonga o'rnatiladigan qiladi (Add to Home Screen). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IDU Platform — International Digital University',
    short_name: 'IDU',
    description: 'International Digital University boshqaruv tizimi',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#060b18',
    theme_color: '#234991',
    lang: 'uz',
    dir: 'ltr',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
