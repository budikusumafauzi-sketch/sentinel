import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { PrimaryButton } from '../common/Button';
import { Card } from '../common/Card';

export type AnalyzerTab = 'message' | 'url' | 'screenshot';

interface AnalyzerInputProps {
  activeTab: AnalyzerTab;
  onTabChange: (tab: AnalyzerTab) => void;
  inputText: string;
  onInputChange: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
  style?: ViewStyle;
}

export const AnalyzerInput: React.FC<AnalyzerInputProps> = ({
  activeTab,
  onTabChange,
  inputText,
  onInputChange,
  onAnalyze,
  isAnalyzing = false,
  style,
}) => {
  const getPlaceholder = (): string => {
    switch (activeTab) {
      case 'url':
        return 'Enter suspicious URL or domain (e.g. http://secure-login-update.com)...';
      case 'screenshot':
        return 'Upload or paste an image link containing suspicious prompts, emails, or messages...';
      case 'message':
      default:
        return 'Paste SMS, email text, or chat message here to analyze security risks...';
    }
  };

  return (
    <Card variant="outlined" padding="lg" style={[styles.card, style]}>
      {/* Tab Selectors */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'message' && styles.tabActive]}
          onPress={() => onTabChange('message')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'message' }}
        >
          <Text style={[styles.tabText, activeTab === 'message' && styles.tabTextActive]}>
            Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'url' && styles.tabActive]}
          onPress={() => onTabChange('url')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'url' }}
        >
          <Text style={[styles.tabText, activeTab === 'url' && styles.tabTextActive]}>
            URL / Link
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'screenshot' && styles.tabActive]}
          onPress={() => onTabChange('screenshot')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'screenshot' }}
        >
          <Text style={[styles.tabText, activeTab === 'screenshot' && styles.tabTextActive]}>
            Screenshot
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Area */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={inputText}
          onChangeText={onInputChange}
          placeholder={getPlaceholder()}
          placeholderTextColor={colors.textMuted}
          maxLength={2000}
        />
        <Text style={styles.charCount}>{inputText.length}/2000</Text>
      </View>

      {/* Action Button */}
      <PrimaryButton
        title={isAnalyzing ? 'Analyzing Digital Signals...' : 'Analyze Now'}
        onPress={onAnalyze}
        loading={isAnalyzing}
        disabled={isAnalyzing || !inputText.trim()}
        icon="scan"
        size="md"
        style={styles.actionBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: 3,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  tabText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  inputWrapper: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  textInput: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  actionBtn: {
    width: '100%',
  },
});
