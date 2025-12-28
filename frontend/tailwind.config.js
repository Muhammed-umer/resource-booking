/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. CENTRAL COLOR PALETTE
      colors: {
        primary: {
          DEFAULT: '#0F828C', // Your Specific Teal
          dark: '#095c63',    // Darker for hover
          light: '#e6f2f3',   // Light background
        },
        success: {
          DEFAULT: '#16a34a', // Standard Green
          light: '#dcfce7',   // Light Green bg
          dark: '#15803d',    // Dark Green hover
        },
        error: {
          DEFAULT: '#dc2626', // Standard Red
          light: '#fee2e2',   // Light Red bg
          dark: '#b91c1c',    // Dark Red hover
        }
      },
      // 2. ANIMATIONS
      animation: {
        'scale-up': 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'shake': 'shake 0.4s ease-in-out',
        'draw-check': 'drawCheck 0.6s 0.3s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'shine': 'shine 3s infinite linear',
      },
      keyframes: {
        scaleUp: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        drawCheck: {
          '0%': { strokeDasharray: '100', strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shine: {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '50%, 100%': { transform: 'translateX(250%) skewX(-20deg)' },
        }
      }
    },
  },
  plugins: [],
}
