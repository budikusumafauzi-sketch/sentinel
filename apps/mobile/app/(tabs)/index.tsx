import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '../../src/design-system/spacing';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { ScoreGauge } from '../../src/components/security/ScoreGauge';
import { PrimaryButton } from '../../src/components/common/Button';
import { CategoryCard } from '../../src/components/security/CategoryCard';
import { RecommendationCard } from '../../src/components/security/RecommendationCard';
import { ActivityItem } from '../../src/components/security/ActivityItem';
import { SystemStatusRow } from '../../src/components/security/SystemStatusRow';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { Card } from '../../src/components/common/Card';
import { FullReportView } from '../../src/components/security/FullReportView';
import { useResponsive } from '../../src/hooks/useResponsive';
import {
  mockSecurityScore,
  mockFindingsSummary,
  mockCategories,
  mockRecommendations,
  mockActivity,
  mockSystemControls,
  mockFullReport,
} from '../../src/mock/securityData';

export default function OverviewScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const [showFullReport, setShowFullReport] = useState(false);

  if (showFullReport) {
    return (
      <ScreenContainer>
        <FullReportView report={mockFullReport} onBack={() => setShowFullReport(false)} />
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
        rightBadgeCount={1}
        onRightPress={() => {}}
      />

      {/* Main Grid / Stack Layout based on responsiveness */}
      <View style={isDesktop ? styles.desktopGrid : styles.mobileStack}>
        {/* Left Column on Desktop / Top Section on Mobile */}
        <View style={isDesktop ? styles.desktopLeftCol : styles.fullWidth}>
          {/* Security Score Gauge */}
          <ScoreGauge scoreData={mockSecurityScore} findingsSummary={mockFindingsSummary} />

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
            {mockCategories.map((cat) => (
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
            recommendation={mockRecommendations[0]!}
            onAction={() => router.push('/(tabs)/protect')}
            onViewAll={() => router.push('/(tabs)/protect')}
          />

          {/* System Control Status */}
          <SectionHeader title="System Status" />
          <Card variant="outlined" padding="md" style={styles.systemCard}>
            {mockSystemControls.slice(0, 4).map((ctrl) => (
              <SystemStatusRow key={ctrl.id} control={ctrl} />
            ))}
          </Card>

          {/* Recent Security Activity */}
          <SectionHeader title="Recent Activity" actionText="Timeline" onAction={() => {}} />
          <Card variant="outlined" padding="md" style={styles.activityCard}>
            {mockActivity.map((item, idx) => (
              <ActivityItem
                key={item.id}
                activity={item}
                isLast={idx === mockActivity.length - 1}
              />
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
    gap: spacing.sm,
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
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
});
