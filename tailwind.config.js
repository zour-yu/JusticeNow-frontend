/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#1E4334',
          forestDark: '#143527',
          forestLight: '#2D5B47',
          sage: '#D4E7DA',
          sageLight: '#EDF5F0',
          sageDark: '#365D49',
          bg: '#F3F6F2',
          card: '#FFFFFF',
          textDark: '#14291F',
          textMuted: '#5C7164',
          border: '#E1EBE4',
          // Compatibility aliases
          darkest: '#14291F',
          dark: '#1E4334',
          primary: '#1E4334',
          accent: '#2D5B47',
          accentHover: '#143527',
          light: '#D4E7DA',
          muted: '#5C7164',
        },
      },
    },
  },
  plugins: [],
};

