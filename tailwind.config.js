/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',    // Softer Blue (Less intense than before)
        secondary: '#0e7490',  // Calmer Teal
        success: '#10b981',    // Bright success green
        warning: '#f59e0b',    // Warm yellow-orange
        action: '#3b82f6',     // Standard blue for actions
        background: {
          DEFAULT: '#ffffff',  // Pure white for clean look
          dark: '#f1f5f9'      // Light gray as alt background
        },
        surface: {
          DEFAULT: '#f9fafb',  // Very light gray
          dark: '#e5e7eb'      // Slightly darker surface
        },
        text: {
          primary: {
            DEFAULT: '#1f2937',  // Dark gray for good readability
            dark: '#111827'      // Even darker for contrast if needed
          },
          secondary: {
            DEFAULT: '#6b7280',  // Muted gray for secondary text
            dark: '#4b5563'      // Darker gray
          }
        },
        accent: {
          DEFAULT: '#6366f1',  // Soft purple accent
          dark: '#818cf8'      // Lighter accent for contrast
        },
        error: {
          DEFAULT: '#f87171',  // Softer red
          dark: '#ef4444'      // Bright error red
        },
        info: {
          DEFAULT: '#0ea5e9',  // Bright info blue
          dark: '#38bdf8'      // Softer blue for info
        }
      }
    },
  },
  plugins: [],
}
