/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#040806', // Velvet obsidian deep dark background
        foreground: '#F1F4F2', // Crisp luxury white
        card: '#0A120E', // Dark glass obsidian card background
        primary: {
          DEFAULT: '#006947', // Deep imperial emerald green
          dark: '#004A2F',
          light: '#009962',
        },
        secondary: '#111E18', // Sleek forest-deep neutral
        accent: {
          DEFAULT: '#D4AF37', // Luxurious glowing gold
          glow: '#F3E9D2',
          metallic: '#C5A028',
        },
        muted: {
          DEFAULT: '#0D1813',
          foreground: '#7C8E84', // Subtle emerald-gray text
        },
        destructive: '#E53E3E',
        success: '#00C853',
        border: '#162C24', // Delicate metallic-emerald border
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
        'premium': '0 20px 50px rgba(212, 175, 55, 0.15)', // Luxury gold shadow
        'emerald-glow': '0 8px 32px rgba(0, 105, 71, 0.25)', // Glowing emerald shadow
        'bento': '0 8px 32px rgba(0, 0, 0, 0.4)',
      }
    },
  },
};
