/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Luxury Ivory Light theme as default
        background: '#F8FAF9', // Breathtaking ivory/sage off-white
        foreground: '#0A120E', // Velvet charcoal emerald-black
        card: '#ffffff', // Glistening white cards
        primary: {
          DEFAULT: '#006947', // Deep imperial emerald green
          dark: '#004A2F',
          light: '#009962',
        },
        secondary: '#F0F4F1', // Premium pale forest neutral
        accent: {
          DEFAULT: '#D4AF37', // Luxurious glowing gold
          glow: '#F3E9D2',
          metallic: '#C5A028',
        },
        muted: {
          DEFAULT: '#E2EAE5',
          foreground: '#7C8E84', // Subtle emerald-gray text
        },
        destructive: '#E53E3E',
        success: '#00C853',
        border: '#E2EAE5', // Delicate emerald-sage border line
      },
      fontFamily: {
        heading: ['Geist-Bold', 'System'],
        sans: ['Inter-Regular', 'System'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      boxShadow: {
        'premium': '0 12px 40px rgba(0, 105, 71, 0.06)', // Elegant light drop shadow
        'premium-dark': '0 20px 50px rgba(212, 175, 55, 0.15)', // Luxurious gold shadow
        'bento': '0 8px 32px rgba(0, 0, 0, 0.05)',
      }
    },
  },
};
