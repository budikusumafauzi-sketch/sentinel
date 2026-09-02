import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon } from '../common/Icon';
import { Card } from '../common/Card';
import { PrimaryButton } from '../common/Button';

interface RiskStateProps {
  criticalCount: number;
  highCount: number;
  score: number;
  headlineFinding: string;
  whyItMatters: string;
  onTakeAction?: () => void;
  style?: ViewStyle;
}

export const RiskState: React.FC<RiskStateProps> = ({
  criticalCount,
  highCount,
  score,
  headlineFinding,
  whyItMatters,
  onTakeAction,
  style,
}) => {
  const totalUrgent = criticalCount + highCount;

  return (
    <Card variant="outlined" padding="lg" style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Icon name="alert-triangle" size={24} color={colors.dangerDark} />
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.riskBadge}>
            <Text style={styles.riskBadgeText}>
              {totalUrgent} High Priority {totalUrgent === 1 ? 'Issue' : 'Issues'}
            </Text>
          </View>
          <Text style={styles.scoreText}>Security Score: {score}/100</Text>
        </View>
      </View>

      <Text style={styles.headlineTitle}>{headlineFinding}</Text>

      <View style={styles.whyBox}>
        <Text style={styles.whyLabel}>Why does this matter?</Text>
        <Text style={styles.whyText}>{whyItMatters}</Text>
      </View>

      {onTakeAction && (
        <PrimaryButton
          title="Remediate Security Issue"
          onPress={onTakeAction}
          variant="danger"
          size="md"
          icon="shield-alert"
          style={styles.actionBtn}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.dangerBg,
  },
  riskBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.dangerDark,
  },
  scoreText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  headlineTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  whyBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  whyLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whyText: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionBtn: {
    width: '100%',
  },
});
