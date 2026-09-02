/**
 * Sentinel UI and Design System Types
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type StatusType =
  'secure' | 'verified' | 'analyzed' | 'attention' | 'risk' | 'unavailable' | 'pending';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export type NavTab = 'overview' | 'scan' | 'protect' | 'intelligence' | 'profile';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;

  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSubtle: string;

  border: string;
  borderMuted: string;
  borderFocus: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  secure: string;
  secureDark: string;
  secureBg: string;

  warning: string;
  warningDark: string;
  warningBg: string;

  high: string;
  highDark: string;
  highBg: string;

  danger: string;
  dangerDark: string;
  dangerBg: string;

  info: string;
  infoDark: string;
  infoBg: string;
}
