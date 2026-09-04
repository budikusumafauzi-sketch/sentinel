import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/design-system/colors';
import { SidebarNav } from '../src/components/layout/SidebarNav';
import { useResponsive } from '../src/hooks/useResponsive';
import { AuthProvider } from '../src/hooks/useAuth';
import type { NavTab } from '../src/types/ui';

export default function RootLayout() {
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const pathname = usePathname();

  // Determine current active tab for desktop sidebar
  let activeTab: NavTab = 'overview';
  if (pathname.includes('/scan')) activeTab = 'scan';
  else if (pathname.includes('/protect')) activeTab = 'protect';
  else if (pathname.includes('/intelligence')) activeTab = 'intelligence';
  else if (pathname.includes('/profile')) activeTab = 'profile';

  const handleSelectTab = (tab: NavTab) => {
    switch (tab) {
      case 'scan':
        router.push('/(tabs)/scan');
        break;
      case 'protect':
        router.push('/(tabs)/protect');
        break;
      case 'intelligence':
        router.push('/(tabs)/intelligence');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
      case 'overview':
      default:
        router.push('/(tabs)');
        break;
    }
  };

  return (
    <AuthProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />

        {/* Desktop Sidebar Rail when on wide/desktop viewport */}
        {isDesktop && <SidebarNav activeTab={activeTab} onSelectTab={handleSelectTab} />}

        {/* Main Content Area */}
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
