import type { Metadata, Viewport } from 'next';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

const sans = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'IDU Platform — International Digital University',
  description: 'International Digital University boshqaruv tizimi',
  manifest: '/manifest.webmanifest',
  applicationName: 'IDU Platform',
  appleWebApp: {
    capable: true,
    title: 'IDU',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6f9' },
    { media: '(prefers-color-scheme: dark)', color: '#060b18' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans`}>
        <div className="aurora" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
