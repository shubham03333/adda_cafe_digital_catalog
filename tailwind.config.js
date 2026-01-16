/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      maxWidth: {
        'md': '28rem', // 448px for mobile-first
      },
    },
  },
  plugins: [],
}
