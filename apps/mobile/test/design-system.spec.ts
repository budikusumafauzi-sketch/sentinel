import {
  colors,
  severityColors,
  statusColors,
  fontSizes,
  fontWeights,
  spacing,
  radius,
  shadows,
} from '../src/design-system';

describe('Sentinel Design System Tokens', () => {
  it('should define primary brand and surface colors', () => {
    expect(colors.primary).toBe('#2563EB');
    expect(colors.background).toBe('#F8FAFC');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.textPrimary).toBe('#0F172A');
  });

  it('should define consistent severity color mappings', () => {
    expect(severityColors.critical).toBeDefined();
    expect(severityColors.critical.dark).toBe(colors.danger);
    expect(severityColors.high.dark).toBe(colors.high);
    expect(severityColors.medium.dark).toBe(colors.warning);
    expect(severityColors.low.dark).toBe('#3B82F6');
  });

  it('should define status color tokens', () => {
    expect(statusColors.secure).toBeDefined();
    expect(statusColors.verified).toBeDefined();
    expect(statusColors.attention).toBeDefined();
    expect(statusColors.risk).toBeDefined();
    expect(statusColors.unavailable).toBeDefined();
  });

  it('should define coherent typography scales', () => {
    expect(fontSizes.xs).toBeLessThan(fontSizes.sm);
    expect(fontSizes.sm).toBeLessThan(fontSizes.base);
    expect(fontSizes.base).toBeLessThan(fontSizes.lg);
    expect(fontSizes.lg).toBeLessThan(fontSizes.display);
    expect(fontWeights.bold).toBe('700');
  });

  it('should define spacing and radius scales', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.lg).toBe(16);
    expect(spacing.xxxl).toBe(32);

    expect(radius.sm).toBe(6);
    expect(radius.xl).toBe(18);
    expect(radius.full).toBe(9999);
  });

  it('should provide shadow style definitions', () => {
    expect(shadows.sm).toBeDefined();
    expect(shadows.md).toBeDefined();
    expect(shadows.lg).toBeDefined();
  });
});
