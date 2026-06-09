import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, getNearbyFans, sendWave } from '@/lib/api';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { useSocialStore } from '@/stores/social-store';
import type { ApiNearbyFan, ApiWaveStatus } from '@/types/api';

const fallbackFans = [
  {
    id: 'maya-rivera',
    displayName: 'Amir',
    neighborhood: 'Westside',
    distanceKm: 0.4,
    vibe: 'Loud',
    rating: 4.9,
    initial: 'A',
    accent: '#66D8FF',
    secondary: '#9BFF62',
    isHost: true,
    waveStatus: 'none' as const,
    directThreadId: null,
    isRemote: false,
  },
  {
    id: 'samir-khan',
    displayName: 'Sofia',
    neighborhood: 'Old Town',
    distanceKm: 0.9,
    vibe: 'Chill',
    rating: 4.8,
    initial: 'S',
    accent: '#FFB24E',
    secondary: '#FF6C78',
    isHost: false,
    waveStatus: 'none' as const,
    directThreadId: null,
    isRemote: false,
  },
  {
    id: 'jo-chen',
    displayName: 'Yara',
    neighborhood: 'Riverside',
    distanceKm: 1.2,
    vibe: 'Family',
    rating: 5,
    initial: 'Y',
    accent: '#66D8FF',
    secondary: '#9D71FF',
    isHost: true,
    waveStatus: 'none' as const,
    directThreadId: null,
    isRemote: false,
  },
];

const presetRadii = [50, 100] as const;

const radarPoints = [
  { top: 22, left: 144, color: '#FF5978' },
  { top: 102, right: 108, color: '#FF5978' },
  { top: 182, right: 132, color: '#3ED9FF' },
  { top: 214, left: 118, color: '#9D71FF' },
];

type FanCardModel = {
  id: string;
  displayName: string;
  neighborhood: string;
  distanceKm: number;
  vibe: string;
  rating: number;
  initial: string;
  accent: string;
  secondary: string;
  isHost: boolean;
  waveStatus: ApiWaveStatus;
  directThreadId: null | string;
  isRemote: boolean;
};

export default function FansScreen() {
  const router = useRouter();
  const theme = useTheme();
  const anchor = useDiscoveryStore((state) => state.anchor);
  const applyCustomRadius = useDiscoveryStore((state) => state.applyCustomRadius);
  const customRadiusKm = useDiscoveryStore((state) => state.customRadiusKm);
  const radiusKm = useDiscoveryStore((state) => state.radiusKm);
  const setCustomRadiusKm = useDiscoveryStore((state) => state.setCustomRadiusKm);
  const setRadiusKm = useDiscoveryStore((state) => state.setRadiusKm);
  const socialRevision = useSocialStore((state) => state.revision);
  const bumpSocialRevision = useSocialStore((state) => state.bumpRevision);
  const [remoteFans, setRemoteFans] = useState<ApiNearbyFan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<null | string>(null);
  const [activeWaveFanId, setActiveWaveFanId] = useState<null | string>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNearbyFans() {
      setLoading(true);
      setApiError(null);

      try {
        const fans = await getNearbyFans({
          latitude: anchor.latitude,
          longitude: anchor.longitude,
          radiusKm,
          limit: 20,
        });

        if (!cancelled) {
          setRemoteFans(fans);
        }
      } catch (error) {
        if (!cancelled) {
          if (!(error instanceof ApiConfigurationError)) {
            setApiError(error instanceof Error ? error.message : 'Could not load nearby fans.');
          }

          setRemoteFans(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNearbyFans().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [anchor.latitude, anchor.longitude, radiusKm, socialRevision]);

  const cards: FanCardModel[] = useMemo(() => {
    if (!remoteFans?.length) {
      return fallbackFans;
    }

    return remoteFans.map((fan) => ({
      id: fan.id,
      displayName: fan.displayName,
      neighborhood: fan.neighborhood,
      distanceKm: fan.distanceKm,
      vibe: fan.vibe,
      rating: fan.rating,
      initial: fan.initial,
      accent: fan.vibe === 'Family' ? '#66D8FF' : fan.vibe === 'Chill' ? '#FFB24E' : '#66D8FF',
      secondary: fan.vibe === 'Family' ? '#9D71FF' : fan.vibe === 'Chill' ? '#FF6C78' : '#9BFF62',
      isHost: fan.isHost,
      waveStatus: fan.waveStatus,
      directThreadId: fan.directThreadId,
      isRemote: true,
    }));
  }, [remoteFans]);

  async function handleWave(card: FanCardModel) {
    if (!card.isRemote) {
      router.push({ pathname: '/fan/[fanId]', params: { fanId: card.id } });
      return;
    }

    if (card.waveStatus === 'mutual' && card.directThreadId) {
      router.push({ pathname: '/chat/[threadId]', params: { threadId: card.directThreadId } });
      return;
    }

    setActiveWaveFanId(card.id);
    setApiError(null);

    try {
      const result = await sendWave(card.id);
      bumpSocialRevision();

      if (result.threadId && result.status === 'mutual') {
        router.push({ pathname: '/chat/[threadId]', params: { threadId: result.threadId } });
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Could not send your wave.');
    } finally {
      setActiveWaveFanId(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Nearby' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingTop: Spacing.three,
          paddingBottom: BottomTabInset + 24,
        }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            {presetRadii.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setRadiusKm(preset)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: radiusKm === preset ? 'rgba(160,255,97,0.18)' : 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: radiusKm === preset ? 'rgba(160,255,97,0.28)' : 'rgba(255,255,255,0.08)',
                  opacity: pressed ? 0.9 : 1,
                })}>
                <MatchText tone={radiusKm === preset ? 'accent' : 'default'} style={{ fontSize: 13, fontWeight: '700' }}>
                  {preset} km
                </MatchText>
              </Pressable>
            ))}

            <View
              style={{
                minWidth: 134,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}>
              <TextInput
                keyboardType="number-pad"
                placeholder="Custom"
                placeholderTextColor="rgba(232, 238, 245, 0.45)"
                selectionColor={theme.accent}
                style={{
                  minWidth: 54,
                  color: theme.text,
                  fontSize: 13,
                  paddingVertical: 0,
                }}
                value={customRadiusKm}
                onChangeText={setCustomRadiusKm}
                onSubmitEditing={applyCustomRadius}
              />
              <Pressable onPress={applyCustomRadius}>
                <MatchText tone="accent" style={{ fontSize: 13, fontWeight: '800' }}>
                  Apply
                </MatchText>
              </Pressable>
            </View>
          </View>

          <SurfaceCard
            style={{
              minHeight: 280,
              padding: 16,
              borderRadius: 30,
              backgroundColor: '#171D30',
              borderColor: 'rgba(255,255,255,0.10)',
            }}>
            {[0.28, 0.48, 0.68, 0.88].map((scale) => (
              <View
                key={scale}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 200 * scale,
                  height: 200 * scale,
                  marginTop: -(200 * scale) / 2,
                  marginLeft: -(200 * scale) / 2,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: scale === 0.88 ? 'rgba(160,255,97,0.20)' : 'rgba(160,255,97,0.16)',
                }}
              />
            ))}

            <View
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 42,
                height: 42,
                marginLeft: -21,
                marginTop: -21,
                borderRadius: 999,
                backgroundColor: 'rgba(160,255,97,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: theme.accent }} />
            </View>

            {radarPoints.map((point, index) => (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  backgroundColor: point.color,
                  boxShadow: `0 0 24px ${point.color}`,
                  ...(point.top !== undefined ? { top: point.top } : {}),
                  ...(point.left !== undefined ? { left: point.left } : {}),
                  ...(point.right !== undefined ? { right: point.right } : {}),
                }}
              />
            ))}

            <View
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 10,
              }}>
              <BadgePill label="🛡 Public areas only" />
              <BadgePill label={`${cards.length} within ${radiusKm}km`} />
            </View>
          </SurfaceCard>

          {loading ? (
            <SurfaceCard style={{ borderRadius: 24 }}>
              <MatchText tone="muted">Looking for fans within {radiusKm} km…</MatchText>
            </SurfaceCard>
          ) : null}

          {apiError ? (
            <SurfaceCard tone="warm" style={{ borderRadius: 24 }}>
              <MatchText tone="warm" style={{ fontSize: 14 }}>
                {apiError}
              </MatchText>
              <MatchText tone="muted" style={{ fontSize: 13 }}>
                Showing demo cards while the backend catches up.
              </MatchText>
            </SurfaceCard>
          ) : null}

          {cards.map((fan) => (
            <Pressable
              key={fan.id}
              onPress={() => router.push({ pathname: '/fan/[fanId]', params: { fanId: fan.id } })}
              style={({ pressed }) => ({
                opacity: pressed ? 0.96 : 1,
                transform: [{ scale: pressed ? 0.995 : 1 }],
              })}>
              <SurfaceCard
                style={{
                  padding: 16,
                  borderRadius: 28,
                  backgroundColor: '#171D30',
                  borderColor: 'rgba(255,255,255,0.10)',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius: 24,
                      backgroundColor: fan.secondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 24,
                        backgroundColor: fan.accent,
                        opacity: 0.72,
                      }}
                    />
                    <MatchText variant="title" style={{ color: '#091019', fontSize: 32, lineHeight: 34, zIndex: 1 }}>
                      {fan.initial}
                    </MatchText>
                    <View
                      style={{
                        position: 'absolute',
                        right: -2,
                        bottom: -2,
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        backgroundColor: theme.accent,
                        borderWidth: 3,
                        borderColor: '#171D30',
                      }}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <MatchText variant="title" style={{ fontSize: 24, lineHeight: 26 }}>
                        {fan.displayName}
                      </MatchText>
                      {fan.isHost ? <HostBadge /> : null}
                    </View>
                    <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                      {fan.neighborhood} · {fan.distanceKm.toFixed(1)} km ·
                    </MatchText>
                    <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                      {fan.vibe}
                    </MatchText>
                    <MatchText style={{ color: '#FFC84B', fontSize: 15, fontWeight: '800' }}>★ {fan.rating.toFixed(1)}</MatchText>
                  </View>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      handleWave(fan).catch(() => undefined);
                    }}
                    style={({ pressed }) => ({
                      width: 78,
                      height: 78,
                      borderRadius: 22,
                      backgroundColor: waveButtonBackground(fan.waveStatus, theme.accent),
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: waveButtonBorder(fan.waveStatus),
                      opacity: pressed ? 0.92 : 1,
                    })}>
                    <MatchText
                      variant="subtitle"
                      style={{
                        color: waveButtonForeground(fan.waveStatus),
                        fontSize: 14,
                        lineHeight: 16,
                        textAlign: 'center',
                      }}>
                      {activeWaveFanId === fan.id ? '...' : waveButtonLabel(fan.waveStatus)}
                    </MatchText>
                  </Pressable>
                </View>
              </SurfaceCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function waveButtonLabel(status: ApiWaveStatus) {
  if (status === 'mutual') {
    return 'Chat';
  }

  if (status === 'pending') {
    return 'Sent';
  }

  if (status === 'received') {
    return 'Back';
  }

  return 'Wave';
}

function waveButtonBackground(status: ApiWaveStatus, accent: string) {
  if (status === 'mutual') {
    return 'rgba(160,255,97,0.20)';
  }

  if (status === 'pending') {
    return 'rgba(157,113,255,0.22)';
  }

  if (status === 'received') {
    return 'rgba(255,178,78,0.22)';
  }

  return accent;
}

function waveButtonForeground(status: ApiWaveStatus) {
  if (status === 'pending') {
    return '#EAE6FF';
  }

  if (status === 'received') {
    return '#FFCA6B';
  }

  if (status === 'mutual') {
    return '#9BFF62';
  }

  return '#081018';
}

function waveButtonBorder(status: ApiWaveStatus) {
  if (status === 'mutual') {
    return 'rgba(160,255,97,0.30)';
  }

  if (status === 'pending') {
    return 'rgba(157,113,255,0.26)';
  }

  if (status === 'received') {
    return 'rgba(255,178,78,0.28)';
  }

  return 'rgba(160,255,97,0.28)';
}

function BadgePill({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
      }}>
      <MatchText style={{ fontSize: 14, fontWeight: '700' }}>{label}</MatchText>
    </View>
  );
}

function HostBadge() {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 203, 72, 0.18)',
      }}>
      <MatchText style={{ color: '#FFC84B', fontSize: 12, fontWeight: '800' }}>♕ HOST</MatchText>
    </View>
  );
}
