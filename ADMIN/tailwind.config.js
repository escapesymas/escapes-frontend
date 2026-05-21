/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'racing-orange': '#ff4d00',
        'racing-carbon': '#0c0c0c',
      }
    },
  },
  plugins: [],
}
