/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#fcfdfe',
        foreground: '#002114',
        card: '#ffffff',
        primary: '#006947',
        secondary: '#f3e9d2',
        accent: '#D4AF37',
        muted: '#f0f5f1',
        'muted-foreground': '#52635a',
        destructive: '#ba1a1a',
        success: '#15803D',
        border: '#dbe5dd',
      },
      fontFamily: {
        heading: ['Geist-Bold', 'System'],
        sans: ['Inter-Regular', 'System'],
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      boxShadow: {
        'premium': '0 20px 50px rgba(0, 105, 71, 0.15)',
        'bento': '0 8px 32px rgba(0, 0, 0, 0.05)',
      }
    },
  },
};
