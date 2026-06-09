import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appConfig } from '@/lib/config';
import { useAuthStore } from '@/stores/auth-store';

const OTP_LENGTH = 8;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [token, setToken] = useState('');
  const [error, setError] = useState<null | string>(null);
  const loading = useAuthStore((state) => state.loading);
  const pendingEmail = useAuthStore((state) => state.pendingEmail);
  const session = useAuthStore((state) => state.session);
  const clearPendingEmail = useAuthStore((state) => state.clearPendingEmail);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);

  if (!appConfig.api.enabled || !appConfig.supabase.enabled) {
    return <Redirect href="/sign-in" />;
  }

  if (session) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  if (!pendingEmail) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Verify code' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ padding: Spacing.three }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 18 }}>
          <View style={{ gap: 6 }}>
            <MatchText variant="label" tone="muted">
              Verification
            </MatchText>
            <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
              Enter your code
            </MatchText>
            <MatchText tone="muted" style={{ fontSize: 15, lineHeight: 21 }}>
              We sent a one-time code to {pendingEmail}.
            </MatchText>
          </View>

          <SurfaceCard style={{ padding: 18, borderRadius: 28 }}>
            <View style={{ gap: 14 }}>
              <View style={{ gap: 8 }}>
                <MatchText variant="label" tone="muted">
                  One-time code
                </MatchText>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  placeholder="123456"
                  placeholderTextColor="rgba(232, 238, 245, 0.45)"
                  selectionColor={theme.accent}
                  textContentType="oneTimeCode"
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.10)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: theme.text,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 18,
                    letterSpacing: 4,
                  }}
                  value={token}
                  onChangeText={(value) => {
                    setToken(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
                  }}
                />
              </View>

              {error ? (
                <MatchText tone="warm" style={{ fontSize: 14 }}>
                  {error}
                </MatchText>
              ) : null}

              <Pressable
                onPress={async () => {
                  const result = await verifyOtp(token);

                  if (result.error) {
                    setError(result.error);
                    return;
                  }

                  setError(null);
                  router.replace('/(tabs)/(home)');
                }}
                style={({ pressed }) => ({
                  minHeight: 56,
                  borderRadius: 999,
                  backgroundColor: theme.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.94 : token.length === OTP_LENGTH ? 1 : 0.75,
                })}>
                {loading ? (
                  <ActivityIndicator color="#111722" />
                ) : (
                  <MatchText variant="title" style={{ color: '#111722', fontSize: 18, lineHeight: 20 }}>
                    Verify and continue
                  </MatchText>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  clearPendingEmail();
                  router.replace('/sign-in');
                }}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  opacity: pressed ? 0.7 : 1,
                })}>
                <MatchText tone="muted" style={{ fontSize: 14 }}>
                  Use a different email
                </MatchText>
              </Pressable>
            </View>
          </SurfaceCard>
        </View>
      </ScrollView>
    </>
  );
}
