import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Card } from '../common/Card';
import { FindingCard } from './FindingCard';
import { ScreenHeader } from '../layout/ScreenHeader';
import type { SecurityReport } from '../../types/security';

interface FullReportViewProps {
  report: SecurityReport;
  onBack?: () => void;
  style?: ViewStyle;
}

export const FullReportView: React.FC<FullReportViewProps> = ({ report, onBack, style }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <ScreenHeader
        title="Full Security Report"
        subtitle={`Report ID: ${report.scanId} · Duration: ${report.duration}`}
        onBack={onBack}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
          onPress={() => setActiveTab('summary')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'summary' }}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            Overview Summary
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'details' }}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Detailed Findings ({report.findings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Report Summary Tab */}
      {activeTab === 'summary' ? (
        <View style={styles.contentSection}>
          {/* Top Check Statistics */}
          <Card variant="elevated" padding="lg" style={styles.statsCard}>
            <Text style={styles.statsTitle}>{report.checksCompleted} Checks Completed</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.secureDark }]}>
                  {report.checksPassed}
                </Text>
                <Text style={styles.statLabel}>Passed</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.warningDark }]}>
                  {report.checksAttention}
                </Text>
                <Text style={styles.statLabel}>Attention</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.dangerDark }]}>
                  {report.checksCritical}
                </Text>
                <Text style={styles.statLabel}>Critical</Text>
              </View>
            </View>
          </Card>

          {/* Category Breakdown */}
          <Text style={styles.sectionHeader}>Category Score Breakdown</Text>
          {report.categories.map((cat) => (
            <Card key={cat.id} variant="outlined" padding="md" style={styles.catCard}>
              <View style={styles.catHeader}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catScore}>{cat.score}/100</Text>
              </View>
              <View style={styles.catSubRow}>
                <Text style={styles.catSubText}>
                  {cat.passedChecks} of {cat.totalChecks} checks passed
                </Text>
                {cat.attentionChecks > 0 ? (
                  <Text style={styles.catAttentionText}>
                    {cat.attentionChecks} item needs review
                  </Text>
                ) : (
                  <Text style={styles.catPassedText}>✓ All clear</Text>
                )}
              </View>
            </Card>
          ))}

          {/* Platform Inspection Limitations */}
          <View style={styles.limitsBox}>
            <Text style={styles.limitsHeader}>Assessment Limitations & Scope</Text>
            {report.limitations.map((limit, idx) => (
              <Text key={idx} style={styles.limitItem}>
                • {limit}
              </Text>
            ))}
          </View>
        </View>
      ) : (
        /* Detailed Findings Tab */
        <View style={styles.contentSection}>
          <Text style={styles.sectionHeader}>Active Security Findings</Text>
          {report.findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: 3,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  tabText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  contentSection: {
    gap: spacing.md,
  },
  statsCard: {
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.heavy,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catCard: {
    marginBottom: spacing.xs,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catName: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  catScore: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  catSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catSubText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  catAttentionText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.warningDark,
  },
  catPassedText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.secureDark,
  },
  limitsBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  limitsHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  limitItem: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
});
