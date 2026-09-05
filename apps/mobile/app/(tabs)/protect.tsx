import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { fontSizes, fontWeights } from '../../src/design-system/typography';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Card } from '../../src/components/common/Card';
import { StatusBadge } from '../../src/components/common/Badge';
import { Icon } from '../../src/components/common/Icon';
import { FindingCard } from '../../src/components/security/FindingCard';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { securityStore } from '../../src/services/securityStore';
import type { SystemControlStatus } from '../../src/types/security';

type CategoryTabId =
  'all' | 'device' | 'applications' | 'accounts' | 'privacy' | 'network' | 'system';

export default function ProtectScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryTabId>('applications');
  const [report, setReport] = useState(() => securityStore.getReport());

  useEffect(() => {
    return securityStore.subscribe(() => {
      setReport(securityStore.getReport());
    });
  }, []);

  const categories = securityStore.getCategories();
  const allFindings = securityStore.getFindings();

  const categoryFindings = allFindings.filter((f) => {
    if (activeCategory === 'all') return true;
    return f.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const systemControls: SystemControlStatus[] = report
    ? [
        {
          id: 'ctrl-lock',
          name: 'Screen Lock & Keyguard',
          status: report.findings.some(
            (f) => f.ruleId === 'SEC-SYS-SCREEN-LOCK' && f.status === 'ACTIVE',
          )
            ? 'risk'
            : 'secure',
          statusLabel: report.findings.some(
            (f) => f.ruleId === 'SEC-SYS-SCREEN-LOCK' && f.status === 'ACTIVE',
          )
            ? 'Disabled'
            : 'Configured',
          lastChecked: 'Verified',
        },
        {
          id: 'ctrl-enc',
          name: 'Device Storage Encryption',
          status: report.findings.some(
            (f) => f.ruleId === 'SEC-SYS-STORAGE-ENCRYPTION' && f.status === 'ACTIVE',
          )
            ? 'risk'
            : 'secure',
          statusLabel: report.findings.some(
            (f) => f.ruleId === 'SEC-SYS-STORAGE-ENCRYPTION' && f.status === 'ACTIVE',
          )
            ? 'Inactive'
            : 'Encrypted',
          lastChecked: 'Verified',
        },
        {
          id: 'ctrl-patch',
          name: 'OS Security Patch Level',
          status: report.findings.some(
            (f) => f.ruleId === 'SEC-SYS-SECURITY-PATCH' && f.status === 'ACTIVE',
          )
            ? 'attention'
            : 'secure',
          statusLabel: report.findings.some(
            (f) => f.ruleId === 'SEC-SYS-SECURITY-PATCH' && f.status === 'ACTIVE',
          )
            ? 'Outdated'
            : report.deviceInfo?.securityPatch || 'Current',
          lastChecked: report.deviceInfo?.securityPatch || 'Checked',
        },
        {
          id: 'ctrl-adb',
          name: 'USB Debugging (ADB)',
          status: report.findings.some(
            (f) => f.ruleId === 'SEC-SYS-DEV-DEBUGGING' && f.status === 'ACTIVE',
          )
            ? 'attention'
            : 'secure',
          statusLabel: report.findings.some(
            (f) => f.ruleId === 'SEC-SYS-DEV-DEBUGGING' && f.status === 'ACTIVE',
          )
            ? 'Enabled'
            : 'Disabled',
          lastChecked: 'Verified',
        },
      ]
    : [
        {
          id: 'ctrl-lock',
          name: 'Screen Lock & Keyguard',
          status: 'pending',
          statusLabel: 'Pending Scan',
          lastChecked: 'Not checked',
        },
        {
          id: 'ctrl-enc',
          name: 'Device Storage Encryption',
          status: 'pending',
          statusLabel: 'Pending Scan',
          lastChecked: 'Not checked',
        },
        {
          id: 'ctrl-patch',
          name: 'OS Security Patch Level',
          status: 'pending',
          statusLabel: 'Pending Scan',
          lastChecked: 'Not checked',
        },
        {
          id: 'ctrl-adb',
          name: 'USB Debugging (ADB)',
          status: 'pending',
          statusLabel: 'Pending Scan',
          lastChecked: 'Not checked',
        },
      ];

  const currentCategoryData =
    activeCategory === 'all'
      ? {
          id: 'all',
          name: 'All Security Categories',
          score: report?.overallScore ?? 100,
          passedChecks: Math.max(
            0,
            (report?.checksCompleted ?? 0) -
              (report?.findings?.filter((f) => f.status === 'ACTIVE')?.length ?? 0),
          ),
          totalChecks: report?.checksCompleted ?? 0,
        }
      : categories.find((c) => c.id.toLowerCase() === activeCategory.toLowerCase());

  const categoryPassedCount = currentCategoryData
    ? 'passedChecks' in currentCategoryData
      ? currentCategoryData.passedChecks
      : (currentCategoryData as any).checksCount - (currentCategoryData as any).issuesCount
    : 0;

  const categoryTotalCount = currentCategoryData
    ? 'totalChecks' in currentCategoryData
      ? currentCategoryData.totalChecks
      : (currentCategoryData as any).checksCount
    : 0;

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Security Protection"
        subtitle="Manage controls and inspection boundaries"
      />

      {/* Horizontal Category Switcher — Constrained to avoid vertical stretching */}
      <View style={styles.categoryBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[styles.catPill, activeCategory === 'all' && styles.catPillActive]}
            onPress={() => setActiveCategory('all')}
            accessibilityRole="button"
            accessibilityLabel="Filter all security categories"
          >
            <Text
              style={[styles.catPillText, activeCategory === 'all' && styles.catPillTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setActiveCategory(cat.id as CategoryTabId)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat.name} category`}
              >
                <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Overview Card */}
      {currentCategoryData && (
        <Card variant="outlined" padding="md" style={styles.categorySummaryCard}>
          <View style={styles.catSummaryHeader}>
            <View style={styles.catSummaryLeft}>
              <Text style={styles.catSummaryTitle}>{currentCategoryData.name}</Text>
              <Text style={styles.catSummarySub}>
                {categoryPassedCount} of {categoryTotalCount} checks verified ·{' '}
                {categoryFindings.length} active finding(s)
              </Text>
            </View>
            <View style={styles.catScoreBadge}>
              <Text style={styles.catScoreNumber}>{currentCategoryData.score}</Text>
              <Text style={styles.catScoreScale}>/ 100</Text>
            </View>
          </View>
        </Card>
      )}

      {/* System Category Specific View */}
      {activeCategory === 'system' && (
        <View style={styles.sectionWrapper}>
          <SectionHeader title="Operating System & Kernel Safeguards" />
          <Card variant="outlined" padding="md" style={styles.controlsCard}>
            {systemControls.map((ctrl) => (
              <View key={ctrl.id} style={styles.controlRow}>
                <View style={styles.ctrlLeft}>
                  <Text style={styles.ctrlName}>{ctrl.name}</Text>
                  <Text style={styles.ctrlChecked}>Status: {ctrl.lastChecked}</Text>
                </View>
                <StatusBadge status={ctrl.status} label={ctrl.statusLabel} size="sm" />
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Category Findings Section */}
      <View style={styles.sectionWrapper}>
        <SectionHeader
          title={
            activeCategory === 'all'
              ? `Active Security Findings (${allFindings.length})`
              : `${activeCategory.toUpperCase()} Findings (${categoryFindings.length})`
          }
        />
        {categoryFindings.length > 0 ? (
          categoryFindings.map((finding) => <FindingCard key={finding.id} finding={finding} />)
        ) : (
          <Card variant="outlined" padding="lg" style={styles.allClearCard}>
            <Icon name="check" size={24} color={colors.secureDark} />
            <Text style={styles.allClearTitle}>No Active Findings in this Category</Text>
            <Text style={styles.allClearSub}>
              Based on the checks available to Sentinel, all evaluated controls passed without
              detected anomalies.
            </Text>
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  categoryBarContainer: {
    marginBottom: spacing.md,
  },
  categoryScrollView: {
    flexGrow: 0,
    height: 44,
  },
  categoryScroll: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  catPill: {
    alignSelf: 'center',
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  catPillTextActive: {
    color: colors.textInverse,
  },
  categorySummaryCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  catSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catSummaryLeft: {
    flex: 1,
  },
  catSummaryTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  catSummarySub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  catScoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  catScoreNumber: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  catScoreScale: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginLeft: 2,
  },
  sectionWrapper: {
    marginBottom: spacing.lg,
  },
  controlsCard: {
    marginBottom: spacing.md,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  ctrlLeft: {
    flex: 1,
  },
  ctrlName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  ctrlChecked: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  allClearCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
  },
  allClearTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: 4,
    textAlign: 'center',
  },
  allClearSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
});
