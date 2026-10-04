/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: '#ea580c',
        secondary: '#14b8a6',
        dark: {
          950: '#09090b',
          900: '#18181b',
          850: '#1c1c21',
          800: '#27272a',
          700: '#3f3f46',
        }
      }
    },
  },
  plugins: [],
}
