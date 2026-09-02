import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon, type IconName } from './Icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];

    if (size === 'sm') list.push(styles.sizeSm);
    else if (size === 'lg') list.push(styles.sizeLg);
    else list.push(styles.sizeMd);

    if (variant === 'primary') list.push(styles.primaryBg);
    else if (variant === 'secondary') list.push(styles.secondaryBg);
    else if (variant === 'outline') list.push(styles.outlineBg);
    else if (variant === 'danger') list.push(styles.dangerBg);

    if (disabled || loading) list.push(styles.disabled);
    if (style) list.push(style);

    return list;
  };

  const getTextColor = (): string => {
    if (variant === 'outline') return colors.primary;
    if (variant === 'secondary') return colors.textPrimary;
    return colors.textInverse;
  };

  const textColor = getTextColor();
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon
              name={icon}
              size={iconSize}
              color={textColor}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text
            style={[
              styles.textBase,
              { color: textColor },
              size === 'sm' && styles.textSm,
              size === 'lg' && styles.textLg,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon
              name={icon}
              size={iconSize}
              color={textColor}
              style={{ marginLeft: spacing.sm }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = (props) => (
  <PrimaryButton {...props} variant="secondary" />
);

export const OutlineButton: React.FC<ButtonProps> = (props) => (
  <PrimaryButton {...props} variant="outline" />
);

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  accessibilityLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 40,
  iconSize = 20,
  color = colors.textPrimary,
  backgroundColor = 'transparent',
  style,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    style={[
      styles.iconBtn,
      {
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor,
      },
      style,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <Icon name={icon} size={iconSize} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  sizeSm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  sizeMd: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  sizeLg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  primaryBg: {
    backgroundColor: colors.primary,
  },
  secondaryBg: {
    backgroundColor: colors.surfaceMuted,
  },
  outlineBg: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerBg: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  textSm: {
    fontSize: fontSizes.sm,
  },
  textLg: {
    fontSize: fontSizes.lg,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
