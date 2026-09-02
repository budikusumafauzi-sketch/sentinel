import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors, severityColors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Card } from '../common/Card';
import { SeverityBadge } from '../common/Badge';
import { Icon } from '../common/Icon';
import type { ThreatAnalyzerResult } from '../../types/security';

interface AnalyzerResultCardProps {
  result: ThreatAnalyzerResult;
  onReset?: () => void;
  style?: ViewStyle;
}

export const AnalyzerResultCard: React.FC<AnalyzerResultCardProps> = ({
  result,
  onReset,
  style,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const theme = severityColors[result.riskLevel];

  return (
    <Card variant="outlined" padding="lg" style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>ANALYSIS RESULT</Text>
        <SeverityBadge severity={result.riskLevel} size="sm" />
      </View>

      {/* Metrics Row: Risk Level & Confidence */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Risk Assessment</Text>
          <Text style={[styles.metricValue, { color: theme.dark }]}>
            {result.riskLevel.toUpperCase()} RISK
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text style={styles.metricValue}>{result.confidence}%</Text>
        </View>
      </View>

      {/* Threat Type */}
      <View style={styles.threatTypeRow}>
        <Text style={styles.threatTypeLabel}>Detected Threat:</Text>
        <Text style={styles.threatTypeValue}>{result.threatType}</Text>
      </View>

      {/* Summary */}
      <Text style={styles.summaryText}>{result.summary}</Text>

      {/* Indicators List */}
      <View style={styles.indicatorsSection}>
        <Text style={styles.sectionHeader}>Detected Threat Indicators</Text>
        {result.indicators.map((indicator, idx) => (
          <View key={idx} style={styles.indicatorRow}>
            <View style={[styles.indicatorDot, { backgroundColor: theme.dark }]} />
            <Text style={styles.indicatorText}>{indicator}</Text>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.recSection}>
        <Text style={styles.sectionHeader}>Recommended Next Steps</Text>
        {result.recommendations.map((rec, idx) => (
          <View key={idx} style={styles.recRow}>
            <Icon name="check" size={14} color={colors.secureDark} />
            <Text style={styles.recText}>{rec}</Text>
          </View>
        ))}
      </View>

      {/* Expandable Technical Evidence */}
      {result.evidenceList.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.toggleEvidence}
            onPress={() => setShowDetails(!showDetails)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Toggle technical evidence details"
          >
            <Text style={styles.toggleEvidenceText}>
              {showDetails ? 'Hide Technical Evidence' : 'View Full Technical Evidence'}
            </Text>
            <Icon
              name={showDetails ? 'chevron-down' : 'chevron-right'}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.evidenceBox}>
              {result.evidenceList.map((item, idx) => (
                <View key={idx} style={styles.evidenceItem}>
                  <Text style={styles.evidenceLabel}>{item.label}:</Text>
                  <Text style={styles.evidenceVal}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Reset Action */}
      {onReset && (
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={onReset}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Clear and analyze new content"
        >
          <Text style={styles.resetBtnText}>Analyze Another Item</Text>
        </TouchableOpacity>
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
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  threatTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  threatTypeLabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  threatTypeValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  summaryText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  indicatorsSection: {
    marginBottom: spacing.md,
    backgroundColor: '#FFFBFB',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  recSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.secureBg,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  sectionHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  indicatorText: {
    fontSize: fontSizes.xs + 1,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: spacing.sm,
  },
  recText: {
    fontSize: fontSizes.xs + 1,
    color: colors.secureDark,
    flex: 1,
    lineHeight: 18,
    fontWeight: fontWeights.medium,
  },
  toggleEvidence: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 4,
  },
  toggleEvidenceText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  evidenceBox: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  evidenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  evidenceLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    flex: 1,
  },
  evidenceVal: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
    flex: 2,
    textAlign: 'right',
  },
  resetBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
});
