import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1A3E6F',
        gold: '#C8972B',
        teal: '#0F6E56',
        danger: '#B71C1C',
        canvas: '#F7F7F7',
        ink: '#172033',
      },
      boxShadow: {
        soft: '0 16px 40px rgba(23, 32, 51, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
