/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        splendor: {
          bg: '#efe6d2',
          surface: '#f7f0e0',
          card: '#fffaf0',
          ink: '#1f1612',
          muted: '#5c4a3a',
          accent: '#8b6914',
          gold: '#c4a35a',
          brass: '#8a7040',
          velvet: '#5c1f2e',
          lapis: '#2a3f5f',
          line: '#c9b896',
          rule: '#a89068',
        },
        gem: {
          emerald: '#1f6b45',
          sapphire: '#1e4a8a',
          ruby: '#9e2a22',
          diamond: '#8aa8bc',
          onyx: '#2a2a2a',
          gold: '#c9a24a',
        },
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'Cinzel', '"Noto Serif SC"', 'serif'],
        serif: ['"Cormorant Garamond"', '"Noto Serif SC"', 'Georgia', 'serif'],
        body: ['"EB Garamond"', '"Noto Serif SC"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(31, 24, 20, 0.05)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};
