import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { appConfig } from '@/lib/config';
import { useAuthStore } from '@/stores/auth-store';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { hasCompletedProfile, useProfileStore } from '@/stores/profile-store';

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
  const bootstrapProfile = useProfileStore((state) => state.bootstrapForUser);
  const clearProfile = useProfileStore((state) => state.clear);
  const profile = useProfileStore((state) => state.profile);
  const profileError = useProfileStore((state) => state.error);
  const profileInitialized = useProfileStore((state) => state.initialized);
  const refreshProfile = useProfileStore((state) => state.refresh);
  const setAnchor = useDiscoveryStore((state) => state.setAnchor);

  useEffect(() => {
    bootstrap().catch(() => undefined);
  }, [bootstrap]);

  useEffect(() => {
    const authEnabled = appConfig.api.enabled && appConfig.supabase.enabled;

    if (!initialized) {
      return;
    }

    if (!authEnabled) {
      clearProfile();
      return;
    }

    bootstrapProfile(session?.user.id ?? null).catch(() => undefined);
  }, [bootstrapProfile, clearProfile, initialized, session?.user.id]);

  useEffect(() => {
    if (!profile?.location) {
      return;
    }

    setAnchor(profile.location.latitude, profile.location.longitude);
  }, [profile?.location, setAnchor]);

  if (!initialized) {
    return (
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    );
  }

  const authEnabled = appConfig.api.enabled && appConfig.supabase.enabled;
  const isSignedIn = !authEnabled || Boolean(session);
  const needsProfileSetup = authEnabled && isSignedIn && !hasCompletedProfile(profile);

  if (authEnabled && session && !profileInitialized) {
    return (
      <SafeAreaProvider>
        <ThemeProvider value={NavigationLightTheme}>
          <StatusBar style="light" />
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              backgroundColor: Colors.light.background,
              padding: 24,
            }}>
            <ActivityIndicator color={Colors.light.accent} />
            <MatchText tone="muted">Loading your profile…</MatchText>
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  if (authEnabled && session && profileError && !profile) {
    return (
      <SafeAreaProvider>
        <ThemeProvider value={NavigationLightTheme}>
          <StatusBar style="light" />
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              backgroundColor: Colors.light.background,
              padding: 24,
            }}>
            <SurfaceCard style={{ width: '100%', maxWidth: 420, padding: 20, gap: 14 }}>
              <MatchText variant="title">We couldn&apos;t load your profile.</MatchText>
              <MatchText tone="muted">{profileError}</MatchText>
              <Pressable
                onPress={() => {
                  refreshProfile().catch(() => undefined);
                }}
                style={{
                  minHeight: 52,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.light.accent,
                }}>
                <MatchText variant="title" style={{ color: Colors.light.textInverted, fontSize: 18, lineHeight: 20 }}>
                  Try again
                </MatchText>
              </Pressable>
            </SurfaceCard>
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NavigationLightTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!isSignedIn}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="verify-otp" />
          </Stack.Protected>
          <Stack.Protected guard={isSignedIn && !needsProfileSetup}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={isSignedIn}>
            <Stack.Screen name="profile-setup" />
          </Stack.Protected>
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
