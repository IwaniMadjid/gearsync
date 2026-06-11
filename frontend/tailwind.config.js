/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light Cream Backgrounds
        canvas: {
          950: '#FFFFFF',
          900: '#F9F7F3',
          800: '#F2ECE4', // Main BG
          700: '#EAE4D9',
        },
        // Borders & Overlays
        rim: {
          900: 'rgba(0,0,0,0.04)',
          800: 'rgba(0,0,0,0.08)',
          700: 'rgba(0,0,0,0.12)',
          600: 'rgba(0,0,0,0.2)',
        },
        // Black/Gray Text
        parchment: {
          100: '#141414', // Text Primary
          200: '#333333',
          300: '#555555', // Text Secondary
          400: '#888888', // Text Muted
          500: '#AAAAAA',
        },
        // Vibrant Units.gr Palette
        gold: { // Mapped to BLUE
          300: '#3392FF',
          400: '#0071EB', 
          500: '#005BB5',
        },
        jade: { // Green
          400: '#00B243', 
          500: '#008F36' 
        },
        ember: { // Orange/Red
          400: '#FF5C00', 
          500: '#CC4A00' 
        },
        sky: { // Purple
          400: '#AD54FF', 
          500: '#8A43CC' 
        },
        sun: { // Yellow
          400: '#FFAC00',
          500: '#CC8A00'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest2: '0.18em',
      },
    },
  },
  plugins: [],
}