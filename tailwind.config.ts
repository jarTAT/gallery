import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef5ff',
          100: '#d9e9ff',
          200: '#bcd8ff',
          300: '#8ec0ff',
          400: '#599cff',
          500: '#3378ff',
          600: '#0063DC',
          700: '#0052b8',
          800: '#064794',
          900: '#0a3f79',
        },
        accent: {
          50: '#fff0f7',
          100: '#ffe4f2',
          200: '#ffc3e3',
          300: '#ff93c9',
          400: '#ff5ba6',
          500: '#FF0084',
          600: '#e6007a',
          700: '#c20066',
          800: '#a10058',
          900: '#7c004a',
        },
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
      borderRadius: {
        'card': '0.5rem',
      },
    },
  },
  plugins: [],
}
export default config
