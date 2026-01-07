/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        racing: {
          red: '#DC2626',
          orange: '#EA580C',
          black: '#09090b', // Zinc 950
          carbon: '#18181b', // Zinc 900
          asphalt: '#27272a', // Zinc 800
          metal: '#a1a1aa', // Zinc 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
}