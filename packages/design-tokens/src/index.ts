/**
 * IDU dizayn tokenlari — "Academic Premium".
 * Web (CSS vars) va mobil (RN) o'rtasida ulashiladi. Yagona haqiqat manbai.
 */

/** Brend ranglari — idu.uz'dan olingan (royal blue #234991 + qizil #E2092F). */
export const palette = {
  // IDU Blue — logotipdagi royal-navy ko'k (asosiy brend)
  brand: {
    50: '#eef2fb',
    100: '#dae3f5',
    200: '#b4c5ea',
    300: '#8aa3db',
    400: '#5878c4',
    500: '#3557a8',
    600: '#234991', // primary — IDU logo blue
    700: '#1d3c78',
    800: '#183160',
    900: '#142a52',
    950: '#0e1b34',
  },
  // IDU Red — logotipdagi urg'u (nuqta, CTA)
  red: {
    400: '#ff4d67',
    500: '#e2092f', // accent — IDU logo red
    600: '#c40828',
  },
  // Cool slate neutrals (navy tomon egilgan)
  slate: {
    0: '#ffffff',
    50: '#f5f7fa',
    100: '#eef1f6',
    200: '#e1e6ee',
    300: '#cbd2df',
    400: '#98a2b6',
    500: '#656f83',
    600: '#454e60',
    700: '#2f3646',
    800: '#1a2133',
    900: '#0e1627',
    950: '#060b18',
  },
  success: '#2f9e6f',
  warning: '#d99b3e',
  danger: '#e2092f',
} as const;

export const radius = {
  sm: '8px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '40px',
  '2xl': '64px',
} as const;

export const typography = {
  fontSans: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
  fontMono: 'var(--font-mono), ui-monospace, monospace',
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(18,20,27,0.06)',
  md: '0 4px 16px -4px rgba(18,20,27,0.10)',
  lg: '0 12px 40px -8px rgba(18,20,27,0.16)',
} as const;

export type Palette = typeof palette;
