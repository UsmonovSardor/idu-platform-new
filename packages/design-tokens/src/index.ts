/**
 * IDU dizayn tokenlari — "Academic Premium".
 * Web (CSS vars) va mobil (RN) o'rtasida ulashiladi. Yagona haqiqat manbai.
 */

/** Brend ranglari (HSL komponentlari — CSS var uchun ham qulay). */
export const palette = {
  // IDU Blue — ishonchli indigo-kobalt
  brand: {
    50: '#eef1ff',
    100: '#e0e5ff',
    200: '#c6cfff',
    300: '#a3b0ff',
    400: '#7c86fb',
    500: '#5b5cf0',
    600: '#4a41e0', // primary
    700: '#3e33c4',
    800: '#332c9e',
    900: '#2d2a7d',
  },
  // Warm gold — prestij + gamifikatsiya urg'usi
  gold: {
    400: '#e6b45c',
    500: '#d99b3e',
    600: '#c07e28',
  },
  // Cool slate neutrals
  slate: {
    0: '#ffffff',
    50: '#f7f8fa',
    100: '#eef0f4',
    200: '#e2e5ec',
    300: '#cdd2dd',
    400: '#9aa2b4',
    500: '#6b7385',
    600: '#4b5262',
    700: '#353b49',
    800: '#20242e',
    900: '#12141b',
    950: '#0b0d12',
  },
  success: '#2f9e6f',
  warning: '#d99b3e',
  danger: '#e0554f',
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
