import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        card: 'var(--card)',
        'card-fg': 'var(--card-fg)',
        muted: 'var(--muted)',
        'muted-bg': 'var(--muted-bg)',
        border: 'var(--border)',
        primary: 'var(--primary)',
        'primary-fg': 'var(--primary-fg)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        ring: 'var(--ring)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '8px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(18,20,27,0.06)',
        card: '0 4px 16px -4px rgba(18,20,27,0.10)',
        lift: '0 12px 40px -8px rgba(18,20,27,0.16)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
