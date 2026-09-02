export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 44,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const typography = {
  displayScore: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.bold,
    color: '#0F172A',
  },
  screenTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: '#0F172A',
  },
  cardTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: '#0F172A',
  },
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: '#475569',
  },
  bodyMedium: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: '#0F172A',
  },
  caption: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: '#94A3B8',
  },
  captionMedium: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: '#475569',
  },
  badge: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
  },
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
} as const;
