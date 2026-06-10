export type OneSignalClickEvent = {
  notification: {
    additionalData?: object;
  };
};

export type OneSignalClickListener = (event: OneSignalClickEvent) => void;
export type OneSignalBooleanListener = (value: boolean) => void;
export type OneSignalVoidListener = () => void;

export const LogLevel = {
  None: 0,
  Verbose: 6,
} as const;

export const oneSignalClient = {
  initialize(_appId: string) {},
  setDebugLogLevel(_level: number) {},
  login(_externalId: string) {},
  logout() {},
  async getPermissionAsync() {
    return false;
  },
  async canRequestPermission() {
    return false;
  },
  async requestPermission(_fallbackToSettings: boolean) {
    return false;
  },
  async getSubscriptionIdAsync() {
    return null;
  },
  async getOptedInAsync() {
    return false;
  },
  async getExternalId() {
    return null;
  },
  addPermissionChangeListener(_listener: OneSignalBooleanListener) {},
  removePermissionChangeListener(_listener: OneSignalBooleanListener) {},
  addPushSubscriptionChangeListener(_listener: OneSignalVoidListener) {},
  removePushSubscriptionChangeListener(_listener: OneSignalVoidListener) {},
  addUserChangeListener(_listener: OneSignalVoidListener) {},
  removeUserChangeListener(_listener: OneSignalVoidListener) {},
  addNotificationClickListener(_listener: OneSignalClickListener) {},
  removeNotificationClickListener(_listener: OneSignalClickListener) {},
};
