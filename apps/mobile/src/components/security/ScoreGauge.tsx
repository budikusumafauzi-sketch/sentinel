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
  const getStatusTheme = (score: number) => {
    if (score >= 85) {
      return {
        color: colors.secure,
        bgColor: colors.secureBg,
        borderColor: '#A7F3D0',
        textColor: colors.secureDark,
      };
    }
    if (score >= 65) {
      return {
        color: colors.warning,
        bgColor: '#FEF3C7',
        borderColor: '#FCD34D',
        textColor: colors.warningDark,
      };
    }
    return {
      color: colors.danger,
      bgColor: '#FEE2E2',
      borderColor: '#FCA5A5',
      textColor: colors.dangerDark,
    };
  };

  const statusTheme = getStatusTheme(scoreData.score);

  return (
    <Card
      variant="elevated"
      padding="lg"
      style={[styles.card, style]}
      accessibilityLabel={`Security Score: ${scoreData.score} out of 100. Status: ${scoreData.statusLabel}. ${scoreData.checksCompleted} checks completed.`}
    >
      {/* Title */}
      <Text style={styles.cardHeaderTitle}>Security Score</Text>

      {/* Circular Gauge Representation - Score Number is the Uncluttered Focal Point */}
      <View
        style={styles.gaugeWrapper}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: scoreData.score }}
      >
        <View style={[styles.outerRing, { borderColor: statusTheme.color }]}>
          <View style={styles.innerRing}>
            <Text style={styles.scoreNumber}>{scoreData.score}</Text>
            <Text style={styles.scoreScale}>/ 100</Text>
          </View>
        </View>
      </View>

      {/* Dedicated Prominent Status Badge — Solves Overlap Defect cleanly */}
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: statusTheme.bgColor,
            borderColor: statusTheme.borderColor,
          },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: statusTheme.textColor }]} />
        <Text
          style={[styles.statusBadgeText, { color: statusTheme.textColor }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {scoreData.statusLabel}
        </Text>
      </View>

      {/* Delta Label */}
      <View style={styles.deltaContainer}>
        <Text style={styles.deltaText}>{scoreData.deltaLabel}</Text>
      </View>

      {/* Severity Counters Row */}
      <View
        style={styles.severityRow}
        accessible={true}
        accessibilityLabel={`Findings breakdown: ${findingsSummary.critical} critical, ${findingsSummary.high} high, ${findingsSummary.medium} medium, ${findingsSummary.low} low`}
      >
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
    marginVertical: spacing.xs,
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  innerRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    lineHeight: 52,
  },
  scoreScale: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    marginTop: -2,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: spacing.md,
    maxWidth: '90%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs + 2,
  },
  statusBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  deltaContainer: {
    marginTop: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  deltaText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
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
