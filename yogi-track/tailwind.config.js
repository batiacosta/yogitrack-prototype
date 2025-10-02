/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'google-sans': ['Google Sans', 'sans-serif'],
      },
      colors: {
        'yogi': {
          'black': '#000000',
          'orange': '#E87131',
          'green-dark': '#50AA2F', 
          'green-light': '#6BBD3F',
          'brown': '#B45726'
        }
      },
    },
  },
  plugins: [],
}

