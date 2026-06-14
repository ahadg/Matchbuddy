function normalizeUrlBase(value?: string) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

const apiBaseUrl = normalizeUrlBase(process.env.EXPO_PUBLIC_API_BASE_URL);
const oneSignalAppId =
  process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID?.trim() ?? 'c6f336ef-6a24-41e0-a71c-99f439a0d440';
const supabaseUrl = normalizeUrlBase(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
const reviewLoginEmail =
  process.env.EXPO_PUBLIC_REVIEW_LOGIN_EMAIL?.trim().toLowerCase() ?? 'angelahad259@gmail.com';

export const appConfig = {
  api: {
    baseUrl: apiBaseUrl,
    enabled: apiBaseUrl.length > 0,
  },
  oneSignal: {
    appId: oneSignalAppId,
    enabled: oneSignalAppId.length > 0,
  },
  supabase: {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
    enabled: supabaseUrl.length > 0 && supabasePublishableKey.length > 0,
  },
  reviewAccess: {
    email: reviewLoginEmail,
    enabled: reviewLoginEmail.length > 0,
  },
} as const;
