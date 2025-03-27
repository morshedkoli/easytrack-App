/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',    // Dark Navy Blue
        secondary: '#14b8a6',  // Vibrant Teal
        success: '#10b981',    // Confident Green
        warning: '#f59e0b',    // Alert Orange
        action: '#4f46e5',     // Trust Purple
        background: {
          DEFAULT: '#f8fafc',  // Soft White
          dark: '#0f172a'      // Dark Navy Blue
        },
        surface: {
          DEFAULT: '#ffffff',  // Pure White
          dark: '#1e293b'      // Dark Slate
        },
        text: {
          primary: {
            DEFAULT: '#0f172a',
            dark: '#ffffff'
          },
          secondary: {
            DEFAULT: '#64748b',
            dark: '#94a3b8'
          }
        }
      }
    },
  },
  plugins: [],
}