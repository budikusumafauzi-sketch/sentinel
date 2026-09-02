import { View, Text, StyleSheet } from 'react-native';
import type { HealthStatus } from '@sentinel/types';

/**
 * Minimal foundation screen.
 * Proves the mobile application launches and can reference shared types.
 * The full Sentinel UI belongs to Phase 2.
 */
export default function HomeScreen() {
  // Type-check: ensure shared types are resolvable and functional
  const status: HealthStatus = {
    status: 'healthy',
    version: '0.1.0',
    uptime: 0,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentinel</Text>
      <Text style={styles.subtitle}>Personal Cybersecurity Intelligence</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>v{status.version} · Foundation Ready</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  badge: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1C1C1E',
  },
  badgeText: {
    fontSize: 12,
    color: '#30D158',
    fontWeight: '500',
  },
});
