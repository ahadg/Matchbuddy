import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#F7FAFB',
    textSecondary: 'rgba(232, 238, 245, 0.82)',
    textInverted: '#0E131D',
    background: '#0E1220',
    backgroundElement: 'rgba(33, 40, 61, 0.94)',
    backgroundSelected: 'rgba(255, 255, 255, 0.10)',
    backgroundMuted: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.12)',
    accent: '#B8FF61',
    accentSoft: 'rgba(184, 255, 97, 0.18)',
    accentStrong: '#E3FFC0',
    warm: '#FF8D62',
    warmSoft: 'rgba(255, 141, 98, 0.18)',
    danger: '#B983FF',
    dangerSoft: 'rgba(185, 131, 255, 0.20)',
    info: '#65D7FF',
    infoSoft: 'rgba(101, 215, 255, 0.18)',
    success: '#65F6B2',
    shadow: 'rgba(2, 7, 20, 0.60)',
    glass: 'rgba(255, 255, 255, 0.08)',
    glassStrong: 'rgba(255, 255, 255, 0.12)',
    accentGlow: 'rgba(184, 255, 97, 0.38)',
    warmGlow: 'rgba(255, 141, 98, 0.34)',
    violet: '#9D7BFF',
    violetSoft: 'rgba(157, 123, 255, 0.20)',
  },
  dark: {
    text: '#F7FAFB',
    textSecondary: 'rgba(232, 238, 245, 0.82)',
    textInverted: '#0E131D',
    background: '#0B0F1A',
    backgroundElement: 'rgba(26, 31, 46, 0.94)',
    backgroundSelected: 'rgba(255, 255, 255, 0.10)',
    backgroundMuted: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.12)',
    accent: '#B8FF61',
    accentSoft: 'rgba(184, 255, 97, 0.18)',
    accentStrong: '#E3FFC0',
    warm: '#FF8D62',
    warmSoft: 'rgba(255, 141, 98, 0.18)',
    danger: '#B983FF',
    dangerSoft: 'rgba(185, 131, 255, 0.20)',
    info: '#65D7FF',
    infoSoft: 'rgba(101, 215, 255, 0.18)',
    success: '#65F6B2',
    shadow: 'rgba(2, 7, 20, 0.65)',
    glass: 'rgba(255, 255, 255, 0.08)',
    glassStrong: 'rgba(255, 255, 255, 0.12)',
    accentGlow: 'rgba(184, 255, 97, 0.38)',
    warmGlow: 'rgba(255, 141, 98, 0.34)',
    violet: '#9D7BFF',
    violetSoft: 'rgba(157, 123, 255, 0.20)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'ui-serif',
    rounded: 'Avenir Next Condensed',
    mono: 'ui-monospace',
    display: 'Avenir Next Condensed',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
    display: 'sans-serif-condensed',
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
