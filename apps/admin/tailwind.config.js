/** @type {import('tailwindcss').Config} */
const rgb = varName => `rgb(var(${varName}) / <alpha-value>)`
const scale = prefix => ({
  50: rgb(`--twc-${prefix}-50`),
  100: rgb(`--twc-${prefix}-100`),
  200: rgb(`--twc-${prefix}-200`),
  300: rgb(`--twc-${prefix}-300`),
  400: rgb(`--twc-${prefix}-400`),
  500: rgb(`--twc-${prefix}-500`),
  600: rgb(`--twc-${prefix}-600`),
  700: rgb(`--twc-${prefix}-700`),
  800: rgb(`--twc-${prefix}-800`),
  900: rgb(`--twc-${prefix}-900`)
})

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core palettes are CSS-variable driven to enable full themes without refactoring templates.
        // Variables are defined in `src/assets/themes.css`.
        // Keep white/black semantic (critical for `text-white`, `dark:text-white`, etc.)
        // Theme engine should control neutrals via gray/slate + primary accents, not override true white/black.
        white: '#fff',
        black: '#000',
        gray: scale('gray'),
        slate: scale('slate'),
        purple: scale('purple'), // kept for compatibility; default theme maps this to brand blue
        indigo: scale('indigo'),
        blue: scale('blue'),
        red: scale('red'),
        green: scale('green'),
        amber: scale('amber'),
        // Semantic palette for new code (and a few existing places)
        primary: scale('primary'),
        // Dark mode specific colors
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          text: '#e2e8f0',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
}
