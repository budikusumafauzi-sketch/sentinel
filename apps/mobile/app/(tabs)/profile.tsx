import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { fontSizes, fontWeights } from '../../src/design-system/typography';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Card } from '../../src/components/common/Card';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { Icon, type IconName } from '../../src/components/common/Icon';
import { mockDevices } from '../../src/mock/securityData';

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Profile & Devices" subtitle="Connected hardware and client settings" />

      {/* User Info Card */}
      <Card variant="outlined" padding="lg" style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarInitial}>F</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Fauzi Budikusuma</Text>
          <Text style={styles.userEmail}>fauzi@example.com</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>Sentinel Client Active</Text>
          </View>
        </View>
      </Card>

      {/* Connected Devices (PRD Section 44) */}
      <SectionHeader title="Connected Devices" />
      <View style={styles.devicesList}>
        {mockDevices.map((dev) => (
          <Card key={dev.id} variant="outlined" padding="md" style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <View style={styles.deviceIconCircle}>
                <Icon
                  name={dev.platform === 'Windows' ? 'laptop' : 'smartphone'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.deviceDetails}>
                <View style={styles.deviceNameRow}>
                  <Text style={styles.deviceName}>{dev.name}</Text>
                  {dev.isCurrentDevice && (
                    <View style={styles.thisDeviceBadge}>
                      <Text style={styles.thisDeviceText}>This Device</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.deviceMeta}>
                  {dev.model} · Last seen: {dev.lastSeen}
                </Text>
              </View>
              <View style={styles.deviceScorePill}>
                <Text style={styles.deviceScoreText}>{dev.score}/100</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* Client Settings Rows */}
      <SectionHeader title="Security Preferences" />
      <Card variant="outlined" padding="none" style={styles.settingsCard}>
        <SettingRow
          icon="bell"
          title="Security Notifications"
          subtitle="Real-time alerts for critical findings"
        />
        <SettingRow
          icon="privacy"
          title="Privacy & Data Boundaries"
          subtitle="Local-only storage preferences"
        />
        <SettingRow icon="globe" title="Language" subtitle="English (US)" />
        <SettingRow icon="eye" title="Theme" subtitle="Light Mode (Standard)" isLast />
      </Card>

      {/* About Sentinel */}
      <SectionHeader title="About Sentinel" />
      <Card variant="outlined" padding="md" style={styles.aboutCard}>
        <View style={styles.aboutRow}>
          <Icon name="shield-check" size={20} color={colors.primary} />
          <View style={styles.aboutInfo}>
            <Text style={styles.aboutTitle}>Sentinel Personal Cyber Intelligence</Text>
            <Text style={styles.aboutMeta}>Version 1.0.0 (Phase 2 UI Foundation)</Text>
          </View>
        </View>
        <Text style={styles.aboutDesc}>
          Automatic-first device security posture assessment with verified evidence and transparent
          platform boundaries.
        </Text>
      </Card>
    </ScreenContainer>
  );
}

interface SettingRowProps {
  icon: IconName;
  title: string;
  subtitle: string;
  isLast?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, title, subtitle, isLast = false }) => (
  <TouchableOpacity
    style={[styles.settingRow, !isLast && styles.settingRowBorder]}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${subtitle}`}
  >
    <View style={styles.settingLeft}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Icon name="chevron-right" size={18} color={colors.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
  },
  userAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitial: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.heavy,
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: fontSizes.xs + 1,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secureBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  planBadgeText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.semibold,
    color: colors.secureDark,
  },
  devicesList: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  deviceCard: {
    marginBottom: spacing.xs,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  thisDeviceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  thisDeviceText: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
  },
  deviceMeta: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  deviceScorePill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  deviceScoreText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  settingsCard: {
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  aboutCard: {
    marginBottom: spacing.xxl,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  aboutInfo: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  aboutMeta: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  aboutDesc: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
