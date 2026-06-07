import { AppState, Platform } from 'react-native';

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

import { appConfig } from '@/lib/config';

const fallbackUrl = appConfig.supabase.url || 'https://placeholder-project.supabase.co';
const fallbackPublishableKey = appConfig.supabase.publishableKey || 'sb_publishable_placeholder';

export const supabase = createClient(fallbackUrl, fallbackPublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
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
