/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',    // Bright Blue (Good Contrast for Light Mode)
        secondary: '#0f766e',  // Deep Teal (Balanced Vibrancy)
        success: '#059669',    // Strong Green (Clear Indication)
        warning: '#d97706',    // Muted Orange (Less Harsh in Light Mode)
        action: '#4338ca',     // Rich Indigo (Consistent with Dark Mode)
        background: {
          DEFAULT: '#f9fafb',  // Slightly off-white for better contrast
          dark: '#1e293b'      // Dark slate for dark mode
        },
        surface: {
          DEFAULT: '#f3f4f6',  // Light gray for better contrast
          dark: '#334155'      // Darker slate for dark mode
        },
        text: {
          primary: {
            DEFAULT: '#111827',  // Almost black for high contrast
            dark: '#f8fafc'      // Very light gray for dark mode
          },
          secondary: {
            DEFAULT: '#374151',  // Dark gray for secondary text
            dark: '#e5e7eb'      // Light gray for dark mode
          }
        },
        // Additional theme colors for better visibility
        accent: {
          DEFAULT: '#7c3aed',  // Purple accent
          dark: '#8b5cf6'      // Lighter purple for dark mode
        },
        error: {
          DEFAULT: '#dc2626',  // Red for errors
          dark: '#ef4444'      // Brighter red for dark mode
        },
        info: {
          DEFAULT: '#0284c7',  // Blue for info
          dark: '#0ea5e9'      // Brighter blue for dark mode
        }
      }
    },
  },
  plugins: [],
}