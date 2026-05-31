/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#F7F8F4',
        foreground: '#102217',
        card: '#FFFFFF',
        primary: '#006947',
        'primary-dark': '#004d34',
        'primary-light': '#008a5d',
        accent: '#D4AF37', // Gold accent for cultural touch
        muted: '#D9E1DA',
        'muted-foreground': '#6D7A71',
        destructive: '#C2410C',
        success: '#15803D',
        'glass-bg': 'rgba(255, 255, 255, 0.7)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'high-tech': '0 10px 30px -10px rgba(0, 105, 71, 0.3)',
      }
    },
  },
};
