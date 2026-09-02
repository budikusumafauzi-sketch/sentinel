import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon } from '../common/Icon';
import { PrimaryButton } from '../common/Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Verify Security State',
  description = 'Sentinel could not read the necessary system signals. Operating system permissions or background restrictions may be limiting verification.',
  onRetry,
  retryLabel = 'Retry Verification',
  style,
}) => {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${description}`}
    >
      <View style={styles.iconWrapper}>
        <Icon name="alert-triangle" size={32} color={colors.warningDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.transparencyBox}>
        <Text style={styles.transparencyText}>
          Sentinel never fabricates security metrics when data is unavailable.
        </Text>
      </View>
      {onRetry && (
        <PrimaryButton
          title={retryLabel}
          onPress={onRetry}
          variant="outline"
          size="md"
          icon="refresh"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.xxl,
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  transparencyBox: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transparencyText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionBtn: {
    marginTop: spacing.lg,
  },
});
