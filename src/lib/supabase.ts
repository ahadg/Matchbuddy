import { AppState, Platform } from 'react-native';

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

import { appConfig } from '@/lib/config';

const fallbackUrl = appConfig.supabase.url || 'https://placeholder-project.supabase.co';
const fallbackPublishableKey = appConfig.supabase.publishableKey || 'sb_publishable_placeholder';
const storageFallback = new Map<string, string>();
let hasWarnedAboutStorageFallback = false;

const safeNativeStorage = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);

      if (typeof value === 'string') {
        storageFallback.set(key, value);
      }

      return value;
    } catch (error) {
      warnAboutStorageFallback(error);
      return storageFallback.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string) => {
    storageFallback.set(key, value);

    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      warnAboutStorageFallback(error);
    }
  },
  removeItem: async (key: string) => {
    storageFallback.delete(key);

    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      warnAboutStorageFallback(error);
    }
  },
};

function warnAboutStorageFallback(error: unknown) {
  if (hasWarnedAboutStorageFallback) {
    return;
  }

  hasWarnedAboutStorageFallback = true;
  console.warn(
    'MatchBuddy fell back to in-memory auth storage because AsyncStorage is unavailable.',
    error,
  );
}

export const supabase = createClient(fallbackUrl, fallbackPublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: safeNativeStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

let autoRefreshRegistered = false;

if (Platform.OS !== 'web' && !autoRefreshRegistered) {
  autoRefreshRegistered = true;

  AppState.addEventListener('change', (state) => {
    if (!appConfig.supabase.enabled) {
      return;
    }

    if (state === 'active') {
      supabase.auth.startAutoRefresh();
      return;
    }

    supabase.auth.stopAutoRefresh();
  });
}
