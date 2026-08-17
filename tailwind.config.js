/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          darkest: '#060e1e',
          dark: '#0f172a',
          card: '#1e293b',
          primary: '#1e3a8a',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          light: '#93c5fd',
          muted: '#64748b',
          border: '#334155',
        },
      },
    },
  },
  plugins: [],
};

