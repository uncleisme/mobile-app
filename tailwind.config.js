/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brandPrimary: '#7e0053',
        brand: {
          50: '#eef7ff',
          100: '#d8ecff',
          200: '#b9dbff',
          300: '#8cc4ff',
          400: '#58a4ff',
          500: '#2b84ff',
          600: '#1e6be6',
          700: '#1856bf',
          800: '#154999',
          900: '#143f80',
        },
      },
    },
  },
  plugins: [],
};
