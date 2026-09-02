import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { fontSizes, fontWeights } from '../../src/design-system/typography';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Card } from '../../src/components/common/Card';
import { StatusBadge } from '../../src/components/common/Badge';
import { Icon, type IconName } from '../../src/components/common/Icon';
import { FindingCard } from '../../src/components/security/FindingCard';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import {
  mockCategories,
  mockApplications,
  mockFindings,
  mockSystemControls,
} from '../../src/mock/securityData';

type CategoryTabId =
  'all' | 'device' | 'applications' | 'accounts' | 'privacy' | 'network' | 'system';

export default function ProtectScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryTabId>('applications');
  const [appFilter, setAppFilter] = useState<'all' | 'secure' | 'review' | 'risk'>('all');

  const filteredApps = mockApplications.filter((app) => {
    if (appFilter === 'secure') return app.status === 'secure';
    if (appFilter === 'review') return app.status === 'attention';
    if (appFilter === 'risk') return app.status === 'risk';
    return true;
  });

  const categoryFindings = mockFindings.filter((f) => {
    if (activeCategory === 'all') return true;
    return f.category.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Security Protection"
        subtitle="Manage controls and inspection boundaries"
      />

      {/* Horizontal Category Switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[styles.catPill, activeCategory === 'all' && styles.catPillActive]}
          onPress={() => setActiveCategory('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.catPillText, activeCategory === 'all' && styles.catPillTextActive]}>
            All Categories
          </Text>
        </TouchableOpacity>

        {mockCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, isActive && styles.catPillActive]}
              onPress={() => setActiveCategory(cat.id as CategoryTabId)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                {cat.name} ({cat.score})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Applications Specific View (Matching Design Reference) */}
      {activeCategory === 'applications' && (
        <View style={styles.sectionWrapper}>
          {/* App Status Filters */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, appFilter === 'all' && styles.filterChipActive]}
              onPress={() => setAppFilter('all')}
            >
              <Text
                style={[styles.filterChipText, appFilter === 'all' && styles.filterChipTextActive]}
              >
                All (147)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, appFilter === 'secure' && styles.filterChipActive]}
              onPress={() => setAppFilter('secure')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  appFilter === 'secure' && styles.filterChipTextActive,
                ]}
              >
                Secure (132)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, appFilter === 'review' && styles.filterChipActive]}
              onPress={() => setAppFilter('review')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  appFilter === 'review' && styles.filterChipTextActive,
                ]}
              >
                Review (11)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, appFilter === 'risk' && styles.filterChipActive]}
              onPress={() => setAppFilter('risk')}
            >
              <Text
                style={[styles.filterChipText, appFilter === 'risk' && styles.filterChipTextActive]}
              >
                High Risk (4)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Applications List */}
          <SectionHeader title="Installed Applications" />
          {filteredApps.map((app) => (
            <Card key={app.id} variant="outlined" padding="md" style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={styles.appLeft}>
                  <View style={styles.appIconCircle}>
                    <Icon name={app.iconName as IconName} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appDesc}>{app.description}</Text>
                  </View>
                </View>
                <StatusBadge status={app.status} label={app.statusLabel} size="sm" />
              </View>
              {app.riskNote && (
                <View style={styles.appRiskBanner}>
                  <Text style={styles.appRiskText}>⚠️ {app.riskNote}</Text>
                </View>
              )}
            </Card>
          ))}
        </View>
      )}

      {/* System Category Specific View */}
      {activeCategory === 'system' && (
        <View style={styles.sectionWrapper}>
          <SectionHeader title="Operating System & Kernel Safeguards" />
          <Card variant="outlined" padding="md" style={styles.controlsCard}>
            {mockSystemControls.map((ctrl) => (
              <View key={ctrl.id} style={styles.controlRow}>
                <View style={styles.ctrlLeft}>
                  <Text style={styles.ctrlName}>{ctrl.name}</Text>
                  <Text style={styles.ctrlChecked}>Last validated: {ctrl.lastChecked}</Text>
                </View>
                <StatusBadge status={ctrl.status} label={ctrl.statusLabel} size="sm" />
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Other Categories or All: Display Category Findings */}
      <View style={styles.sectionWrapper}>
        <SectionHeader
          title={
            activeCategory === 'all'
              ? 'Active Security Findings (All Categories)'
              : `${activeCategory.toUpperCase()} Security Findings`
          }
        />
        {categoryFindings.length > 0 ? (
          categoryFindings.map((finding) => <FindingCard key={finding.id} finding={finding} />)
        ) : (
          <Card variant="outlined" padding="lg" style={styles.allClearCard}>
            <Icon name="check" size={24} color={colors.secureDark} />
            <Text style={styles.allClearTitle}>No Active Findings in this Category</Text>
            <Text style={styles.allClearSub}>
              All evaluated baseline checks passed without detected anomalies.
            </Text>
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  categoryScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  catPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  sectionWrapper: {
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primaryDark,
    fontWeight: fontWeights.bold,
  },
  appCard: {
    marginBottom: spacing.sm,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  appIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  appDesc: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  appRiskBanner: {
    marginTop: spacing.sm,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.warningBg,
  },
  appRiskText: {
    fontSize: fontSizes.xs,
    color: colors.warningDark,
    fontWeight: fontWeights.medium,
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
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  allClearTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.secureDark,
    marginTop: spacing.xs,
  },
  allClearSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
