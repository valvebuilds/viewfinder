/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Viewfinder Dark Mode Palette
        platinum: {
          50: '#f8faf9',
          100: '#f1f5f3',
          200: '#e3ebe7',
          300: '#cfdbd5', // Main platinum
          400: '#b8c9c0',
          500: '#a1b7ab',
          600: '#8aa596',
          700: '#739381',
          800: '#5c816c',
          900: '#456f57',
        },
        alabaster: {
          50: '#fafbf9',
          100: '#f5f7f2',
          200: '#ebefe5',
          300: '#e8eddf', // Main alabaster
          400: '#d1d9c3',
          500: '#bac5a7',
          600: '#a3b18b',
          700: '#8c9d6f',
          800: '#758953',
          900: '#5e7537',
        },
        saffron: {
          50: '#fefcf3',
          100: '#fdf8e7',
          200: '#fbf1cf',
          300: '#f9eab7',
          400: '#f7e39f',
          500: '#f5cb5c', // Main saffron
          600: '#dcb443',
          700: '#c39d2a',
          800: '#aa8611',
          900: '#916f00',
        },
        eerie: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#b9b9b9',
          400: '#a2a2a2',
          500: '#8b8b8b',
          600: '#747474',
          700: '#5d5d5d',
          800: '#464646',
          900: '#242423', // Main eerie black
        },
        jet: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#b9b9b9',
          400: '#a2a2a2',
          500: '#8b8b8b',
          600: '#747474',
          700: '#5d5d5d',
          800: '#464646',
          900: '#333533', // Main jet
        },
        // Primary color system using platinum
        primary: {
          50: '#f8faf9',
          100: '#f1f5f3',
          200: '#e3ebe7',
          300: '#cfdbd5',
          400: '#b8c9c0',
          500: '#a1b7ab',
          600: '#8aa596',
          700: '#739381',
          800: '#5c816c',
          900: '#456f57',
        },
        // Secondary system using jet
        secondary: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#b9b9b9',
          400: '#a2a2a2',
          500: '#8b8b8b',
          600: '#747474',
          700: '#5d5d5d',
          800: '#464646',
          900: '#333533',
        },
        // Accent colors
        accent: {
          saffron: '#f5cb5c',
          alabaster: '#e8eddf',
        },
        // Dark mode background colors
        background: '#242423', // Eerie black
        surface: '#333533', // Jet
        surfaceElevated: '#3a3b3a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
