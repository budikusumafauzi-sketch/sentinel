import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, severityColors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import type { ActivityItem as ActivityItemType } from '../../types/security';

interface ActivityItemProps {
  activity: ActivityItemType;
  isLast?: boolean;
  style?: ViewStyle;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isLast = false, style }) => {
  const getDotColor = (): string => {
    if (activity.severity) return severityColors[activity.severity].dark;
    if (activity.type === 'scan') return colors.secure;
    if (activity.type === 'app') return colors.warning;
    return colors.primary;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Time & Timeline Line */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{activity.time}</Text>
      </View>

      <View style={styles.timelineColumn}>
        <View style={[styles.dot, { backgroundColor: getDotColor() }]} />
        {!isLast && <View style={styles.verticalLine} />}
      </View>

      {/* Content */}
      <View style={[styles.contentColumn, !isLast && styles.contentBorder]}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.description}>{activity.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timeColumn: {
    width: 52,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  timeText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  timelineColumn: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  verticalLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.md,
  },
  contentBorder: {
    // border or padding
  },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  description: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
