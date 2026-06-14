import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { MATCHBUDDY_ADMIN_EMAIL } from '@/constants/admin';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appConfig } from '@/lib/config';
import { deleteMyAccount } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const clearLocalSession = useAuthStore((state) => state.clearLocalSession);
  const profile = useProfileStore((state) => state.profile);
  const loading = useProfileStore((state) => state.loading);
  const avatarUploading = useProfileStore((state) => state.avatarUploading);
  const refresh = useProfileStore((state) => state.refresh);
  const uploadAvatar = useProfileStore((state) => state.uploadAvatar);
  const clearProfile = useProfileStore((state) => state.clear);
  const isAdmin = session?.user?.email?.trim().toLowerCase() === MATCHBUDDY_ADMIN_EMAIL;
  const [photoMessage, setPhotoMessage] = useState<null | string>(null);
  const [photoMessageTone, setPhotoMessageTone] = useState<'accent' | 'danger'>('accent');
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirming'>('idle');
  const [deleteError, setDeleteError] = useState<null | string>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const displayName = profile?.displayName ?? 'MatchBuddy fan';
  const initial = displayName[0]?.toUpperCase() ?? 'M';
  const setupSummary = profile?.setup
    ? `${profile.setup.screenSize} · ${profile.setup.displayType} · ${profile.setup.audio}`
    : 'Add your TV setup in profile setup';
  const locationSummary =
    profile?.city && profile?.neighborhood
      ? `${profile.neighborhood} · ${profile.city}`
      : 'Finish your profile to unlock nearby matches';
  const teams = profile?.favouriteTeams ?? [];

  const rows = [
    { icon: '✦', label: 'Match Day Mode', value: profile?.matchDayModeFixtureId ? 'On' : 'Off' },
    { icon: '♕', label: 'Hosting', value: profile?.isHost ? 'Active' : 'Guest mode' },
    { icon: '📺', label: 'Setup', value: profile?.setup ? profile.setup.displayType : 'Not added' },
  ] as const;

  useFocusEffect(
    useCallback(() => {
      if (!appConfig.api.enabled || !session?.user?.id) {
        return undefined;
      }

      refresh().catch(() => undefined);
      return undefined;
    }, [refresh, session?.user?.id]),
  );

  const handlePickProfilePhoto = useCallback(async () => {
    setPhotoMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPhotoMessageTone('danger');
        setPhotoMessage('Photo library access is needed before you can change your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        mediaTypes: ['images'],
        quality: 0.72,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.base64) {
        setPhotoMessageTone('danger');
        setPhotoMessage('We could not read that image. Please try another photo.');
        return;
      }

      if (typeof asset.fileSize === 'number' && asset.fileSize > 5_000_000) {
        setPhotoMessageTone('danger');
        setPhotoMessage('Choose a photo under 5 MB so it uploads quickly.');
        return;
      }

      const uploadResult = await uploadAvatar({
        base64: asset.base64,
        contentType: asset.mimeType ?? 'image/jpeg',
      });

      setPhotoMessageTone(uploadResult.error ? 'danger' : 'accent');
      setPhotoMessage(uploadResult.error ? uploadResult.error : 'Profile photo updated.');
    } catch (error) {
      setPhotoMessageTone('danger');
      setPhotoMessage(
        error instanceof Error ? error.message : 'We could not update your profile photo right now.',
      );
    }
  }, [uploadAvatar]);

  const handleDeleteAccount = useCallback(async () => {
    if (deletingAccount) {
      return;
    }

    setDeletingAccount(true);
    setDeleteError(null);

    try {
      await deleteMyAccount();
      clearProfile();
      clearLocalSession();
      await signOut().catch(() => undefined);
      router.replace('/sign-in');
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'We could not delete your account right now. Please try again.',
      );
      setDeletingAccount(false);
    }
  }, [clearLocalSession, clearProfile, deletingAccount, router, signOut]);

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          appConfig.api.enabled && session ? (
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                refresh().catch(() => undefined);
              }}
              tintColor={theme.accent}
            />
          ) : undefined
        }
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: BottomTabInset + 22,
        }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
          <View
            style={{
              height: 144,
              backgroundColor: '#161B2C',
              overflow: 'hidden',
            }}>
            <View style={{ position: 'absolute', left: -8, top: 18, width: 170, height: 170, borderRadius: 60, backgroundColor: 'rgba(101, 246, 178, 0.10)' }} />
            <View style={{ position: 'absolute', right: -24, top: -6, width: 190, height: 150, borderRadius: 62, backgroundColor: 'rgba(255, 141, 98, 0.12)' }} />
            <View style={{ position: 'absolute', left: 110, top: -10, width: 180, height: 120, borderRadius: 52, backgroundColor: 'rgba(157, 123, 255, 0.14)' }} />
          </View>

          <View style={{ paddingHorizontal: Spacing.three, marginTop: -96, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three }}>
              <View
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: 32,
                  overflow: 'hidden',
                  backgroundColor: '#66D8FF',
                  borderWidth: 6,
                  borderColor: theme.background,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {profile?.avatarUrl ? (
                  <Image
                    source={profile.avatarUrl}
                    contentFit="cover"
                    style={{ position: 'absolute', inset: 0 }}
                  />
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 26,
                        backgroundColor: theme.accent,
                        opacity: 0.62,
                      }}
                    />
                    <MatchText
                      variant="hero"
                      style={{ color: '#091019', fontSize: 48, lineHeight: 50, zIndex: 1 }}>
                      {initial}
                    </MatchText>
                  </>
                )}
                <Pressable
                  onPress={() => {
                    handlePickProfilePhoto().catch(() => undefined);
                  }}
                  disabled={avatarUploading}
                  style={({ pressed }) => ({
                    position: 'absolute',
                    right: 6,
                    top: 6,
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: 'rgba(11,18,28,0.76)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed || avatarUploading ? 0.82 : 1,
                  })}>
                  {avatarUploading ? (
                    <ActivityIndicator color={theme.accent} size="small" />
                  ) : (
                    <SymbolView
                      name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                      size={16}
                      tintColor={theme.text}
                      type="monochrome"
                    />
                  )}
                </Pressable>
                {profile?.verified ? (
                  <View
                    style={{
                      position: 'absolute',
                      right: -2,
                      bottom: -2,
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      backgroundColor: theme.accent,
                      borderWidth: 3,
                      borderColor: theme.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MatchText variant="title" style={{ color: '#0B121C', fontSize: 22, lineHeight: 24 }}>
                      ✓
                    </MatchText>
                  </View>
                ) : null}
              </View>

              <View style={{ alignItems: 'flex-end', gap: 10 }}>
                <Pressable
                  onPress={() => {
                    router.push('/profile-setup');
                  }}
                  style={{
                    marginTop: 62,
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderRadius: 999,
                    backgroundColor: '#1A2032',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.10)',
                  }}>
                  <MatchText variant="title" style={{ fontSize: 18, lineHeight: 20 }}>
                    {profile ? 'Edit profile' : 'Create profile'}
                  </MatchText>
                </Pressable>

                {isAdmin ? (
                  <Pressable
                    onPress={() => {
                      router.push('/(tabs)/(profile)/admin-fixtures');
                    }}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 12,
                      borderRadius: 999,
                      backgroundColor: 'rgba(160,255,97,0.14)',
                      borderWidth: 1,
                      borderColor: 'rgba(160,255,97,0.22)',
                    }}>
                    <MatchText tone="accent" style={{ fontSize: 14, fontWeight: '800' }}>
                      Manage fixtures
                    </MatchText>
                  </Pressable>
                ) : null}

                {appConfig.supabase.enabled && session ? (
                  <Pressable
                    onPress={() => {
                      signOut().catch(() => undefined);
                    }}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 18 }}>
                      Sign out
                    </MatchText>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {photoMessage ? (
              <MatchText
                tone={photoMessageTone}
                style={{ fontSize: 13, lineHeight: 18 }}>
                {photoMessage}
              </MatchText>
            ) : null}

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <MatchText variant="hero" style={{ fontSize: 38, lineHeight: 40 }}>
                  {displayName}
                </MatchText>
                {profile?.verified ? (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 12,
                      backgroundColor: 'rgba(160,255,97,0.18)',
                    }}>
                    <MatchText style={{ color: theme.accent, fontWeight: '800', fontSize: 14 }}>VERIFIED</MatchText>
                  </View>
                ) : null}
              </View>
              <MatchText tone="muted" style={{ fontSize: 15, lineHeight: 20 }}>
                {locationSummary}
              </MatchText>
              {appConfig.supabase.enabled && session?.user?.email ? (
                <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 18 }}>
                  Signed in as {session.user.email}
                </MatchText>
              ) : null}
              <MatchText style={{ fontSize: 16, lineHeight: 24 }}>
                {profile?.bio?.trim() || 'Add your football personality, favourite teams, and setup so fans know what kind of watch party you bring.'}
              </MatchText>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {teams.length > 0 ? (
                teams.map((team, index) => {
                  const tone =
                    index % 3 === 0 ? theme.accent : index % 3 === 1 ? theme.warm : theme.danger;
                  const backgroundColor =
                    index % 3 === 0
                      ? 'rgba(160,255,97,0.12)'
                      : index % 3 === 1
                        ? 'rgba(255,141,98,0.14)'
                        : 'rgba(157,123,255,0.14)';

                  return (
                    <View
                      key={team}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: backgroundColor,
                        backgroundColor,
                      }}>
                      <MatchText
                        style={{
                          color: tone,
                          fontSize: 14,
                          fontWeight: '800',
                        }}>
                        {team}
                      </MatchText>
                    </View>
                  );
                })
              ) : (
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.10)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}>
                  <MatchText tone="muted" style={{ fontSize: 14, fontWeight: '700' }}>
                    Add favourite teams
                  </MatchText>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard top={profile?.isHost ? 'Host' : 'Guest'} bottom="MODE" />
              <StatCard top={profile ? String(profile.rating.toFixed(1)) : '--'} bottom="RATING" />
              <StatCard top={profile ? `${profile.waveBackRate}%` : '--'} bottom="WAVES BACK" />
            </View>

            <SurfaceCard
              style={{
                padding: 18,
                borderRadius: 30,
                backgroundColor: '#171D30',
                borderColor: 'rgba(255,255,255,0.10)',
                gap: 8,
              }}>
              <MatchText variant="subtitle">Setup summary</MatchText>
              <MatchText tone="muted" style={{ fontSize: 15, lineHeight: 20 }}>
                {loading ? 'Refreshing your profile…' : setupSummary}
              </MatchText>
            </SurfaceCard>

            <SurfaceCard
              style={{
                padding: 0,
                borderRadius: 30,
                overflow: 'hidden',
                backgroundColor: '#171D30',
                borderColor: 'rgba(255,255,255,0.10)',
              }}>
              {rows.map((row, index) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingHorizontal: 20,
                    paddingVertical: 17,
                    borderBottomWidth: index === rows.length - 1 ? 0 : 1,
                    borderBottomColor: 'rgba(255,255,255,0.08)',
                  }}>
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      backgroundColor: 'rgba(160,255,97,0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MatchText variant="title" style={{ color: theme.accent, fontSize: 24, lineHeight: 26 }}>
                      {row.icon}
                    </MatchText>
                  </View>
                  <MatchText variant="title" style={{ flex: 1, fontSize: 20, lineHeight: 22 }}>
                    {row.label}
                  </MatchText>
                  <MatchText style={{ color: theme.accent, fontSize: 15, fontWeight: '800' }}>{row.value}</MatchText>
                  <MatchText tone="muted" style={{ fontSize: 20 }}>
                    ›
                  </MatchText>
                </View>
              ))}
            </SurfaceCard>

            {appConfig.supabase.enabled && session ? (
              <SurfaceCard
                tone="danger"
                style={{
                  padding: 18,
                  borderRadius: 30,
                  backgroundColor: '#171D30',
                  borderColor: 'rgba(255,141,98,0.20)',
                  gap: 12,
                }}>
                <View style={{ gap: 6 }}>
                  <MatchText variant="subtitle">Delete account</MatchText>
                  <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
                    This permanently removes your MatchBuddy account, profile, hosted listings, join requests, and account-linked chat data from active use.
                  </MatchText>
                </View>

                {deleteStep === 'confirming' ? (
                  <>
                    <MatchText tone="warm" style={{ fontSize: 13, lineHeight: 18 }}>
                      This action cannot be undone. Delete only if you are sure.
                    </MatchText>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        disabled={deletingAccount}
                        onPress={() => {
                          setDeleteError(null);
                          setDeleteStep('idle');
                        }}
                        style={({ pressed }) => ({
                          flex: 1,
                          minHeight: 52,
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.10)',
                          backgroundColor: '#11182A',
                          opacity: pressed || deletingAccount ? 0.82 : 1,
                        })}>
                        <MatchText variant="subtitle" style={{ fontSize: 15, lineHeight: 18 }}>
                          Cancel
                        </MatchText>
                      </Pressable>
                      <Pressable
                        disabled={deletingAccount}
                        onPress={() => {
                          handleDeleteAccount().catch(() => undefined);
                        }}
                        style={({ pressed }) => ({
                          flex: 1,
                          minHeight: 52,
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme.warm,
                          opacity: pressed || deletingAccount ? 0.82 : 1,
                        })}>
                        <MatchText
                          variant="subtitle"
                          style={{ color: theme.textInverted, fontSize: 15, lineHeight: 18 }}>
                          {deletingAccount ? 'Deleting…' : 'Delete permanently'}
                        </MatchText>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <Pressable
                    onPress={() => {
                      setDeleteError(null);
                      setDeleteStep('confirming');
                    }}
                    style={({ pressed }) => ({
                      minHeight: 52,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#2A1620',
                      borderWidth: 1,
                      borderColor: 'rgba(255,141,98,0.24)',
                      opacity: pressed ? 0.86 : 1,
                    })}>
                    <MatchText variant="subtitle" style={{ color: theme.warm, fontSize: 15, lineHeight: 18 }}>
                      Delete account
                    </MatchText>
                  </Pressable>
                )}

                {deleteError ? (
                  <MatchText tone="warm" style={{ fontSize: 13, lineHeight: 18 }}>
                    {deleteError}
                  </MatchText>
                ) : null}
              </SurfaceCard>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function StatCard({ top, bottom }: { top: string; bottom: string }) {
  return (
    <SurfaceCard
      style={{
        flex: 1,
        paddingVertical: 22,
        paddingHorizontal: 14,
        borderRadius: 26,
        backgroundColor: '#171D30',
        borderColor: 'rgba(255,255,255,0.10)',
      }}>
      <MatchText variant="hero" style={{ textAlign: 'center', fontSize: 26, lineHeight: 30 }}>
        {top}
      </MatchText>
      <MatchText variant="label" tone="muted" style={{ textAlign: 'center', fontSize: 14 }}>
        {bottom}
      </MatchText>
    </SurfaceCard>
  );
}
