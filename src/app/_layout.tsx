import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { MatchText } from '@/components/matchbuddy/ui';
import { appConfig } from '@/lib/config';
import { useAuthStore } from '@/stores/auth-store';

const NavigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.background,
    border: Colors.light.border,
    primary: Colors.light.accent,
    text: Colors.light.text,
    notification: Colors.light.warm,
  },
};

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    bootstrap().catch(() => undefined);
  }, [bootstrap]);

  if (!initialized) {
    return (
      <ThemeProvider value={NavigationLightTheme}>
        <StatusBar style="light" />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            backgroundColor: Colors.light.background,
          }}>
          <ActivityIndicator color={Colors.light.accent} />
          <MatchText tone="muted">Preparing MatchBuddy…</MatchText>
        </View>
      </ThemeProvider>
    );
  }

  const authEnabled = appConfig.supabase.enabled;
  const isSignedIn = !authEnabled || Boolean(session);

  return (
    <ThemeProvider value={NavigationLightTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="verify-otp" />
        </Stack.Protected>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
