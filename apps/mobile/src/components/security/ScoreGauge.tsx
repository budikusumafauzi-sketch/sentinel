import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, severityColors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Card } from '../common/Card';
import type { SecurityScore, FindingSummary } from '../../types/security';

interface ScoreGaugeProps {
  scoreData: SecurityScore;
  findingsSummary: FindingSummary;
  style?: ViewStyle;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ scoreData, findingsSummary, style }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return colors.secure;
    if (score >= 65) return colors.warning;
    return colors.danger;
  };

  const scoreColor = getScoreColor(scoreData.score);

  return (
    <Card variant="elevated" padding="lg" style={[styles.card, style]}>
      {/* Title */}
      <Text style={styles.cardHeaderTitle}>Security Score</Text>

      {/* Circular Gauge Representation */}
      <View style={styles.gaugeWrapper}>
        <View style={[styles.outerRing, { borderColor: scoreColor }]}>
          <View style={styles.innerRing}>
            <Text style={styles.scoreNumber}>{scoreData.score}</Text>
            <Text style={[styles.scoreStatus, { color: scoreColor }]}>{scoreData.statusLabel}</Text>
          </View>
        </View>
      </View>

      {/* Delta Label */}
      <View style={styles.deltaContainer}>
        <Text style={styles.deltaText}>{scoreData.deltaLabel}</Text>
      </View>

      {/* Severity Counters Row */}
      <View style={styles.severityRow}>
        <View style={styles.severityItem}>
          <Text style={[styles.severityCount, { color: severityColors.critical.dark }]}>
            {findingsSummary.critical}
          </Text>
          <Text style={styles.severityLabel}>Critical</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.severityItem}>
          <Text style={[styles.severityCount, { color: severityColors.high.dark }]}>
            {findingsSummary.high}
          </Text>
          <Text style={styles.severityLabel}>High</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.severityItem}>
          <Text style={[styles.severityCount, { color: severityColors.medium.dark }]}>
            {findingsSummary.medium}
          </Text>
          <Text style={styles.severityLabel}>Medium</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.severityItem}>
          <Text style={[styles.severityCount, { color: severityColors.low.dark }]}>
            {findingsSummary.low}
          </Text>
          <Text style={styles.severityLabel}>Low</Text>
        </View>
      </View>

      {/* Scan Metadata */}
      <View style={styles.metaContainer}>
        <Text style={styles.metaChecks}>
          <Text style={styles.metaChecksBold}>{scoreData.checksCompleted}</Text> Checks Completed
        </Text>
        <Text style={styles.metaTime}>Last scan: {scoreData.lastScanTime}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardHeaderTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  outerRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  innerRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    lineHeight: 50,
  },
  scoreStatus: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  deltaContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.secureBg,
  },
  deltaText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.secureDark,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
  },
  severityItem: {
    alignItems: 'center',
    flex: 1,
  },
  severityCount: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  severityLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  metaContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  metaChecks: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  metaChecksBold: {
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  metaTime: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 3,
  },
});
