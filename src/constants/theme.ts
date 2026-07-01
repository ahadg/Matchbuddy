import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#F7FAFB',
    textSecondary: 'rgba(232, 238, 245, 0.74)',
    textInverted: '#0E131D',
    background: '#0B1020',
    backgroundElement: 'rgba(24, 31, 48, 0.96)',
    backgroundSelected: 'rgba(255, 255, 255, 0.09)',
    backgroundMuted: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.10)',
    accent: '#A8F56D',
    accentSoft: 'rgba(168, 245, 109, 0.15)',
    accentStrong: '#E3FFC0',
    warm: '#FF9666',
    warmSoft: 'rgba(255, 150, 102, 0.16)',
    danger: '#BC8DFF',
    dangerSoft: 'rgba(188, 141, 255, 0.18)',
    info: '#67D0F9',
    infoSoft: 'rgba(103, 208, 249, 0.16)',
    success: '#65F6B2',
    shadow: 'rgba(2, 7, 20, 0.46)',
    glass: 'rgba(255, 255, 255, 0.08)',
    glassStrong: 'rgba(255, 255, 255, 0.12)',
    accentGlow: 'rgba(168, 245, 109, 0.30)',
    warmGlow: 'rgba(255, 150, 102, 0.30)',
    violet: '#9D7BFF',
    violetSoft: 'rgba(157, 123, 255, 0.20)',
  },
  dark: {
    text: '#F7FAFB',
    textSecondary: 'rgba(232, 238, 245, 0.74)',
    textInverted: '#0E131D',
    background: '#0B0F1A',
    backgroundElement: 'rgba(24, 31, 48, 0.96)',
    backgroundSelected: 'rgba(255, 255, 255, 0.09)',
    backgroundMuted: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.10)',
    accent: '#A8F56D',
    accentSoft: 'rgba(168, 245, 109, 0.15)',
    accentStrong: '#E3FFC0',
    warm: '#FF9666',
    warmSoft: 'rgba(255, 150, 102, 0.16)',
    danger: '#BC8DFF',
    dangerSoft: 'rgba(188, 141, 255, 0.18)',
    info: '#67D0F9',
    infoSoft: 'rgba(103, 208, 249, 0.16)',
    success: '#65F6B2',
    shadow: 'rgba(2, 7, 20, 0.48)',
    glass: 'rgba(255, 255, 255, 0.08)',
    glassStrong: 'rgba(255, 255, 255, 0.12)',
    accentGlow: 'rgba(168, 245, 109, 0.30)',
    warmGlow: 'rgba(255, 150, 102, 0.30)',
    violet: '#9D7BFF',
    violetSoft: 'rgba(157, 123, 255, 0.20)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'ui-serif',
    rounded: 'Avenir Next',
    mono: 'ui-monospace',
    display: 'Avenir Next',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
    display: 'sans-serif-medium',
  },
  web: {
    sans: 'var(--font-sans)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
    display: 'var(--font-display)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 20,
  five: 28,
  six: 64,
  seven: 88,
} as const;

export const Radii = {
  small: 12,
  medium: 16,
  large: 22,
  xlarge: 30,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 86, android: 90, default: 84 }) ?? 84;
export const MaxContentWidth = 438;
