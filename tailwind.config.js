/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        custom: {
          DEFAULT: '#000000',
          '50': '#f8f8f8',
          '100': '#e0e0e0',
          '200': '#c0c0c0',
          '300': '#a0a0a0',
          '400': '#808080',
          '500': '#6c6c6c',
          '600': '#505050',
          '700': '#383838',
          '800': '#202020',
          '900': '#121212',
        },
      },
      borderRadius: {
        'button': '0.375rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar'),
  ],
};
