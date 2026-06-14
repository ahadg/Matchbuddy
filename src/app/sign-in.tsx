import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { appConfig } from '@/lib/config';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const authConfigured = appConfig.api.enabled && appConfig.supabase.enabled;
  const reviewEmail = appConfig.reviewAccess.email;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<null | string>(null);
  const loading = useAuthStore((state) => state.loading);
  const pendingEmail = useAuthStore((state) => state.pendingEmail);
  const session = useAuthStore((state) => state.session);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const signInWithPassword = useAuthStore((state) => state.signInWithPassword);
  const normalizedEmail = email.trim().toLowerCase();
  const useReviewPasswordFlow = appConfig.reviewAccess.enabled && normalizedEmail === reviewEmail;

  if (!authConfigured) {
    return (
      <>
        <Stack.Screen options={{ title: 'Sign in' }} />
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={{ padding: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 16 }}>
            <SurfaceCard tone="warm">
              <MatchText variant="title">Auth is not configured yet.</MatchText>
              <MatchText tone="muted">
                Add `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to
                start the OTP flow.
              </MatchText>
            </SurfaceCard>
          </View>
        </ScrollView>
      </>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ padding: Spacing.three, paddingTop: insets.top + Spacing.three }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 18 }}>
          <View style={{ gap: 6 }}>
            <MatchText variant="label" tone="muted">
              Secure access
            </MatchText>
            <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
              Sign in to MatchBuddy
            </MatchText>
            <MatchText tone="muted" style={{ fontSize: 15, lineHeight: 21 }}>
              {useReviewPasswordFlow
                ? 'This review account uses password sign-in so Google Play can access the app without email OTP.'
                : 'Enter your email and we&apos;ll send a one-time code through email. New users are created automatically.'}
            </MatchText>
          </View>

          <SurfaceCard style={{ padding: 18, borderRadius: 28 }}>
            <View style={{ gap: 14 }}>
              <View style={{ gap: 8 }}>
                <MatchText variant="label" tone="muted">
                  Email
                </MatchText>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(232, 238, 245, 0.45)"
                  selectionColor={theme.accent}
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.10)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: theme.text,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                  }}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (value.trim().toLowerCase() !== reviewEmail) {
                      setPassword('');
                    }
                  }}
                />
              </View>

              {useReviewPasswordFlow ? (
                <View style={{ gap: 8 }}>
                  <MatchText variant="label" tone="muted">
                    Password
                  </MatchText>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="password"
                    placeholder="Enter review password"
                    placeholderTextColor="rgba(232, 238, 245, 0.45)"
                    secureTextEntry
                    selectionColor={theme.accent}
                    style={{
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.10)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      color: theme.text,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                    }}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              ) : null}

              {error ? (
                <MatchText tone="warm" style={{ fontSize: 14 }}>
                  {error}
                </MatchText>
              ) : null}

              <Pressable
                onPress={async () => {
                  const result = useReviewPasswordFlow
                    ? await signInWithPassword(email, password)
                    : await sendOtp(email);

                  if (result.error) {
                    setError(result.error);
                    return;
                  }

                  setError(null);
                  if (useReviewPasswordFlow) {
                    router.replace('/(tabs)/(home)');
                    return;
                  }

                  router.push('/verify-otp');
                }}
                style={({ pressed }) => ({
                  minHeight: 56,
                  borderRadius: 999,
                  backgroundColor: theme.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.94 : 1,
                })}>
                {loading ? (
                  <ActivityIndicator color="#111722" />
                ) : (
                  <MatchText variant="title" style={{ color: '#111722', fontSize: 18, lineHeight: 20 }}>
                    {useReviewPasswordFlow ? 'Sign in' : 'Send code'}
                  </MatchText>
                )}
              </Pressable>

              {pendingEmail && !useReviewPasswordFlow ? (
                <MatchText tone="muted" style={{ fontSize: 14 }}>
                  Last code sent to {pendingEmail}
                </MatchText>
              ) : null}
            </View>
          </SurfaceCard>
        </View>
      </ScrollView>
    </>
  );
}
