import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon } from '../common/Icon';

export type ScanType = 'quick' | 'full';

interface ScanTypeSelectorProps {
  selectedType: ScanType;
  onSelect: (type: ScanType) => void;
  style?: ViewStyle;
}

export const ScanTypeSelector: React.FC<ScanTypeSelectorProps> = ({
  selectedType,
  onSelect,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Quick Scan Card */}
      <TouchableOpacity
        style={[styles.optionCard, selectedType === 'quick' && styles.optionCardSelected]}
        onPress={() => onSelect('quick')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Select Quick Scan: ~5 seconds, 48 checks"
      >
        <View style={styles.optionHeader}>
          <View style={[styles.iconCircle, selectedType === 'quick' && styles.iconCircleSelected]}>
            <Icon
              name="radar"
              size={22}
              color={selectedType === 'quick' ? colors.primary : colors.textSecondary}
            />
          </View>
          <View style={[styles.radioDot, selectedType === 'quick' && styles.radioDotSelected]}>
            {selectedType === 'quick' && <View style={styles.radioDotInner} />}
          </View>
        </View>

        <Text style={styles.optionTitle}>Quick Scan</Text>
        <Text style={styles.optionDescription}>
          Evaluates critical OS settings, active network security, and key app permissions.
        </Text>

        <View style={styles.optionMeta}>
          <Text style={styles.metaBadge}>~ 5 sec</Text>
          <Text style={styles.metaChecks}>48 key checks</Text>
        </View>
      </TouchableOpacity>

      {/* Full Scan Card */}
      <TouchableOpacity
        style={[styles.optionCard, selectedType === 'full' && styles.optionCardSelected]}
        onPress={() => onSelect('full')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Select Full Comprehensive Scan: ~15 seconds, 147 checks"
      >
        <View style={styles.optionHeader}>
          <View style={[styles.iconCircle, selectedType === 'full' && styles.iconCircleSelected]}>
            <Icon
              name="shield-check"
              size={22}
              color={selectedType === 'full' ? colors.primary : colors.textSecondary}
            />
          </View>
          <View style={[styles.radioDot, selectedType === 'full' && styles.radioDotSelected]}>
            {selectedType === 'full' && <View style={styles.radioDotInner} />}
          </View>
        </View>

        <Text style={styles.optionTitle}>Full Deep Scan</Text>
        <Text style={styles.optionDescription}>
          Comprehensive assessment across all 6 categories, app signatures, and threat baselines.
        </Text>

        <View style={styles.optionMeta}>
          <Text style={styles.metaBadge}>~ 15 sec</Text>
          <Text style={styles.metaChecks}>147 full checks</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAFCFF',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: colors.primaryLight,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotSelected: {
    borderColor: colors.primary,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  optionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaBadge: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  metaChecks: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
});
