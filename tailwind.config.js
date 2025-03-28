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
          DEFAULT: '#ffffff',  // Pure White
          dark: '#f8fafc'      // Soft White (Alternative Background)
        },
        surface: {
          DEFAULT: '#f8fafc',  // Soft White (Better Contrast)
          dark: '#e2e8f0'      // Light Gray (Alternative Surface)
        },
        text: {
          primary: {
            DEFAULT: '#1e293b',  // Dark Slate (High Readability)
            dark: '#0f172a'      // Navy Blue (Soft Contrast)
          },
          secondary: {
            DEFAULT: '#475569',  // Medium Gray (Readable Secondary Text)
            dark: '#64748b'      // Soft Slate (Subtle Text)
          }
        }
      }
    },
  },
  plugins: [],
}