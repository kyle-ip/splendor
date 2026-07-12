/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        splendor: {
          bg: '#ebe2d0',
          surface: '#f4ecdc',
          card: '#faf4e8',
          ink: '#1a1410',
          muted: '#4a3c30',
          accent: '#6b4e1a',
          gold: '#a8893e',
          brass: '#7a6240',
          velvet: '#4a1824',
          lapis: '#243448',
          line: '#3d3228',
          rule: '#5c4a3a',
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
        soft: '0 4px 16px rgba(26, 20, 16, 0.08)',
        press: 'inset 0 2px 4px rgba(26, 20, 16, 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ink-bloom': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'ink-bloom': 'ink-bloom 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionDuration: {
        250: '250ms',
      },
      letterSpacing: {
        woodcut: '0.08em',
      },
    },
  },
  plugins: [],
};
