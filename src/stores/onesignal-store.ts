import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { appConfig } from '@/lib/config';
import { LogLevel, oneSignalClient } from '@/lib/onesignal';

const ONESIGNAL_PROMPT_DISMISSED_KEY = 'matchbuddy.onesignal.prompt.dismissed.v1';

type OneSignalState = {
  authUserId: null | string;
  available: boolean;
  canRequestPermission: boolean;
  externalId: null | string;
  initialized: boolean;
  optedIn: boolean;
  permissionGranted: boolean;
  promptDismissed: boolean;
  promptVisible: boolean;
  requestingPermission: boolean;
  subscriptionId: null | string;
  bootstrap: () => Promise<void>;
  dismissPrompt: () => Promise<void>;
  requestPermission: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  syncAuthUser: (authUserId: null | string) => Promise<void>;
};

let bootstrapPromise: null | Promise<void> = null;
let oneSignalInitialized = false;
let observersRegistered = false;

function isNativePushSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function readPromptDismissed() {
  try {
    return (await AsyncStorage.getItem(ONESIGNAL_PROMPT_DISMISSED_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function writePromptDismissed(value: boolean) {
  try {
    if (value) {
      await AsyncStorage.setItem(ONESIGNAL_PROMPT_DISMISSED_KEY, 'true');
      return;
    }

    await AsyncStorage.removeItem(ONESIGNAL_PROMPT_DISMISSED_KEY);
  } catch {
    return;
  }
}

function shouldShowPrompt(state: {
  authUserId: null | string;
  available: boolean;
  canRequestPermission: boolean;
  permissionGranted: boolean;
  promptDismissed: boolean;
}) {
  return (
    state.available &&
    Boolean(state.authUserId) &&
    state.canRequestPermission &&
    !state.permissionGranted &&
    !state.promptDismissed
  );
}

export const useOneSignalStore = create<OneSignalState>()((set, get) => ({
  authUserId: null,
  available: false,
  canRequestPermission: false,
  externalId: null,
  initialized: false,
  optedIn: false,
  permissionGranted: false,
  promptDismissed: false,
  promptVisible: false,
  requestingPermission: false,
  subscriptionId: null,
  bootstrap: async () => {
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      const available =
        appConfig.oneSignal.enabled &&
        isNativePushSupported() &&
        oneSignalClient.isSupported();
      const promptDismissed = await readPromptDismissed();

      if (!available) {
        set({
          available: false,
          canRequestPermission: false,
          externalId: null,
          initialized: true,
          optedIn: false,
          permissionGranted: false,
          promptDismissed,
          promptVisible: false,
          requestingPermission: false,
          subscriptionId: null,
        });
        return;
      }

      if (!oneSignalInitialized) {
        if (__DEV__) {
          oneSignalClient.setDebugLogLevel(LogLevel.Verbose);
        }

        oneSignalClient.initialize(appConfig.oneSignal.appId);
        oneSignalInitialized = true;
      }

      if (!observersRegistered) {
        observersRegistered = true;

        const refresh = () => {
          get().refreshStatus().catch(() => undefined);
        };

        oneSignalClient.addPermissionChangeListener(refresh);
        oneSignalClient.addPushSubscriptionChangeListener(refresh);
        oneSignalClient.addUserChangeListener(refresh);
      }

      set({
        available: true,
        initialized: true,
        promptDismissed,
      });

      await get().refreshStatus();
    })();

    return bootstrapPromise;
  },
  dismissPrompt: async () => {
    await writePromptDismissed(true);
    set({
      promptDismissed: true,
      promptVisible: false,
    });
  },
  requestPermission: async () => {
    set({ requestingPermission: true });

    try {
      await oneSignalClient.requestPermission(false);
      await writePromptDismissed(true);
      set({
        promptDismissed: true,
        promptVisible: false,
      });
      await get().refreshStatus();
    } finally {
      set({ requestingPermission: false });
    }
  },
  refreshStatus: async () => {
    if (!appConfig.oneSignal.enabled || !isNativePushSupported()) {
      set({
        available: false,
        canRequestPermission: false,
        externalId: null,
        initialized: true,
        optedIn: false,
        permissionGranted: false,
        promptVisible: false,
        subscriptionId: null,
      });
      return;
    }

    if (!oneSignalClient.isSupported()) {
      set({
        available: false,
        canRequestPermission: false,
        externalId: null,
        initialized: true,
        optedIn: false,
        permissionGranted: false,
        promptVisible: false,
        subscriptionId: null,
      });
      return;
    }

    const promptDismissed = get().promptDismissed || (await readPromptDismissed());
    const [permissionGranted, canRequestPermission, optedIn, subscriptionId, externalId] = await Promise.all([
      oneSignalClient.getPermissionAsync(),
      oneSignalClient.canRequestPermission(),
      oneSignalClient.getOptedInAsync(),
      oneSignalClient.getSubscriptionIdAsync(),
      oneSignalClient.getExternalId(),
    ]);

    const nextState = {
      available: true,
      canRequestPermission,
      externalId,
      initialized: true,
      optedIn,
      permissionGranted,
      promptDismissed,
      subscriptionId,
    };

    set({
      ...nextState,
      promptVisible: shouldShowPrompt({
        ...nextState,
        authUserId: get().authUserId,
      }),
    });
  },
  syncAuthUser: async (authUserId) => {
    set({ authUserId });

    await get().bootstrap();

    if (!appConfig.oneSignal.enabled || !isNativePushSupported()) {
      return;
    }

    const currentExternalId = await oneSignalClient.getExternalId();

    if (authUserId) {
      if (currentExternalId !== authUserId) {
        oneSignalClient.login(authUserId);
      }
    } else if (currentExternalId) {
      oneSignalClient.logout();
    }

    await get().refreshStatus();
  },
}));
