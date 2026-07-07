import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#0A0A0A',
        surface: '#141414',
        'surface-2': '#1A1A1A',
        border: '#1E1E1E',
        gold: '#C9A84C',
        'gold-muted': '#C9A84C33',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        gold: '0 0 20px rgba(201, 168, 76, 0.15)',
        'gold-sm': '0 0 10px rgba(201, 168, 76, 0.1)',
      },
    },
  },
  plugins: [],
}
export default config
