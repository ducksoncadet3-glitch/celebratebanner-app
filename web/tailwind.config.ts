import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0C0E14',
          50: '#13161F',
          100: '#1B1F2C',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C97A',
          pale: '#F5E4B0',
          dark: '#8B6020',
        },
        ivory: {
          DEFAULT: '#FAF8F3',
          dim: '#F2EFE6',
        },
        sage: '#5A8F6A',
        rose: '#C4617A',
        sky: '#4A9ECC',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-outfit)', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 8px 24px -8px rgba(201, 168, 76, 0.4)',
        lift: '0 12px 40px -10px rgba(12, 14, 20, 0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
