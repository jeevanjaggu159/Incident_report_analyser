/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        severity: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#eab308',
          low: '#22c55e',
        }
      }
    },
  },
  plugins: [],
}
