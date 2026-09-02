import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { colors } from '../../design-system/colors';

export type IconName =
  | 'shield'
  | 'shield-check'
  | 'shield-alert'
  | 'scan'
  | 'radar'
  | 'home'
  | 'protect'
  | 'insights'
  | 'profile'
  | 'device'
  | 'apps'
  | 'accounts'
  | 'privacy'
  | 'network'
  | 'system'
  | 'check'
  | 'alert-circle'
  | 'alert-triangle'
  | 'x-circle'
  | 'arrow-right'
  | 'chevron-right'
  | 'chevron-left'
  | 'refresh'
  | 'bell'
  | 'lock'
  | 'eye'
  | 'clock'
  | 'file-text'
  | 'info'
  | 'search'
  | 'sparkles'
  | 'chevron-down'
  | 'globe'
  | 'smartphone'
  | 'laptop'
  | 'tablet'
  | 'settings'
  | 'instagram'
  | 'whatsapp'
  | 'camera'
  | 'folder'
  | 'example'
  | 'unknown';

interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
}

const glyphMap: Record<string, string> = {
  home: '⌂',
  scan: '⌕',
  radar: '◎',
  protect: '🛡',
  insights: '📊',
  profile: '👤',
  device: '💻',
  apps: '⊞',
  accounts: '👤',
  privacy: '👁',
  network: '📶',
  system: '⚙',
  check: '✓',
  'shield-check': '🛡',
  'shield-alert': '⚠️',
  'alert-circle': '!',
  'alert-triangle': '▲',
  'x-circle': '✕',
  'arrow-right': '→',
  'chevron-right': '›',
  'chevron-left': '‹',
  'chevron-down': '˅',
  refresh: '↻',
  bell: '🔔',
  lock: '🔒',
  eye: '👁',
  clock: '⏱',
  'file-text': '📄',
  info: 'ℹ',
  search: '🔍',
  sparkles: '✦',
  globe: '🌐',
  smartphone: '📱',
  laptop: '💻',
  tablet: '📱',
  settings: '⚙',
  instagram: '📷',
  whatsapp: '💬',
  camera: '📷',
  folder: '📁',
  example: '📦',
  unknown: '⚠️',
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = colors.textPrimary,
  style,
}) => {
  const glyph = glyphMap[name] || '•';

  return (
    <View
      style={[styles.container, { width: size, height: size }, style as ViewStyle]}
      accessibilityRole="image"
      accessibilityLabel={`Icon ${name}`}
    >
      <Text
        style={[
          styles.glyph,
          {
            fontSize: size * 0.85,
            color,
            lineHeight: size,
          },
        ]}
      >
        {glyph}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
