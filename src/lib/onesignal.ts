type NativeOneSignalModule = {
  LogLevel: {
    None: number;
    Verbose: number;
  };
  OneSignal: {
    initialize: (appId: string) => void;
    login: (externalId: string) => void;
    logout: () => void;
    Debug: {
      setLogLevel: (level: number) => void;
    };
    Notifications: {
      getPermissionAsync: () => Promise<boolean>;
      canRequestPermission: () => Promise<boolean>;
      requestPermission: (fallbackToSettings: boolean) => Promise<boolean>;
      addEventListener: (event: 'click' | 'permissionChange', listener: (...args: any[]) => void) => void;
      removeEventListener: (event: 'click' | 'permissionChange', listener: (...args: any[]) => void) => void;
    };
    User: {
      getExternalId: () => Promise<null | string>;
      addEventListener: (event: 'change', listener: (...args: any[]) => void) => void;
      removeEventListener: (event: 'change', listener: (...args: any[]) => void) => void;
      pushSubscription: {
        getIdAsync: () => Promise<null | string>;
        getOptedInAsync: () => Promise<boolean>;
        addEventListener: (event: 'change', listener: (...args: any[]) => void) => void;
        removeEventListener: (event: 'change', listener: (...args: any[]) => void) => void;
      };
    };
  };
};

export type OneSignalClickEvent = {
  notification: {
    additionalData?: object;
  };
};

export type OneSignalClickListener = (event: OneSignalClickEvent) => void;
export type OneSignalBooleanListener = (value: boolean) => void;
export type OneSignalVoidListener = () => void;

let cachedNativeModule: NativeOneSignalModule | null | undefined;
let warnedUnavailable = false;

function getNativeOneSignalModule() {
  if (cachedNativeModule !== undefined) {
    return cachedNativeModule;
  }

  try {
    cachedNativeModule = require('react-native-onesignal') as NativeOneSignalModule;
    return cachedNativeModule;
  } catch (error) {
    cachedNativeModule = null;

    if (!warnedUnavailable) {
      warnedUnavailable = true;
      console.warn(
        'OneSignal native module is unavailable in this build. Push features stay disabled until you rebuild a native dev client.',
        error,
      );
    }

    return cachedNativeModule;
  }
}

export const LogLevel = {
  None: 0,
  Verbose: 6,
} as const;

export const oneSignalClient = {
  isSupported() {
    return Boolean(getNativeOneSignalModule());
  },
  initialize(appId: string) {
    getNativeOneSignalModule()?.OneSignal.initialize(appId);
  },
  setDebugLogLevel(level: number) {
    getNativeOneSignalModule()?.OneSignal.Debug.setLogLevel(level);
  },
  login(externalId: string) {
    getNativeOneSignalModule()?.OneSignal.login(externalId);
  },
  logout() {
    getNativeOneSignalModule()?.OneSignal.logout();
  },
  async getPermissionAsync() {
    return (await getNativeOneSignalModule()?.OneSignal.Notifications.getPermissionAsync()) ?? false;
  },
  async canRequestPermission() {
    return (await getNativeOneSignalModule()?.OneSignal.Notifications.canRequestPermission()) ?? false;
  },
  async requestPermission(fallbackToSettings: boolean) {
    return (await getNativeOneSignalModule()?.OneSignal.Notifications.requestPermission(fallbackToSettings)) ?? false;
  },
  async getSubscriptionIdAsync() {
    return (await getNativeOneSignalModule()?.OneSignal.User.pushSubscription.getIdAsync()) ?? null;
  },
  async getOptedInAsync() {
    return (await getNativeOneSignalModule()?.OneSignal.User.pushSubscription.getOptedInAsync()) ?? false;
  },
  async getExternalId() {
    return (await getNativeOneSignalModule()?.OneSignal.User.getExternalId()) ?? null;
  },
  addPermissionChangeListener(listener: OneSignalBooleanListener) {
    getNativeOneSignalModule()?.OneSignal.Notifications.addEventListener('permissionChange', listener);
  },
  removePermissionChangeListener(listener: OneSignalBooleanListener) {
    getNativeOneSignalModule()?.OneSignal.Notifications.removeEventListener('permissionChange', listener);
  },
  addPushSubscriptionChangeListener(listener: OneSignalVoidListener) {
    getNativeOneSignalModule()?.OneSignal.User.pushSubscription.addEventListener('change', listener);
  },
  removePushSubscriptionChangeListener(listener: OneSignalVoidListener) {
    getNativeOneSignalModule()?.OneSignal.User.pushSubscription.removeEventListener('change', listener);
  },
  addUserChangeListener(listener: OneSignalVoidListener) {
    getNativeOneSignalModule()?.OneSignal.User.addEventListener('change', listener);
  },
  removeUserChangeListener(listener: OneSignalVoidListener) {
    getNativeOneSignalModule()?.OneSignal.User.removeEventListener('change', listener);
  },
  addNotificationClickListener(listener: OneSignalClickListener) {
    getNativeOneSignalModule()?.OneSignal.Notifications.addEventListener('click', listener);
  },
  removeNotificationClickListener(listener: OneSignalClickListener) {
    getNativeOneSignalModule()?.OneSignal.Notifications.removeEventListener('click', listener);
  },
};
