import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

interface LoadingStateProps {
  title?: string;
  description?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Assessing Security State...',
  description = 'Collecting authorized system signals and evaluating baselines.',
  style,
}) => {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={title}
    >
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {/* Skeleton Mock Cards */}
      <View style={styles.skeletonContainer}>
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCardSmall} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  spinnerWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  skeletonContainer: {
    width: '100%',
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  skeletonLineShort: {
    width: '40%',
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  skeletonCard: {
    width: '100%',
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  skeletonCardSmall: {
    width: '100%',
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
});
