import { Redirect } from 'expo-router';

/**
 * Root index redirect.
 * Directs navigation straight to the primary Sentinel tabs experience.
 */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
