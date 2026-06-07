import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, getNearbyFans } from '@/lib/api';
import { useDiscoveryStore } from '@/stores/discovery-store';
import type { ApiNearbyFan } from '@/types/api';

const fallbackFans = [
  {
    id: 'maya-rivera',
    name: 'Amir',
    area: 'Westside',
    distance: '0.4 km',
    vibe: 'Loud',
    rating: '4.9',
    initial: 'A',
    accent: '#66D8FF',
    secondary: '#9BFF62',
    host: true,
  },
  {
    id: 'samir-khan',
    name: 'Sofia',
    area: 'Old Town',
    distance: '0.9 km',
    vibe: 'Chill',
    rating: '4.8',
    initial: 'S',
    accent: '#FFB24E',
    secondary: '#FF6C78',
  },
  {
    id: 'jo-chen',
    name: 'Yara',
    area: 'Riverside',
    distance: '1.2 km',
    vibe: 'Family',
    rating: '5',
    initial: 'Y',
    accent: '#66D8FF',
    secondary: '#9D71FF',
    host: true,
  },
];

const presetRadii = [50, 100] as const;

const radarPoints = [
  { top: 22, left: 144, color: '#FF5978' },
  { top: 102, right: 108, color: '#FF5978' },
  { top: 182, right: 132, color: '#3ED9FF' },
  { top: 214, left: 118, color: '#9D71FF' },
];

export default function FansScreen() {
  const router = useRouter();
  const theme = useTheme();
  const anchor = useDiscoveryStore((state) => state.anchor);
  const applyCustomRadius = useDiscoveryStore((state) => state.applyCustomRadius);
  const customRadiusKm = useDiscoveryStore((state) => state.customRadiusKm);
  const radiusKm = useDiscoveryStore((state) => state.radiusKm);
  const setCustomRadiusKm = useDiscoveryStore((state) => state.setCustomRadiusKm);
  const setRadiusKm = useDiscoveryStore((state) => state.setRadiusKm);
  const [remoteFans, setRemoteFans] = useState<ApiNearbyFan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<null | string>(null);

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
  }, [anchor.latitude, anchor.longitude, radiusKm]);

  const cards = useMemo(() => {
    if (!remoteFans?.length) {
      return fallbackFans;
    }

    return remoteFans.map((fan) => ({
      id: fan.id,
      name: fan.displayName,
      area: fan.neighborhood,
      distance: `${fan.distanceKm.toFixed(1)} km`,
      vibe: fan.vibe,
      rating: fan.rating.toFixed(1),
      initial: fan.initial,
      accent: fan.vibe === 'Family' ? '#66D8FF' : fan.vibe === 'Chill' ? '#FFB24E' : '#66D8FF',
      secondary: fan.vibe === 'Family' ? '#9D71FF' : fan.vibe === 'Chill' ? '#FF6C78' : '#9BFF62',
      host: fan.isHost,
    }));
  }, [remoteFans]);

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
                        {fan.name}
                      </MatchText>
                      {fan.host ? <HostBadge /> : null}
                    </View>
                    <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                      {fan.area} · {fan.distance} ·
                    </MatchText>
                    <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                      {fan.vibe}
                    </MatchText>
                    <MatchText style={{ color: '#FFC84B', fontSize: 15, fontWeight: '800' }}>★ {fan.rating}</MatchText>
                  </View>

                  <View
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: 22,
                      backgroundColor: '#66D8FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MatchText variant="title" style={{ color: '#081018', fontSize: 24, lineHeight: 26, zIndex: 1 }}>
                      ☞
                    </MatchText>
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 22,
                        backgroundColor: theme.accent,
                        opacity: 0.7,
                      }}
                    />
                  </View>
                </View>
              </SurfaceCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </>
  );
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
