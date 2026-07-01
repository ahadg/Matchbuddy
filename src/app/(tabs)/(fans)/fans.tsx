import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, LoadingSurface, MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, getNearbyFans, sendWave } from '@/lib/api';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { useProfileStore } from '@/stores/profile-store';
import { useSocialStore } from '@/stores/social-store';
import type { ApiNearbyFan, ApiWaveStatus } from '@/types/api';

const fallbackFans = [
  {
    id: 'maya-rivera',
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
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

const discoveryNodes: Array<{ top: number; left?: number; right?: number }> = [
  { top: 14, left: 18 },
  { top: 18, right: 16 },
  { top: 58, right: 10 },
  { top: 68, left: 12 },
];

type FanCardModel = {
  id: string;
  avatarUrl: null | string;
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
  const insets = useSafeAreaInsets();
  const anchor = useDiscoveryStore((state) => state.anchor);
  const profile = useProfileStore((state) => state.profile);
  const profileLocation = useProfileStore((state) => state.profile?.location ?? null);
  const applyCustomRadius = useDiscoveryStore((state) => state.applyCustomRadius);
  const customRadiusKm = useDiscoveryStore((state) => state.customRadiusKm);
  const radiusKm = useDiscoveryStore((state) => state.radiusKm);
  const setCustomRadiusKm = useDiscoveryStore((state) => state.setCustomRadiusKm);
  const setRadiusKm = useDiscoveryStore((state) => state.setRadiusKm);
  const socialRevision = useSocialStore((state) => state.revision);
  const bumpSocialRevision = useSocialStore((state) => state.bumpRevision);
  const [remoteFans, setRemoteFans] = useState<ApiNearbyFan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<null | string>(null);
  const [activeWaveFanId, setActiveWaveFanId] = useState<null | string>(null);

  async function refreshNearbyFans() {
    if (loading || refreshing) {
      return;
    }

    setRefreshing(true);
    setApiError(null);

    try {
      const fans = await getNearbyFans({
        latitude: anchor.latitude,
        longitude: anchor.longitude,
        radiusKm,
        limit: 20,
      });

      setRemoteFans(fans);
    } catch (error) {
      if (!(error instanceof ApiConfigurationError)) {
        setApiError(error instanceof Error ? error.message : 'Could not refresh nearby fans.');
      }
    } finally {
      setRefreshing(false);
    }
  }

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
    if ((loading || refreshing) && remoteFans === null) {
      return [];
    }

    if (remoteFans === null) {
      return fallbackFans;
    }

    return remoteFans.map((fan) => ({
      id: fan.id,
      avatarUrl: fan.avatarUrl,
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
  }, [loading, refreshing, remoteFans]);

  const isInitialLoad = (loading || refreshing) && remoteFans === null;
  const isRefreshing = (loading || refreshing) && remoteFans !== null;
  const visibleFanCount = cards.length;
  const hostCount = cards.filter((card) => card.isHost).length;
  const mutualCount = cards.filter((card) => card.waveStatus === 'mutual').length;
  const suggestedRadiusKm = radiusKm < 100 ? 100 : Math.min(radiusKm + 50, 500);
  const locationLabel = profile?.neighborhood ?? profile?.city ?? 'your area';
  const anchorSummary =
    profile?.neighborhood && profile?.city
      ? `${profile.neighborhood}, ${profile.city}`
      : profileLocation
        ? `${profileLocation.latitude.toFixed(4)}, ${profileLocation.longitude.toFixed(4)}`
        : `${anchor.latitude.toFixed(4)}, ${anchor.longitude.toFixed(4)}`;
  const pulseSummary = isInitialLoad
    ? `Scanning the next ${radiusKm} km around ${locationLabel}`
    : `${locationLabel} • ${radiusKm} km radius`;
  const activityLine = mutualCount > 0
    ? `${hostCount} hosts active · ${mutualCount} mutual chats ready`
    : hostCount > 0
      ? `${hostCount} hosts active nearby`
      : 'Fresh matchday activity updates as new fans appear';
  const snapshotColors =
    cards.length > 0
      ? cards.slice(0, 4).map((card) => card.secondary)
      : ['#FF6C78', '#9BFF62', '#66D8FF', '#9D71FF'];

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
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refreshNearbyFans().catch(() => undefined);
            }}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor="#171D30"
          />
        }
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingTop: insets.top + Spacing.three,
          paddingBottom: BottomTabInset + 24,
        }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.three }}>
            <View style={{ gap: 4 }}>
              <MatchText variant="label" tone="muted" style={{ fontSize: 10, lineHeight: 13 }}>
                Discovery
              </MatchText>
              <MatchText variant="hero" style={{ fontSize: 29, lineHeight: 31 }}>
                Nearby
              </MatchText>
            </View>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 999,
                backgroundColor: 'rgba(168,245,109,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(168,245,109,0.24)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Pressable
                onPress={() => {
                  refreshNearbyFans().catch(() => undefined);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <MatchText variant="hero" style={{ color: theme.accent, fontSize: refreshing ? 13 : 18, lineHeight: refreshing ? 15 : 20 }}>
                  {refreshing ? '...' : '↻'}
                </MatchText>
              </Pressable>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <MatchText tone="muted" style={{ fontSize: 11, lineHeight: 14, marginRight: 2 }}>
              Radius
            </MatchText>
            {presetRadii.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setRadiusKm(preset)}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: radiusKm === preset ? 'rgba(160,255,97,0.18)' : 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: radiusKm === preset ? 'rgba(160,255,97,0.28)' : 'rgba(255,255,255,0.08)',
                  opacity: pressed ? 0.9 : 1,
                })}>
                <MatchText tone={radiusKm === preset ? 'accent' : 'default'} style={{ fontSize: 12, fontWeight: '700' }}>
                  {preset} km
                </MatchText>
              </Pressable>
            ))}

            <View
              style={{
                minWidth: 118,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 11,
                paddingVertical: 6,
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
                  fontSize: 12,
                  paddingVertical: 0,
                }}
                value={customRadiusKm}
                onChangeText={setCustomRadiusKm}
                onSubmitEditing={applyCustomRadius}
              />
              <Pressable onPress={applyCustomRadius}>
                <MatchText tone="accent" style={{ fontSize: 12, fontWeight: '800' }}>
                  Apply
                </MatchText>
              </Pressable>
            </View>
          </View>

          <SurfaceCard
              style={{
                padding: 16,
                borderRadius: 26,
                backgroundColor: '#171D30',
                borderColor: 'rgba(255,255,255,0.10)',
                gap: 12,
                overflow: 'hidden',
              }}>
            <View
              style={{
                position: 'absolute',
                left: -40,
                top: -28,
                width: 180,
                height: 180,
                borderRadius: 999,
                backgroundColor: 'rgba(160,255,97,0.08)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: -46,
                bottom: -56,
                width: 210,
                height: 210,
                borderRadius: 999,
                backgroundColor: 'rgba(157,113,255,0.09)',
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1, gap: 10 }}>
                <MatchText variant="label" tone="muted">
                  Matchday pulse
                </MatchText>
                <MatchText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>
                  {isInitialLoad ? `Scanning ${radiusKm} km` : `${visibleFanCount} fans around you`}
                </MatchText>
                <MatchText tone="muted" style={{ fontSize: 13, lineHeight: 18 }}>
                  {pulseSummary}
                </MatchText>
                <MatchText tone="muted" style={{ fontSize: 12, lineHeight: 16 }}>
                  {activityLine}
                </MatchText>
              </View>

              <View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 30,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                <View
                  style={{
                    position: 'absolute',
                    left: -10,
                    top: -12,
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    backgroundColor: 'rgba(160,255,97,0.14)',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    right: -16,
                    bottom: -12,
                    width: 84,
                    height: 84,
                    borderRadius: 999,
                    backgroundColor: 'rgba(157,113,255,0.12)',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: 22,
                    top: 22,
                    right: 22,
                    bottom: 22,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(160,255,97,0.16)',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: 34,
                    top: 34,
                    right: 34,
                    bottom: 34,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(160,255,97,0.12)',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: 32,
                    top: 32,
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: 'rgba(160,255,97,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MatchText variant="title" style={{ fontSize: 17, lineHeight: 19, color: theme.accent }}>
                    {isInitialLoad ? '…' : String(visibleFanCount)}
                  </MatchText>
                </View>
                {discoveryNodes.map((point, index) => (
                  <View
                    key={`${point.top}-${index}`}
                    style={{
                      position: 'absolute',
                      width: 13,
                      height: 13,
                      borderRadius: 999,
                      backgroundColor: snapshotColors[index] ?? '#66D8FF',
                      shadowColor: snapshotColors[index] ?? '#66D8FF',
                      shadowOpacity: 0.45,
                      shadowRadius: 10,
                      ...(point.top !== undefined ? { top: point.top } : {}),
                      ...(point.left !== undefined ? { left: point.left } : {}),
                      ...(point.right !== undefined ? { right: point.right } : {}),
                    }}
                  />
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <InsightChip label={isRefreshing ? 'Refreshing now' : 'Live sync'} accent />
              {hostCount > 0 ? <InsightChip label={`${hostCount} hosts nearby`} /> : null}
              {mutualCount > 0 ? <InsightChip label={`${mutualCount} chats unlocked`} accent /> : null}
            </View>
          </SurfaceCard>

          {isInitialLoad ? (
            <LoadingSurface
              title={`Scanning within ${radiusKm} km`}
              subtitle="Finding live fans around your saved location."
            />
          ) : null}

          {isRefreshing ? (
            <LoadingSurface
              compact
              title="Refreshing nearby fans"
              subtitle="Pulling the latest people in your selected radius."
            />
          ) : null}

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

          {!isInitialLoad && cards.length ? (
            cards.map((fan) => (
              <Pressable
                key={fan.id}
                onPress={() => router.push({ pathname: '/fan/[fanId]', params: { fanId: fan.id } })}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.96 : 1,
                  transform: [{ scale: pressed ? 0.995 : 1 }],
                })}>
                <SurfaceCard
                  style={{
                    padding: 15,
                    borderRadius: 24,
                    backgroundColor: '#171D30',
                    borderColor: 'rgba(255,255,255,0.10)',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Avatar name={fan.displayName} imageUrl={fan.avatarUrl} size={72} />
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

                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <MatchText variant="title" style={{ fontSize: 18, lineHeight: 21 }}>
                          {fan.displayName}
                        </MatchText>
                        {fan.isHost ? <HostBadge /> : null}
                      </View>
                      <MatchText tone="muted" style={{ fontSize: 13, lineHeight: 17 }}>
                        {fan.neighborhood} · {fan.distanceKm.toFixed(1)} km · {fan.vibe}
                      </MatchText>
                      <MatchText style={{ color: '#FFC84B', fontSize: 14, fontWeight: '800' }}>★ {fan.rating.toFixed(1)}</MatchText>
                    </View>

                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        handleWave(fan).catch(() => undefined);
                      }}
                      style={({ pressed }) => ({
                        width: 66,
                        height: 66,
                        borderRadius: 20,
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
                          fontSize: 13,
                          lineHeight: 16,
                          textAlign: 'center',
                        }}>
                        {activeWaveFanId === fan.id ? '...' : waveButtonLabel(fan.waveStatus)}
                      </MatchText>
                    </Pressable>
                  </View>
                </SurfaceCard>
              </Pressable>
            ))
          ) : !isInitialLoad ? (
            <SurfaceCard
              style={{
                padding: 18,
                borderRadius: 24,
                backgroundColor: '#171D30',
                borderColor: 'rgba(255,255,255,0.10)',
                overflow: 'hidden',
              }}>
              <View
                style={{
                  position: 'absolute',
                  right: -24,
                  top: -18,
                  width: 140,
                  height: 140,
                  borderRadius: 999,
                  backgroundColor: 'rgba(160,255,97,0.08)',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: -22,
                  bottom: -34,
                  width: 130,
                  height: 130,
                  borderRadius: 999,
                  backgroundColor: 'rgba(157,113,255,0.10)',
                }}
              />

              <View style={{ gap: 14 }}>
                <View
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 22,
                    backgroundColor: 'rgba(160,255,97,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(160,255,97,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      backgroundColor: theme.accent,
                    }}
                  />
                </View>

                <View style={{ gap: 8 }}>
                  <MatchText variant="title" style={{ fontSize: 20, lineHeight: 22 }}>
                    It&apos;s a little quiet nearby right now
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 13, lineHeight: 19 }}>
                    Sorry, we couldn&apos;t find any fans within {radiusKm} km of {anchorSummary}. Try widening your search radius, and keep notifications on so you don&apos;t miss fresh matchday activity nearby.
                  </MatchText>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      setRadiusKm(suggestedRadiusKm);
                    }}
                    style={({ pressed }) => ({
                      minHeight: 44,
                      paddingHorizontal: 15,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(160,255,97,0.14)',
                      borderWidth: 1,
                      borderColor: 'rgba(160,255,97,0.22)',
                      opacity: pressed ? 0.92 : 1,
                    })}>
                    <MatchText tone="accent" style={{ fontSize: 13, fontWeight: '800' }}>
                      Try {suggestedRadiusKm} km
                    </MatchText>
                  </Pressable>

                  <View
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 13,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}>
                    <MatchText tone="muted" style={{ fontSize: 12, fontWeight: '700' }}>
                      Current radius · {radiusKm} km
                    </MatchText>
                  </View>
                </View>
              </View>
            </SurfaceCard>
          ) : null}
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

function InsightChip({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: accent ? 'rgba(160,255,97,0.12)' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: accent ? 'rgba(160,255,97,0.18)' : 'rgba(255,255,255,0.10)',
      }}>
      <MatchText style={{ fontSize: 11, fontWeight: '700', color: accent ? '#B8FF7B' : undefined }}>{label}</MatchText>
    </View>
  );
}

function HostBadge() {
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 9,
        backgroundColor: 'rgba(255, 203, 72, 0.18)',
      }}>
      <MatchText style={{ color: '#FFC84B', fontSize: 11, fontWeight: '800' }}>♕ HOST</MatchText>
    </View>
  );
}
