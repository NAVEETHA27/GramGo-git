/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#0F766E', dark: '#115E59', light: '#14B8A6', 50: '#F0FDFA', 100: '#CCFBF1' },
        accent:    { DEFAULT: '#F59E0B', dark: '#B45309' },
        secondary: { DEFAULT: '#F59E0B' },
        dark:      { bg: '#F6F8FB', card: '#ffffff', border: '#E2E8F0', muted: '#F1F5F9' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.45s ease-out both',
        'fade-up':  'fadeUp 0.5s  ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        'float':    'float  6s ease-in-out infinite',
        'shimmer':  'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeUp:  { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.93)' }, to: { opacity: 1, transform: 'scale(1)' } },
        float:   { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-14px)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'blue':    '0 4px 20px rgba(15,118,110,0.22)',
        'blue-lg': '0 8px 36px rgba(15,118,110,0.32)',
        'card':    '0 2px 12px rgba(15,23,42,0.06)',
        'brand':   '0 4px 20px rgba(15,118,110,0.22)',
        'brand-lg':'0 8px 36px rgba(15,118,110,0.32)',
      },
    },
  },
  plugins: [],
};
