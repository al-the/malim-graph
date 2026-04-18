import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#F7F8FA',
        'bg-surface': '#FFFFFF',
        'bg-subtle': '#EEF0F4',
        border: '#D8DCE6',
        primary: '#1B3A6B',
        'primary-hover': '#142E57',
        accent: '#2E7D9B',
        'text-primary': '#1A1F2E',
        'text-secondary': '#5A6278',
        'text-disabled': '#9BA3B5',
        success: '#1D7A4F',
        warning: '#B45309',
        danger: '#C0392B',
        pending: '#6B4EA6',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '11px',
        xs: '13px',
        sm: '15px',
        base: '13px',
        lg: '15px',
        xl: '18px',
        '2xl': '24px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 8px 32px rgba(0,0,0,0.16)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
}

export default config
