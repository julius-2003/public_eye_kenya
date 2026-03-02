export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: '#BB0000', dark: '#8B0000' },
        green: { DEFAULT: '#006600', light: '#16A34A' },
        gold: { DEFAULT: '#C9A84C', light: '#F0D98B' },
        ink: '#111827', muted: '#6B7280',
        surface: '#FAFAF8', surface2: '#F3F2EE',
        admin: { DEFAULT: '#7C3AED', light: '#A78BFA' },
        user: { DEFAULT: '#2563EB', light: '#93C5FD' },
        support: { DEFAULT: '#059669', light: '#34D399' },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        instrument: ['Instrument Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: []
};
