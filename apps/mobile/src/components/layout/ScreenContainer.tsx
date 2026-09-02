import React from 'react';
import { ScrollView, View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { useResponsive } from '../../hooks/useResponsive';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
}) => {
  const { isWide, containerMaxWidth } = useResponsive();

  const containerInner = (
    <View
      style={[
        styles.innerContainer,
        isWide && { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.container, style]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {containerInner}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{containerInner}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl + spacing.lg,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
