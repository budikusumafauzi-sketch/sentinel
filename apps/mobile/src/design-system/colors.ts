import type { ThemeColors, SeverityLevel, StatusType } from '../types/ui';

export const colors: ThemeColors = {
  // Brand Blue
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryMuted: '#DBEAFE',

  // Surfaces & Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceSubtle: '#F8FAFC',

  // Borders
  border: '#E2E8F0',
  borderMuted: '#F1F5F9',
  borderFocus: '#2563EB',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status: Secure / Success
  secure: '#10B981',
  secureDark: '#059669',
  secureBg: '#ECFDF5',

  // Status: Warning / Medium
  warning: '#F59E0B',
  warningDark: '#D97706',
  warningBg: '#FFFBEB',

  // Status: High
  high: '#F97316',
  highDark: '#EA580C',
  highBg: '#FFF7ED',

  // Status: Danger / Critical
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerBg: '#FEF2F2',

  // Status: Info
  info: '#3B82F6',
  infoDark: '#1D4ED8',
  infoBg: '#EFF6FF',
};

export const severityColors: Record<
  SeverityLevel,
  { text: string; bg: string; border: string; dark: string }
> = {
  critical: {
    text: colors.dangerDark,
    bg: colors.dangerBg,
    border: '#FECACA',
    dark: colors.danger,
  },
  high: {
    text: colors.highDark,
    bg: colors.highBg,
    border: '#FED7AA',
    dark: colors.high,
  },
  medium: {
    text: colors.warningDark,
    bg: colors.warningBg,
    border: '#FDE68A',
    dark: colors.warning,
  },
  low: {
    text: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    dark: '#3B82F6',
  },
};

export const statusColors: Record<StatusType, { text: string; bg: string; border: string }> = {
  secure: {
    text: colors.secureDark,
    bg: colors.secureBg,
    border: '#A7F3D0',
  },
  verified: {
    text: colors.secureDark,
    bg: colors.secureBg,
    border: '#A7F3D0',
  },
  analyzed: {
    text: colors.warningDark,
    bg: colors.warningBg,
    border: '#FDE68A',
  },
  attention: {
    text: colors.warningDark,
    bg: colors.warningBg,
    border: '#FDE68A',
  },
  risk: {
    text: colors.dangerDark,
    bg: colors.dangerBg,
    border: '#FECACA',
  },
  unavailable: {
    text: colors.textMuted,
    bg: colors.surfaceMuted,
    border: colors.border,
  },
  pending: {
    text: colors.textSecondary,
    bg: colors.surfaceMuted,
    border: colors.border,
  },
};
