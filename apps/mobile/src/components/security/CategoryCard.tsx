import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon, type IconName } from '../common/Icon';
import type { SecurityCategory } from '../../types/security';

interface CategoryCardProps {
  category: SecurityCategory;
  onPress?: (category: SecurityCategory) => void;
  variant?: 'row' | 'grid';
  style?: ViewStyle;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onPress,
  variant = 'row',
  style,
}) => {
  const getIconName = (id: string): IconName => {
    switch (id) {
      case 'device':
        return 'device';
      case 'applications':
        return 'apps';
      case 'accounts':
        return 'accounts';
      case 'privacy':
        return 'privacy';
      case 'network':
        return 'network';
      case 'system':
        return 'system';
      default:
        return 'shield-check';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return colors.secureDark;
    if (score >= 70) return colors.warningDark;
    return colors.dangerDark;
  };

  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.gridCard, style]}
        onPress={() => onPress && onPress(category)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${category.name}: Score ${category.score} out of 100`}
      >
        <View style={styles.gridHeader}>
          <View style={styles.iconWrapper}>
            <Icon name={getIconName(category.id)} size={20} color={colors.primary} />
          </View>
          <Text style={[styles.gridScore, { color: getScoreColor(category.score) }]}>
            {category.score}/100
          </Text>
        </View>

        <Text style={styles.gridTitle}>{category.name}</Text>
        <Text style={styles.gridSub}>{category.checksCount} checks evaluated</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.rowContainer, style]}
      onPress={() => onPress && onPress(category)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}: Score ${category.score} out of 100`}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconWrapper}>
          <Icon name={getIconName(category.id)} size={20} color={colors.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{category.name}</Text>
          <Text style={styles.rowChecks}>{category.checksCount} checks</Text>
        </View>
      </View>

      <View style={styles.rowRight}>
        <Text style={[styles.rowScore, { color: getScoreColor(category.score) }]}>
          {category.score}/100
        </Text>
        <Icon name="chevron-right" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  rowChecks: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowScore: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flex: 1,
    minWidth: 140,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  gridTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  gridScore: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  gridSub: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    marginTop: 2,
  },
});
