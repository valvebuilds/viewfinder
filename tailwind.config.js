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
        // Primary Colors
        'prussian-blue': {
          DEFAULT: '#346B85',
          50: '#E8EBF0',
          100: '#D1D7E1',
          200: '#A3AFC3',
          300: '#7587A5',
          400: '#475F87',
          500: '#346B85',
          600: '#2A5568',
          700: '#1F2D42',
          800: '#192538',
          900: '#131D2E',
        },
        'baby-powder': {
          DEFAULT: '#FBFAF5',
          50: '#FBFAF5',
          100: '#F2F2EB',
          200: '#EDECE4',
        },
        'dim-gray': {
          DEFAULT: '#A8A396',
          50: '#FBFAF5',
          100: '#F2F2EB',
          200: '#EDECE4',
          300: '#E0DDD4',
          400: '#C4C0B5',
          500: '#A8A396',
          600: '#8C8677',
          700: '#706958',
          800: '#544C39',
          900: '#1F2D42',
        },
        'rose-ebony': '#544C39',
        
        // Aliases for easier use as per style guide
        primary: {
          DEFAULT: '#346B85', // Prussian Blue Base
          50: '#E8EBF0',
          100: '#D1D7E1',
          200: '#A3AFC3',
          300: '#7587A5',
          400: '#475F87',
          500: '#346B85',
          600: '#2A5568',
          700: '#1F2D42',
          800: '#192538',
          900: '#131D2E',
        },
        secondary: {
          DEFAULT: '#FBFAF5', // Baby Powder Base
          50: '#FBFAF5',
          100: '#F2F2EB',
          200: '#EDECE4',
        },
        accent: {
          DEFAULT: '#A8A396', // Dim Gray Base
          50: '#FBFAF5',
          100: '#F2F2EB',
          200: '#EDECE4',
          300: '#E0DDD4',
          400: '#C4C0B5',
          500: '#A8A396',
          600: '#8C8677',
          700: '#706958',
          800: '#544C39',
          900: '#1F2D42',
        },
        neutral: {
          50: '#FBFAF5',
          100: '#F2F2EB',
          200: '#EDECE4',
          300: '#E0DDD4',
          400: '#C4C0B5',
          500: '#A8A396',
          600: '#8C8677',
          700: '#706958',
          800: '#544C39',
          900: '#1F2D42',
        },
        // Ensure the style guide specified colors are available directly
        'navy': {
          50: '#E8EBF0',
          100: '#D1D7E1',
          200: '#A3AFC3',
          300: '#7587A5',
          400: '#475F87',
          500: '#346B85',
          600: '#2A5568',
          700: '#1F2D42',
          800: '#192538',
          900: '#131D2E',
        },
        'cream': {
          50: '#FBFAF5',
          100: '#F2F2EB',
          200: '#EDECE4',
        },
        'gray': {
          50: '#FBFAF5',
          100: '#F2F2EB',
          200: '#EDECE4',
          300: '#E0DDD4',
          400: '#C4C0B5',
          500: '#A8A396',
          600: '#8C8677',
          700: '#706958',
          800: '#544C39',
          900: '#1F2D42',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'Sora', 'system-ui', 'sans-serif'],
        sans: ['Sora', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display sizes (1.25 modular scale)
        'display-lg': ['5.96rem', { lineHeight: '1' }], // 95.328px
        'display': ['4.768rem', { lineHeight: '1.15' }], // 76.288px
        'display-sm': ['3.815rem', { lineHeight: '1.15' }], // 61.04px

        // Heading sizes
        'h1': ['3.052rem', { lineHeight: '1.3' }], // 48.832px
        'h2': ['2.441rem', { lineHeight: '1.3' }], // 39.056px
        'h3': ['1.953rem', { lineHeight: '1.3' }], // 31.248px
        'h4': ['1.563rem', { lineHeight: '1.3' }], // 25.008px
        'h5': ['1.25rem', { lineHeight: '1.3' }], // 20px
        'h6': ['1rem', { lineHeight: '1.3' }], // 16px

        // Body sizes
        'body': ['1.125rem', { lineHeight: '1.6' }], // 18px
        'base': ['1rem', { lineHeight: '1.5' }], // 16px

        // UI sizes
        'ui-lg': ['1.125rem', { lineHeight: '1.75' }], // 18px
        'ui': ['1rem', { lineHeight: '1.75' }], // 16px
        'ui-sm': ['0.875rem', { lineHeight: '1.75' }], // 14px

        // Small text
        'sm': ['0.875rem', { lineHeight: '1.6' }], // 14px
        'xs': ['0.75rem', { lineHeight: '1.6' }], // 12px
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulseGlow': 'pulseGlow 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(100%)' },
          '50%': { opacity: '0.7', filter: 'brightness(150%)' },
        },
      },
      boxShadow: {
        'soft': '0_2px_8px_rgba(0,0,0,0.04)',
        'medium': '0_4px_16px_rgba(0,0,0,0.08)',
        'strong': '0_8px_32px_rgba(0,0,0,0.12)',
        'button-default': '0_2px_8px_-2px_rgba(31,45,66,0.15)',
        'button-hover': '0_8px_24px_-4px_rgba(31,45,66,0.3)',
        'card-default': '0_2px_8px_rgba(0,0,0,0.04)',
        'card-hover': '0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
