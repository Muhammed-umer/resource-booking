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
          DEFAULT: '#0F828C', // Your main Teal color
          dark: '#095c63',    // Darker shade for hovers
          light: '#e6f2f3',   // Light shade for backgrounds
        }
      },
      // 2. CENTRAL FONT SETTINGS
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      // 3. CUSTOM SHADOW (Optional, for that specific "little shadow")
      boxShadow: {
        'navbar': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}