/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#F7F8F4',
        foreground: '#102217',
        card: '#FFFFFF',
        primary: '#006947',
        muted: '#D9E1DA',
        'muted-foreground': '#6D7A71',
        destructive: '#C2410C',
        success: '#15803D',
      },
    },
  },
};