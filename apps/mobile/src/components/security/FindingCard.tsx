import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Card } from '../common/Card';
import { SeverityBadge } from '../common/Badge';
import { Icon } from '../common/Icon';
import type { Finding } from '../../types/security';

interface FindingCardProps {
  finding: Finding;
  onTakeAction?: (finding: Finding) => void;
  style?: ViewStyle;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onTakeAction, style }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="outlined" padding="lg" style={[styles.card, style]}>
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <SeverityBadge severity={finding.severity} size="sm" />
        <Text style={styles.categoryText}>{finding.category}</Text>
      </View>

      {/* Finding Title */}
      <Text style={styles.title}>{finding.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{finding.description}</Text>

      {/* Why it Matters Section */}
      <View style={styles.whyBox}>
        <Text style={styles.whyHeader}>Why does it matter?</Text>
        <Text style={styles.whyContent}>{finding.whyItMatters}</Text>
      </View>

      {/* Recommendation Section */}
      <View style={styles.recBox}>
        <Text style={styles.recHeader}>Recommendation</Text>
        <Text style={styles.recContent}>{finding.recommendation}</Text>
      </View>

      {/* Confidence & Action */}
      <View style={styles.footerRow}>
        <View style={styles.confidencePill}>
          <Text style={styles.confidenceLabel}>
            Confidence: <Text style={styles.confidenceVal}>{finding.confidence}%</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.evidenceToggle}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Toggle technical evidence"
        >
          <Text style={styles.evidenceToggleText}>
            {expanded ? 'Hide Evidence' : 'View Evidence'}
          </Text>
          <Icon
            name={expanded ? 'chevron-down' : 'chevron-right'}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Expandable Technical Evidence */}
      {expanded && (
        <View style={styles.evidenceContainer}>
          <Text style={styles.evidenceTitle}>Technical Evidence</Text>
          {finding.evidence.map((item, idx) => (
            <View key={idx} style={styles.evidenceRow}>
              <Text style={styles.evidenceLabel}>{item.label}:</Text>
              <Text style={styles.evidenceValue}>{item.value}</Text>
            </View>
          ))}
          {onTakeAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onTakeAction(finding)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Take Action on Finding</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryText: {
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
  whyBox: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  whyHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whyContent: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  recBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  recHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recContent: {
    fontSize: fontSizes.xs + 1,
    color: colors.primaryDark,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  confidencePill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  confidenceLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  confidenceVal: {
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  evidenceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceToggleText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  evidenceContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  evidenceTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  evidenceLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    flex: 1,
  },
  evidenceValue: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
    flex: 2,
    textAlign: 'right',
  },
  actionButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.semibold,
  },
});
