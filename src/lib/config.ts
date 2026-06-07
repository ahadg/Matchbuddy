const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

export const appConfig = {
  api: {
    baseUrl: apiBaseUrl,
    enabled: apiBaseUrl.length > 0,
  },
  supabase: {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
    enabled: supabaseUrl.length > 0 && supabasePublishableKey.length > 0,
  },
} as const;
