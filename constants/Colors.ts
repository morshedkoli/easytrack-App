/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Primary Colors
const primary = '#0f172a'; // Dark Navy Blue - Trust/Financial Focus
const secondary = '#14b8a6'; // Vibrant Teal - Chat/Energy

// Accent Colors
const success = '#10b981'; // Confident Green - Financial Success
const warning = '#f59e0b'; // Alert Orange - Warnings/Errors
const action = '#4f46e5'; // Trust Purple - Call-to-Action

// Neutral Colors
const backgroundLight = '#f8fafc'; // Soft White
const surfaceLight = '#ffffff'; // Pure White
const textPrimary = '#0f172a'; // Slate 900
const textSecondary = '#64748b'; // Slate 500

export const Colors = {
  light: {
    primary,
    secondary,
    success,
    warning,
    action,
    text: textPrimary,
    textSecondary,
    background: backgroundLight,
    surface: surfaceLight,
    tint: primary,
    icon: textSecondary,
    tabIconDefault: textSecondary,
    tabIconSelected: primary,
  },
  dark: {
    primary,
    secondary,
    success,
    warning,
    action,
    text: surfaceLight,
    textSecondary: '#94a3b8',
    background: primary,
    surface: '#1e293b',
    tint: secondary,
    icon: '#94a3b8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: secondary,
  },
};
