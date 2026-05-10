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
        pink: {
          DEFAULT: '#ff4d7d',
          dark: '#c23060',
          light: '#ff8ca8',
        },
        gold: {
          DEFAULT: '#FFD700',
          dark: '#cc9900',
        },
        surface: {
          DEFAULT: '#111111',
          2: '#161616',
          3: '#1e1e1e',
        },
      },
      animation: {
        'slide-up': 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'pulse-dot': 'pulseDot 1.3s infinite',
        'float-up': 'floatUp 2.6s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.5)' },
          '15%': { opacity: '1', transform: 'translateY(-16px) scale(1.15)' },
          '85%': { opacity: '0.7', transform: 'translateY(-130px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-160px) scale(0.7)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
