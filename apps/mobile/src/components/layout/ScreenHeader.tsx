import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { Icon, type IconName } from '../common/Icon';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightBadgeCount?: number;
  isBrand?: boolean;
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightBadgeCount,
  isBrand = false,
  style,
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="chevron-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleWrapper}>
          <Text style={[styles.title, isBrand && styles.brandTitle]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {rightIcon && onRightPress && (
        <TouchableOpacity
          onPress={onRightPress}
          style={styles.rightButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Action ${rightIcon}`}
        >
          <Icon name={rightIcon} size={22} color={colors.textPrimary} />
          {rightBadgeCount !== undefined && rightBadgeCount > 0 && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.heavy,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
});
