import React from 'react';
import { Tabs } from 'expo-router';
import { colors } from '../../src/design-system/colors';
import { fontSizes, fontWeights } from '../../src/design-system/typography';
import { Icon } from '../../src/components/common/Icon';
import { useResponsive } from '../../src/hooks/useResponsive';

export default function TabLayout() {
  const { isDesktop } = useResponsive();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          display: isDesktop ? 'none' : 'flex', // Hidden on desktop since sidebar navigation is used
        },
        tabBarLabelStyle: {
          fontSize: fontSizes.xs - 1,
          fontWeight: fontWeights.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => <Icon name="scan" size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="protect"
        options={{
          title: 'Protect',
          tabBarIcon: ({ color, size }) => <Icon name="protect" size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="intelligence"
        options={{
          title: 'Intelligence',
          tabBarIcon: ({ color, size }) => <Icon name="insights" size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon name="profile" size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
