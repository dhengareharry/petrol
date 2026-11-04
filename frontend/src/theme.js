// Palette taken from the Oasis Fuel logo: deep navy, saffron orange and leaf green on a cool white.
export const COLORS = {
  primary: '#1B3A8F',
  primaryDark: '#0E1F5B',
  primaryLight: '#9DB4EC',
  primarySoft: '#E8EEFC',
  accent: '#F47B20',
  accentSoft: '#FFF1E4',
  accentText: '#B4540A',
  success: '#1E9E50',
  successSoft: '#E4F6EB',
  danger: '#D93025',
  dangerSoft: '#FDEBEA',
  warning: '#B4540A',
  background: '#F4F6FB',
  surface: '#FFFFFF',
  border: '#E3E8F2',
  borderInput: '#CBD5E8',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryMuted: '#C9D6FB',
  textPrimary: '#101B3B',
  textSecondary: '#55607A',
  textMuted: '#8A94AB',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const FONT = {
  small: 12,
  body: 14,
  label: 16,
  title: 18,
  heading: 22,
  display: 40,
};

// Soft, cool-tinted shadows (React Native 0.88 and react-native-web both understand `boxShadow`).
export const SHADOW = {
  card: { boxShadow: '0 2px 10px rgba(14, 31, 91, 0.07)' },
  raised: { boxShadow: '0 8px 24px rgba(14, 31, 91, 0.16)' },
  bar: { boxShadow: '0 -4px 16px rgba(14, 31, 91, 0.08)' },
};
