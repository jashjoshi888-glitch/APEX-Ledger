/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        apex: {
          black: '#09090b',
          darkGray: '#121215',
          card: '#18181b',
          border: '#27272a',
          muted: '#71717a',
          accentBlue: '#00F0FF',
          accentGreen: '#39FF14',
          accentRed: '#FF073A',
          accentAmber: '#FFB000',
        },
      },
      boxShadow: {
        glowBlue: '0 0 40px -12px rgba(0, 240, 255, 0.25)',
        glowGreen: '0 0 40px -12px rgba(57, 255, 20, 0.22)',
        glowRed: '0 0 40px -12px rgba(255, 7, 58, 0.22)',
        glowAmber: '0 0 40px -12px rgba(255, 176, 0, 0.22)',
      },
    },
  },
  plugins: [],
}
