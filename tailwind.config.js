/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          primary: '#0B0F19', // Deep space black
          accent: '#00F0FF', // Cyberpunk Cyan
          secondary: '#7000FF', // Deep Neon Purple
          bg: '#05070D', // Very dark bg
          darkBg: '#05070D', 
          card: '#101423',
          darkCard: '#101423',
        }
      },
      backgroundImage: {
        'futuristic-gradient': 'linear-gradient(135deg, rgba(11,15,25,0.9) 0%, rgba(16,20,35,0.9) 100%)',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 39.5h40M39.5 0v40' stroke='rgba(0, 240, 255, 0.05)' stroke-width='1'/%3E%3C/svg%3E\")"
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.3)',
        'neon-purple': '0 0 15px rgba(112, 0, 255, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
