import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '../../src/design-system/spacing';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { ScoreGauge } from '../../src/components/security/ScoreGauge';
import { PrimaryButton, SecondaryButton } from '../../src/components/common/Button';
import { CategoryCard } from '../../src/components/security/CategoryCard';
import { RecommendationCard } from '../../src/components/security/RecommendationCard';
import { ActivityItem } from '../../src/components/security/ActivityItem';
import { SystemStatusRow } from '../../src/components/security/SystemStatusRow';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { Card } from '../../src/components/common/Card';
import { FullReportView } from '../../src/components/security/FullReportView';
import { useResponsive } from '../../src/hooks/useResponsive';
import { securityStore } from '../../src/services/securityStore';
import type { SystemControlStatus } from '../../src/types/security';

export default function OverviewScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const [showFullReport, setShowFullReport] = useState(false);
  const [report, setReport] = useState(() => securityStore.getReport());

  useEffect(() => {
    return securityStore.subscribe(() => {
      setReport(securityStore.getReport());
    });
  }, []);

  const scoreData = securityStore.getScoreData();
  const findingsSummary = securityStore.getFindingsSummary();
  const categories = securityStore.getCategories();
  const recommendations = securityStore.getRecommendations();
  const activity = securityStore.getActivity();
  const fullReport = securityStore.getReportViewData();

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
            ? 'critical'
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
          status: 'neutral',
          statusLabel: 'Pending Scan',
          lastChecked: 'Not checked',
        },
        {
          id: 'ctrl-enc',
          name: 'Device Storage Encryption',
          status: 'neutral',
          statusLabel: 'Pending Scan',
          lastChecked: 'Not checked',
        },
        {
          id: 'ctrl-patch',
          name: 'OS Security Patch Level',
          status: 'neutral',
          statusLabel: 'Pending Scan',
          lastChecked: 'Not checked',
        },
        {
          id: 'ctrl-adb',
          name: 'USB Debugging (ADB)',
          status: 'neutral',
          statusLabel: 'Pending Scan',
          lastChecked: 'Not checked',
        },
      ];

  if (showFullReport) {
    if (!fullReport) {
      return (
        <ScreenContainer>
          <ScreenHeader title="Security Report" subtitle="Complete inspection details" />
          <Card variant="elevated" padding="lg" style={styles.emptyReportCard}>
            <Text style={styles.emptyTitle}>No Scan Report Available</Text>
            <Text style={styles.emptySubtitle}>
              Based on the checks available to Sentinel, an inspection must be completed before a
              security report can be generated.
            </Text>
            <PrimaryButton
              title="Run Device Scan Now"
              onPress={() => {
                setShowFullReport(false);
                router.push('/(tabs)/scan');
              }}
              icon="scan"
              size="md"
              style={{ marginTop: spacing.md }}
            />
            <SecondaryButton
              title="Back to Overview"
              onPress={() => setShowFullReport(false)}
              size="md"
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </ScreenContainer>
      );
    }

    return (
      <ScreenContainer>
        <FullReportView report={fullReport} onBack={() => setShowFullReport(false)} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Brand Header */}
      <ScreenHeader
        title="SENTINEL"
        subtitle="Personal Cybersecurity Intelligence"
        isBrand
        rightIcon="bell"
        rightBadgeCount={findingsSummary.critical + findingsSummary.high}
        onRightPress={() => {}}
      />

      {/* Main Grid / Stack Layout based on responsiveness */}
      <View style={isDesktop ? styles.desktopGrid : styles.mobileStack}>
        {/* Left Column on Desktop / Top Section on Mobile */}
        <View style={isDesktop ? styles.desktopLeftCol : styles.fullWidth}>
          {/* Security Score Gauge */}
          <ScoreGauge scoreData={scoreData} findingsSummary={findingsSummary} />

          {/* Quick Scan CTA Button */}
          <PrimaryButton
            title="Scan Device Now"
            onPress={() => router.push('/(tabs)/scan')}
            icon="scan"
            size="lg"
            style={styles.scanBtn}
          />

          {/* Security Categories */}
          <SectionHeader
            title="Security Categories"
            actionText="View All"
            onAction={() => router.push('/(tabs)/protect')}
          />
          <View style={isTablet || isDesktop ? styles.categoryGrid : styles.categoryList}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                variant={isTablet || isDesktop ? 'grid' : 'row'}
                onPress={() => {
                  router.push('/(tabs)/protect');
                }}
              />
            ))}
          </View>
        </View>

        {/* Right Column on Desktop / Bottom Section on Mobile */}
        <View style={isDesktop ? styles.desktopRightCol : styles.fullWidth}>
          {/* Top Recommendation */}
          <SectionHeader title="Top Recommendation" />
          <RecommendationCard
            recommendation={recommendations[0]!}
            onAction={() => router.push('/(tabs)/protect')}
            onViewAll={() => router.push('/(tabs)/protect')}
          />

          {/* System Control Status */}
          <SectionHeader title="System Status" />
          <Card variant="outlined" padding="md" style={styles.systemCard}>
            {systemControls.slice(0, 4).map((ctrl) => (
              <SystemStatusRow key={ctrl.id} control={ctrl} />
            ))}
          </Card>

          {/* Recent Security Activity */}
          <SectionHeader title="Recent Activity" actionText="Timeline" onAction={() => {}} />
          <Card variant="outlined" padding="md" style={styles.activityCard}>
            {activity.map((item, idx) => (
              <ActivityItem key={item.id} activity={item} isLast={idx === activity.length - 1} />
            ))}
          </Card>

          {/* Full Report Link CTA */}
          <PrimaryButton
            title="View Full Security Report"
            onPress={() => setShowFullReport(true)}
            variant="outline"
            size="md"
            icon="file-text"
            style={styles.fullReportBtn}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mobileStack: {
    gap: spacing.sm,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: spacing.xxl,
    alignItems: 'flex-start',
  },
  desktopLeftCol: {
    flex: 1.1,
  },
  desktopRightCol: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  scanBtn: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  categoryList: {
    marginBottom: spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  systemCard: {
    marginBottom: spacing.lg,
  },
  activityCard: {
    marginBottom: spacing.lg,
  },
  fullReportBtn: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  emptyReportCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
    maxWidth: 320,
  },
});
