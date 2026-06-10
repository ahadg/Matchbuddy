import { DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { appConfig } from '@/lib/config';
import { oneSignalClient, type OneSignalClickEvent } from '@/lib/onesignal';
import { useAuthStore } from '@/stores/auth-store';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { useOneSignalStore } from '@/stores/onesignal-store';
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
  const router = useRouter();
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
  const bootstrapOneSignal = useOneSignalStore((state) => state.bootstrap);
  const dismissOneSignalPrompt = useOneSignalStore((state) => state.dismissPrompt);
  const oneSignalInitialized = useOneSignalStore((state) => state.initialized);
  const oneSignalPromptVisible = useOneSignalStore((state) => state.promptVisible);
  const oneSignalRequestingPermission = useOneSignalStore((state) => state.requestingPermission);
  const oneSignalRequestPermission = useOneSignalStore((state) => state.requestPermission);
  const syncOneSignalAuthUser = useOneSignalStore((state) => state.syncAuthUser);

  useEffect(() => {
    bootstrap().catch(() => undefined);
  }, [bootstrap]);

  useEffect(() => {
    bootstrapOneSignal().catch(() => undefined);
  }, [bootstrapOneSignal]);

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
    syncOneSignalAuthUser(session?.user.id ?? null).catch(() => undefined);
  }, [session?.user.id, syncOneSignalAuthUser]);

  useEffect(() => {
    if (!profile?.location) {
      return;
    }

    setAnchor(profile.location.latitude, profile.location.longitude);
  }, [profile?.location, setAnchor]);

  const handleNotificationClick = useCallback(
    (event: OneSignalClickEvent) => {
      const data = (event.notification.additionalData ?? {}) as Record<string, unknown>;
      const threadId = typeof data.threadId === 'string' ? data.threadId : null;
      const listingId = typeof data.listingId === 'string' ? data.listingId : null;
      const fanId = typeof data.fanId === 'string' ? data.fanId : null;

      if (threadId) {
        router.push({ pathname: '/chat/[threadId]', params: { threadId } });
        return;
      }

      if (listingId) {
        router.push({ pathname: '/room/[listingId]', params: { listingId } });
        return;
      }

      if (fanId) {
        router.push({ pathname: '/fan/[fanId]', params: { fanId } });
      }
    },
    [router],
  );

  useEffect(() => {
    if (!appConfig.oneSignal.enabled || !oneSignalInitialized) {
      return;
    }

    oneSignalClient.addNotificationClickListener(handleNotificationClick);

    return () => {
      oneSignalClient.removeNotificationClickListener(handleNotificationClick);
    };
  }, [handleNotificationClick, oneSignalInitialized]);

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
        {isSignedIn && !needsProfileSetup && oneSignalPromptVisible ? (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 24,
            }}>
            <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
              <SurfaceCard style={{ padding: 18, borderRadius: 28, gap: 12 }}>
                <MatchText variant="title">Enable wave alerts</MatchText>
                <MatchText tone="muted">
                  Turn on push notifications so MatchBuddy can tell you when someone waves at you or a mutual chat unlocks.
                </MatchText>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => {
                      dismissOneSignalPrompt().catch(() => undefined);
                    }}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: Colors.light.border,
                      backgroundColor: Colors.light.backgroundMuted,
                    }}>
                    <MatchText variant="subtitle">Not now</MatchText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      oneSignalRequestPermission().catch(() => undefined);
                    }}
                    style={{
                      flex: 1.2,
                      minHeight: 48,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.light.accent,
                    }}>
                    <MatchText variant="subtitle" style={{ color: Colors.light.textInverted }}>
                      {oneSignalRequestingPermission ? 'Enabling…' : 'Enable alerts'}
                    </MatchText>
                  </Pressable>
                </View>
              </SurfaceCard>
            </View>
          </View>
        ) : null}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
