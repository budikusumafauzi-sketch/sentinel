import React from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { shadows } from '../../design-system/shadows';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat' | 'muted';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'outlined',
  padding = 'lg',
  accessibilityLabel,
}) => {
  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing.sm };
      case 'md':
        return { padding: spacing.md };
      case 'xl':
        return { padding: spacing.xl };
      case 'lg':
      default:
        return { padding: spacing.lg };
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderMuted,
          ...shadows.sm,
        };
      case 'flat':
        return {
          backgroundColor: colors.surface,
          borderWidth: 0,
        };
      case 'muted':
        return {
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outlined':
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
    }
  };

  const combinedStyles = [styles.card, getVariantStyle(), getPaddingStyle(), style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={combinedStyles}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={combinedStyles}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});
