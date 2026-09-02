import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon } from '../common/Icon';
import { Card } from '../common/Card';
import type { ScanProgress } from '../../types/security';

interface ScanProgressViewProps {
  scanProgress: ScanProgress;
  onCancel?: () => void;
  style?: ViewStyle;
}

export const ScanProgressView: React.FC<ScanProgressViewProps> = ({
  scanProgress,
  onCancel,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Title */}
      <Text style={styles.headerTitle}>Scanning Your Device...</Text>
      <Text style={styles.headerSubtitle}>
        Collecting signals across {scanProgress.totalChecks} security checkpoints
      </Text>

      {/* Progress Ring Representation */}
      <View style={styles.gaugeWrapper}>
        <View style={styles.outerRing}>
          <View style={styles.innerRing}>
            <Text style={styles.progressPercent}>{scanProgress.progress}%</Text>
            <Text style={styles.currentStageText} numberOfLines={1}>
              {scanProgress.currentStage}
            </Text>
          </View>
        </View>
      </View>

      {/* Stages List */}
      <Card variant="outlined" padding="md" style={styles.stagesCard}>
        {scanProgress.stages.map((stage, idx) => {
          const isCompleted = stage.status === 'completed';
          const isInProgress = stage.status === 'in_progress';

          return (
            <View
              key={stage.id}
              style={[
                styles.stageRow,
                idx === scanProgress.stages.length - 1 && styles.stageRowLast,
              ]}
            >
              <View style={styles.stageLeft}>
                <View
                  style={[
                    styles.stageIconCircle,
                    isCompleted && styles.iconCircleCompleted,
                    isInProgress && styles.iconCircleProgress,
                  ]}
                >
                  {isCompleted ? (
                    <Icon name="check" size={12} color={colors.secureDark} />
                  ) : isInProgress ? (
                    <View style={styles.inProgressDot} />
                  ) : (
                    <View style={styles.pendingDot} />
                  )}
                </View>
                <Text
                  style={[
                    styles.stageName,
                    isCompleted && styles.stageNameCompleted,
                    isInProgress && styles.stageNameActive,
                  ]}
                >
                  {stage.name}
                </Text>
              </View>

              <Text
                style={[
                  styles.stageStatusText,
                  isCompleted && styles.statusCompleted,
                  isInProgress && styles.statusProgress,
                ]}
              >
                {isCompleted ? 'Completed' : isInProgress ? 'Scanning...' : 'Pending'}
              </Text>
            </View>
          );
        })}
      </Card>

      {/* Cancel Scan Button */}
      {onCancel && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancel security scan"
        >
          <Text style={styles.cancelBtnText}>Cancel Scan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  innerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  progressPercent: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    lineHeight: 52,
  },
  currentStageText: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
    textAlign: 'center',
  },
  stagesCard: {
    width: '100%',
    marginTop: spacing.xl,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  stageRowLast: {
    borderBottomWidth: 0,
  },
  stageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stageIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconCircleCompleted: {
    backgroundColor: colors.secureBg,
  },
  iconCircleProgress: {
    backgroundColor: colors.primaryLight,
  },
  inProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  stageName: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  stageNameCompleted: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  stageNameActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  stageStatusText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  statusCompleted: {
    color: colors.secureDark,
    fontWeight: fontWeights.semibold,
  },
  statusProgress: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  cancelBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
});
