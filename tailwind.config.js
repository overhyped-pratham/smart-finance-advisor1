/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cf: {
          // Foundation — The Void
          bg: '#0a0e14',
          surface: '#0a0e14',
          'surface-low': '#0f141a',
          'surface-high': '#20262f',
          'surface-bright': '#262c36',
          'surface-lowest': '#000000',

          // Accent Signals
          primary: '#8ff5ff',
          'primary-container': '#00eefc',
          secondary: '#d674ff',
          tertiary: '#afffd1',
          error: '#ff716c',

          // On-colors
          'on-surface': '#f1f3fc',
          'on-primary': '#0a0e14',
          'on-muted': '#8a90a0',

          // Utility
          outline: '#44484f',
        },
      },
      backgroundImage: {
        'cf-gradient': 'linear-gradient(15deg, #8ff5ff, #00eefc)',
        'cf-gradient-secondary': 'linear-gradient(15deg, #d674ff, #a855f7)',
        'cf-grid': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 39.5h40M39.5 0v40' stroke='rgba(143, 245, 255, 0.03)' stroke-width='1'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'glow-primary': '0 0 16px rgba(143, 245, 255, 0.20)',
        'glow-secondary': '0 0 16px rgba(214, 116, 255, 0.20)',
        'glow-tertiary': '0 0 16px rgba(175, 255, 209, 0.20)',
        'glow-error': '0 0 16px rgba(255, 113, 108, 0.20)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.40)',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md: '0.375rem',
      },
      letterSpacing: {
        'tight-display': '-0.02em',
      },
      animation: {
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(2.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
