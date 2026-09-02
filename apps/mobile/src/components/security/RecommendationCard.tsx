import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Card } from '../common/Card';
import { SeverityBadge } from '../common/Badge';
import { PrimaryButton } from '../common/Button';
import type { Recommendation } from '../../types/security';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction?: (rec: Recommendation) => void;
  onViewAll?: () => void;
  style?: ViewStyle;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAction,
  onViewAll,
  style,
}) => {
  return (
    <Card variant="outlined" padding="lg" style={[styles.card, style]}>
      {/* Header Priority */}
      <View style={styles.headerRow}>
        <SeverityBadge
          severity={recommendation.priority}
          label={recommendation.priorityLabel}
          size="sm"
        />
        <Text style={styles.categoryBadge}>{recommendation.category}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{recommendation.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{recommendation.description}</Text>

      {/* Metadata Row: Impact and Time */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Impact</Text>
          <Text style={styles.impactValue}>{recommendation.impact}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Est. Time</Text>
          <Text style={styles.timeValue}>{recommendation.estimatedTime}</Text>
        </View>
      </View>

      {/* Primary Action Button */}
      <PrimaryButton
        title={recommendation.actionLabel}
        onPress={() => onAction && onAction(recommendation)}
        variant="primary"
        size="md"
        style={styles.actionBtn}
      />

      {/* Sub-action */}
      {onViewAll && (
        <View style={styles.viewAllWrapper}>
          <Text style={styles.viewAllText} onPress={onViewAll}>
            View All Recommendations
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: spacing.xl,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  impactValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.dangerDark,
  },
  timeValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  actionBtn: {
    width: '100%',
  },
  viewAllWrapper: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  viewAllText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
});
