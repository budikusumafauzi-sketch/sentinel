import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Icon, type IconName } from '../common/Icon';
import { StatusBadge } from '../common/Badge';
import type { SystemControlStatus } from '../../types/security';

interface SystemStatusRowProps {
  control: SystemControlStatus;
  style?: ViewStyle;
}

export const SystemStatusRow: React.FC<SystemStatusRowProps> = ({ control, style }) => {
  const getIconName = (id: string): IconName => {
    switch (id) {
      case 'os':
        return 'system';
      case 'encryption':
        return 'lock';
      case 'firewall':
        return 'shield-check';
      case 'lock':
        return 'lock';
      case 'bootloader':
        return 'shield';
      case 'backup':
        return 'folder';
      default:
        return 'shield';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <View style={styles.iconCircle}>
          <Icon name={getIconName(control.id)} size={16} color={colors.primary} />
        </View>
        <Text style={styles.name}>{control.name}</Text>
      </View>

      <View style={styles.right}>
        <StatusBadge status={control.status} label={control.statusLabel} size="sm" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
