import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors, severityColors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Card } from '../common/Card';
import { SeverityBadge } from '../common/Badge';
import { Icon } from '../common/Icon';
import type { ThreatIntelResult, ThreatSeverity } from '@sentinel/types';

interface ThreatIntelCardProps {
  result: ThreatIntelResult;
  onRefresh?: () => void;
  style?: ViewStyle;
}

export const ThreatIntelCard: React.FC<ThreatIntelCardProps> = ({ result, onRefresh, style }) => {
  const [showEvidence, setShowEvidence] = useState(false);

  // Map verdict to severity colors
  const severityKey: ThreatSeverity =
    result.verdict === 'MALICIOUS'
      ? result.severity === 'CRITICAL'
        ? 'CRITICAL'
        : 'HIGH'
      : result.verdict === 'SUSPICIOUS'
        ? 'MEDIUM'
        : result.verdict === 'CLEAN'
          ? 'LOW'
          : 'INFO';

  const theme = severityColors[severityKey] || severityColors.INFO;

  const isUnavailable = result.verdict === 'UNAVAILABLE';
  const isUnknown = result.verdict === 'UNKNOWN';

  return (
    <Card variant="outlined" padding="lg" style={[styles.card, style]}>
      {/* Provider Header & Authority */}
      <View style={styles.headerRow}>
        <View style={styles.sourceContainer}>
          <Text style={styles.sourceLabel}>THREAT INTELLIGENCE</Text>
          <Text style={styles.sourceName}>{result.sourceDisplayName}</Text>
        </View>
        <View style={styles.badgeRow}>
          {result.cached && (
            <View style={styles.cachedBadge}>
              <Text style={styles.cachedText}>CACHED</Text>
            </View>
          )}
          <SeverityBadge severity={severityKey} size="sm" />
        </View>
      </View>

      {/* Authority Level Description */}
      <View style={styles.authorityBox}>
        <Icon name="shield" size={14} color={colors.primary} />
        <Text style={styles.authorityText}>
          {result.sourceReliability.isAuthoritative
            ? 'Authoritative Official Standard'
            : 'Verified Security Intelligence'}{' '}
          ({result.sourceReliability.authorityLevel})
        </Text>
      </View>

      {/* Indicator & Verdict Banner */}
      <View
        style={[styles.verdictBanner, { backgroundColor: theme.light, borderColor: theme.border }]}
      >
        <View style={styles.verdictRow}>
          <Text style={styles.verdictLabel}>VERDICT:</Text>
          <Text style={[styles.verdictValue, { color: theme.dark }]}>{result.verdict}</Text>
        </View>
        <Text style={styles.indicatorText} numberOfLines={2}>
          {result.normalizedIndicator}
        </Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Threat Category</Text>
          <Text style={styles.metricValue}>{result.threatType}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text style={styles.metricValue}>
            {isUnavailable ? 'N/A' : `${Math.round(result.confidence * 100)}%`}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Severity</Text>
          <Text style={[styles.metricValue, { color: theme.dark }]}>{result.severity}</Text>
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.summaryText}>{result.summary}</Text>

      {/* Details if available */}
      {result.details && <Text style={styles.detailsText}>{result.details}</Text>}

      {/* Unknown / Unavailable Warning Notice (Never confuse Unknown with Safe) */}
      {(isUnknown || isUnavailable) && (
        <View style={styles.noticeBox}>
          <Icon name="alert-triangle" size={14} color={colors.warning} />
          <Text style={styles.noticeText}>
            {isUnavailable
              ? 'External threat feeds are temporarily unreachable. Core scanning remains active.'
              : 'No active malicious signatures observed. "Unknown" does not guarantee complete absence of risk.'}
          </Text>
        </View>
      )}

      {/* References Section */}
      {result.references.length > 0 && (
        <View style={styles.referencesSection}>
          <Text style={styles.sectionHeader}>Official References & Advisories</Text>
          {result.references.map((ref, idx) => (
            <View key={idx} style={styles.referenceItem}>
              <Icon name="external-link" size={12} color={colors.primary} />
              <Text style={styles.referenceName}>{ref.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Expandable Technical Evidence */}
      {Object.keys(result.evidence).length > 0 && (
        <>
          <TouchableOpacity
            style={styles.toggleEvidence}
            onPress={() => setShowEvidence(!showEvidence)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Toggle technical threat evidence details"
          >
            <Text style={styles.toggleEvidenceText}>
              {showEvidence ? 'Hide Technical Evidence' : 'View Full Technical Evidence'}
            </Text>
            <Icon
              name={showEvidence ? 'chevron-down' : 'chevron-right'}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showEvidence && (
            <View style={styles.evidenceBox}>
              {Object.entries(result.evidence).map(([key, val], idx) => (
                <View key={idx} style={styles.evidenceItem}>
                  <Text style={styles.evidenceLabel}>{key}:</Text>
                  <Text style={styles.evidenceVal}>
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Timestamp & Refresh Button */}
      <View style={styles.footerRow}>
        <Text style={styles.timestampText}>
          Retrieved: {new Date(result.retrievedAt).toLocaleTimeString()}
        </Text>
        {onRefresh && (
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Refresh threat intelligence"
          >
            <Icon name="refresh-cw" size={14} color={colors.primary} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sourceContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sourceLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  sourceName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cachedBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cachedText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  authorityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  authorityText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  verdictBanner: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  verdictLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  verdictValue: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  indicatorText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: 'monospace',
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
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  summaryText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  detailsText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  noticeText: {
    fontSize: fontSizes.xs,
    color: colors.warningDark || colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  referencesSection: {
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  referenceName: {
    fontSize: fontSizes.xs,
    color: colors.primary,
  },
  toggleEvidence: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleEvidenceText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  evidenceBox: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  evidenceItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  evidenceLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    width: 120,
  },
  evidenceVal: {
    fontSize: fontSizes.xs,
    color: colors.text,
    flex: 1,
    fontFamily: 'monospace',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timestampText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshBtnText: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
});
