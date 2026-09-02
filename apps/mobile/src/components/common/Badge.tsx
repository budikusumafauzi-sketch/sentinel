import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { severityColors, statusColors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import type { SeverityLevel, StatusType } from '../../types/ui';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  label?: string;
  count?: number;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  label,
  count,
  size = 'md',
  style,
}) => {
  const theme = severityColors[severity];
  const displayLabel = label || severity.toUpperCase();

  return (
    <View
      style={[
        styles.badgeBase,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
        },
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Severity: ${displayLabel} ${count !== undefined ? count : ''}`}
    >
      <View
        style={[
          styles.indicatorDot,
          { backgroundColor: theme.dark },
          size === 'sm' ? styles.dotSm : styles.dotMd,
        ]}
      />
      <Text
        style={[
          styles.badgeText,
          { color: theme.text },
          size === 'sm' ? styles.textSm : styles.textMd,
        ]}
      >
        {displayLabel}
        {count !== undefined ? ` ${count}` : ''}
      </Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  style,
  textStyle,
}) => {
  const theme = statusColors[status] || statusColors.pending;
  const displayLabel = label || status.toUpperCase();

  return (
    <View
      style={[
        styles.badgeBase,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
        },
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${displayLabel}`}
    >
      <Text
        style={[
          styles.badgeText,
          { color: theme.text },
          size === 'sm' ? styles.textSm : styles.textMd,
          textStyle,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  badgeMd: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  indicatorDot: {
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  dotSm: {
    width: 5,
    height: 5,
  },
  dotMd: {
    width: 7,
    height: 7,
  },
  badgeText: {
    fontWeight: fontWeights.semibold,
  },
  textSm: {
    fontSize: fontSizes.xs - 1,
  },
  textMd: {
    fontSize: fontSizes.xs,
  },
});
