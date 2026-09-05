import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export interface UserPreferences {
  securityNotifications: boolean;
  privacyBoundary: 'local_only' | 'encrypted_cloud';
  language: 'en_US' | 'id_ID';
  theme: 'light' | 'system';
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  securityNotifications: true,
  privacyBoundary: 'local_only',
  language: 'en_US',
  theme: 'light',
};

const STORAGE_KEY = 'sentinel_security_preferences_v1';

// In-memory cache for cross-platform reactivity
let cachedPreferences: UserPreferences = { ...DEFAULT_PREFERENCES };
let isInitialized = false;
const listeners = new Set<(prefs: UserPreferences) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...cachedPreferences }));
}

function getWebStorage() {
  try {
    if (
      Platform.OS === 'web' &&
      typeof globalThis !== 'undefined' &&
      (globalThis as any).localStorage
    ) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // Ignore storage access restrictions
  }
  return null;
}

export function loadPreferences(): UserPreferences {
  if (isInitialized) {
    return { ...cachedPreferences };
  }

  try {
    const storage = getWebStorage();
    if (storage) {
      const stored = storage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cachedPreferences = { ...DEFAULT_PREFERENCES, ...parsed };
      }
    }
  } catch {
    // Graceful fallback to default preferences
  }

  isInitialized = true;
  return { ...cachedPreferences };
}

export function savePreferences(updates: Partial<UserPreferences>): UserPreferences {
  cachedPreferences = {
    ...loadPreferences(),
    ...updates,
  };

  try {
    const storage = getWebStorage();
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(cachedPreferences));
    }
  } catch {
    // Non-fatal persistence error
  }

  notifyListeners();
  return { ...cachedPreferences };
}

export function resetPreferences(): UserPreferences {
  cachedPreferences = { ...DEFAULT_PREFERENCES };
  try {
    const storage = getWebStorage();
    if (storage) {
      storage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Non-fatal
  }
  notifyListeners();
  return { ...cachedPreferences };
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());

  useEffect(() => {
    // Load initial
    setPreferences(loadPreferences());

    const handleUpdate = (updated: UserPreferences) => {
      setPreferences(updated);
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const update = useCallback((updates: Partial<UserPreferences>) => {
    return savePreferences(updates);
  }, []);

  return {
    preferences,
    updatePreferences: update,
    resetPreferences,
  };
}
