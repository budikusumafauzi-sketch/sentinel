import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon, type IconName } from '../common/Icon';
import type { NavTab } from '../../types/ui';

interface NavItem {
  id: NavTab;
  label: string;
  icon: IconName;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'scan', label: 'Scan', icon: 'scan' },
  { id: 'protect', label: 'Protect', icon: 'protect' },
  { id: 'intelligence', label: 'Intelligence', icon: 'insights' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
];

interface SidebarNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  style?: ViewStyle;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onSelectTab, style }) => {
  return (
    <View style={[styles.sidebar, style]}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Icon name="shield-check" size={24} color={colors.primary} />
        </View>
        <View style={styles.brandTextWrapper}>
          <Text style={styles.brandTitle}>SENTINEL</Text>
          <Text style={styles.brandSubtitle}>Personal Cyber Intelligence</Text>
        </View>
      </View>

      {/* Navigation Items */}
      <View style={styles.navList}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onSelectTab(item.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Navigate to ${item.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Icon
                name={item.icon}
                size={20}
                color={isActive ? colors.textInverse : colors.textSecondary}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer System Status */}
      <View style={styles.footerContainer}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Sentinel Active</Text>
        </View>
        <Text style={styles.versionText}>v0.1.0 · Foundation</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xxl,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  brandTextWrapper: {
    flex: 1,
  },
  brandTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    marginTop: 2,
  },
  navList: {
    flex: 1,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  navItemActive: {
    backgroundColor: colors.primary,
  },
  navLabel: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.textInverse,
    fontWeight: fontWeights.semibold,
  },
  footerContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secure,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.secureDark,
  },
  versionText: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    marginTop: 4,
  },
});
