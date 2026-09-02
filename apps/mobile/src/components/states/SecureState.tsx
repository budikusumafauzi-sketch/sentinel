import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon } from '../common/Icon';
import { Card } from '../common/Card';

interface SecureStateProps {
  checksCompleted?: number;
  categoriesAssessed?: number;
  controlsEvaluated?: number;
  style?: ViewStyle;
}

export const SecureState: React.FC<SecureStateProps> = ({
  checksCompleted = 147,
  categoriesAssessed = 6,
  controlsEvaluated = 23,
  style,
}) => {
  return (
    <Card variant="outlined" padding="lg" style={[styles.card, style]}>
      <View style={styles.iconCircle}>
        <Icon name="check" size={28} color={colors.secureDark} />
      </View>

      <Text style={styles.title}>YOUR DEVICE LOOKS SECURE</Text>
      <Text style={styles.subtitle}>
        {checksCompleted} checks completed · {categoriesAssessed} categories assessed ·{' '}
        {controlsEvaluated} controls evaluated
      </Text>

      <View style={styles.positiveBadge}>
        <Text style={styles.positiveText}>✓ No critical issues detected</Text>
      </View>

      <View style={styles.checkedSection}>
        <Text style={styles.checkedHeader}>Verified Safeguards</Text>
        <View style={styles.checklist}>
          <Text style={styles.checkItem}>• Operating system integrity & patch status</Text>
          <Text style={styles.checkItem}>• Hardware-backed encryption & lock screen</Text>
          <Text style={styles.checkItem}>• Network Wi-Fi security & DNS protocols</Text>
          <Text style={styles.checkItem}>• Application signatures & permission boundaries</Text>
        </View>
      </View>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          Based on the authorized checks available to Sentinel. No security solution can guarantee
          absolute prevention.
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secureBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fontSizes.xs + 1,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  positiveBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.secureBg,
    marginBottom: spacing.lg,
  },
  positiveText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.secureDark,
  },
  checkedSection: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  checkedHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checklist: {
    gap: 4,
  },
  checkItem: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  disclaimerBox: {
    paddingTop: spacing.xs,
  },
  disclaimerText: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
