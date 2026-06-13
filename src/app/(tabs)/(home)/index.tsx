import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ApiConfigurationError,
  getFixtures,
  getListings,
  getNearbyFans,
  upsertMyProfile,
} from '@/lib/api';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { useNotificationStore } from '@/stores/notification-store';
import { useProfileStore } from '@/stores/profile-store';
import type { ApiFixture, ApiListing } from '@/types/api';

const fallbackFixtures = [
  {
    id: 'fallback-opening-night',
    slug: 'fallback-opening-night',
    stage: 'Group Stage',
    kickoffAt: new Date().toISOString(),
    homeCode: 'MEX',
    homeTeam: 'Mexico',
    awayCode: 'RSA',
    awayTeam: 'South Africa',
    venue: 'Estadio Azteca',
    hostCity: 'Mexico City',
    highlight: 'Opening night energy in Mexico City.',
  },
  {
    id: 'fallback-canada',
    slug: 'fallback-canada',
    stage: 'Group Stage',
    kickoffAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    homeCode: 'CAN',
    homeTeam: 'Canada',
    awayCode: 'BIH',
    awayTeam: 'Bosnia and Herzegovina',
    venue: 'BMO Field',
    hostCity: 'Toronto',
    highlight: 'A sharp group-stage clash in Toronto.',
  },
  {
    id: 'fallback-usa',
    slug: 'fallback-usa',
    stage: 'Group Stage',
    kickoffAt: new Date(Date.now() + 1000 * 60 * 60 * 32).toISOString(),
    homeCode: 'USA',
    homeTeam: 'United States',
    awayCode: 'PAR',
    awayTeam: 'Paraguay',
    venue: 'SoFi Stadium',
    hostCity: 'Los Angeles',
    highlight: 'A home crowd test for the United States.',
  },
] satisfies ApiFixture[];

const flagByCode: Record<string, string> = {
  ALG: '🇩🇿',
  ARG: '🇦🇷',
  AUS: '🇦🇺',
  AUT: '🇦🇹',
  BEL: '🇧🇪',
  BIH: '🇧🇦',
  BRA: '🇧🇷',
  CAN: '🇨🇦',
  CIV: '🇨🇮',
  COD: '🇨🇩',
  COL: '🇨🇴',
  CPV: '🇨🇻',
  CRO: '🇭🇷',
  CUW: '🇨🇼',
  CZE: '🇨🇿',
  DZA: '🇩🇿',
  ECU: '🇪🇨',
  EGY: '🇪🇬',
  ENG: '🏴',
  ESP: '🇪🇸',
  FRA: '🇫🇷',
  GER: '🇩🇪',
  GHA: '🇬🇭',
  HAI: '🇭🇹',
  IRQ: '🇮🇶',
  IRN: '🇮🇷',
  JOR: '🇯🇴',
  JPN: '🇯🇵',
  KOR: '🇰🇷',
  KSA: '🇸🇦',
  MAR: '🇲🇦',
  MEX: '🇲🇽',
  NED: '🇳🇱',
  NOR: '🇳🇴',
  NZL: '🇳🇿',
  PAN: '🇵🇦',
  PAR: '🇵🇾',
  POR: '🇵🇹',
  QAT: '🇶🇦',
  RSA: '🇿🇦',
  SCO: '🏴',
  SEN: '🇸🇳',
  SUI: '🇨🇭',
  SWE: '🇸🇪',
  TUN: '🇹🇳',
  TUR: '🇹🇷',
  URU: '🇺🇾',
  USA: '🇺🇸',
  UZB: '🇺🇿',
};

type FixtureCardModel = {
  badge: string;
  badgeTrend: string;
  highlight: string;
  hot: boolean;
  listingIdentifier: null | string;
  nearbyFans: number;
  stage: string;
  timeLabel: string;
} & ApiFixture;

const PAGE_SIZE = 12;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const anchor = useDiscoveryStore((state) => state.anchor);
  const profile = useProfileStore((state) => state.profile);
  const refreshProfile = useProfileStore((state) => state.refresh);
  const notificationUnreadCount = useNotificationStore((state) => state.unreadCount);
  const refreshNotifications = useNotificationStore((state) => state.refresh);
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [fixtureListings, setFixtureListings] = useState<Record<string, ApiListing>>({});
  const [nearbyCounts, setNearbyCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [modeSaving, setModeSaving] = useState(false);
  const [modeError, setModeError] = useState<null | string>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lastLoadedContentHeight, setLastLoadedContentHeight] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      setLoading(true);
      setLoadError(null);

      try {
        const [nextFixtures, nextListings] = await Promise.all([
          getFixtures(),
          getListings({}),
        ]);

        if (!cancelled) {
          setFixtures(nextFixtures);
          setFixtureListings(
            nextListings.reduce<Record<string, ApiListing>>((map, listing) => {
              map[listing.fixtureId] = listing;
              return map;
            }, {}),
          );
        }
      } catch (error) {
        if (!cancelled) {
          if (!(error instanceof ApiConfigurationError)) {
            setLoadError(error instanceof Error ? error.message : 'Could not load the World Cup schedule.');
          }
          setFixtures([]);
          setFixtureListings({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSchedule().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshNotifications().catch(() => undefined);
      return undefined;
    }, [refreshNotifications]),
  );

  const schedule = fixtures.length ? fixtures : fallbackFixtures;
  const sortedSchedule = useMemo(
    () =>
      [...schedule].sort(
        (left, right) =>
          new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime(),
      ),
    [schedule],
  );

  const browseFixtures = useMemo(() => {
    const now = Date.now();
    const upcoming = sortedSchedule.filter((fixture) => {
      const kickoff = new Date(fixture.kickoffAt).getTime();
      return Number.isFinite(kickoff) && kickoff >= now - 1000 * 60 * 60 * 12;
    });

    return upcoming.length ? upcoming : sortedSchedule;
  }, [sortedSchedule]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredFixtures = useMemo(() => {
    if (!normalizedSearchQuery) {
      return browseFixtures;
    }

    return browseFixtures.filter((fixture) =>
      [
        fixture.homeTeam,
        fixture.awayTeam,
        fixture.homeCode,
        fixture.awayCode,
        fixture.stage,
        fixture.venue,
        fixture.hostCity,
        fixture.highlight,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchQuery),
    );
  }, [browseFixtures, normalizedSearchQuery]);

  const visibleFixtures = useMemo(
    () => filteredFixtures.slice(0, visibleCount),
    [filteredFixtures, visibleCount],
  );
  const hasMoreFixtures = visibleFixtures.length < filteredFixtures.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setLastLoadedContentHeight(0);
  }, [normalizedSearchQuery, browseFixtures.length]);

  useEffect(() => {
    setNearbyCounts({});
  }, [anchor.latitude, anchor.longitude]);

  useEffect(() => {
    let cancelled = false;

    async function loadNearbyCounts() {
      if (!fixtures.length || !visibleFixtures.length) {
        return;
      }

      const targets = visibleFixtures.filter((fixture) => nearbyCounts[fixture.id] == null);
      if (!targets.length) {
        return;
      }

      const results = await Promise.allSettled(
        targets.map(async (fixture) => {
          const nearby = await getNearbyFans({
            latitude: anchor.latitude,
            longitude: anchor.longitude,
            radiusKm: 100,
            fixtureId: fixture.id,
            limit: 50,
          });

          return [fixture.id, nearby.length] as const;
        }),
      );

      if (cancelled) {
        return;
      }

      setNearbyCounts((current) => {
        const next = { ...current };

        for (const result of results) {
          if (result.status === 'fulfilled') {
            next[result.value[0]] = result.value[1];
          }
        }

        return next;
      });
    }

    loadNearbyCounts().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [anchor.latitude, anchor.longitude, fixtures.length, nearbyCounts, visibleFixtures]);

  const activeFixture = useMemo(() => {
    if (!profile?.matchDayModeFixtureId) {
      return null;
    }

    return sortedSchedule.find((fixture) => fixture.id === profile.matchDayModeFixtureId) ?? null;
  }, [profile?.matchDayModeFixtureId, sortedSchedule]);

  const heroFixture = activeFixture ?? browseFixtures[0] ?? null;
  const matchDayEnabled = Boolean(profile?.matchDayModeFixtureId);

  const cards = useMemo<FixtureCardModel[]>(
    () =>
      visibleFixtures.map((fixture, index) => {
        const isHeroFixture = heroFixture?.id === fixture.id;

        return {
          ...fixture,
          badge:
            isHeroFixture
              ? matchDayEnabled
                ? 'Match day pick'
                : 'Next kickoff'
              : normalizedSearchQuery
                ? 'Search result'
                : index < 3
                  ? 'Upcoming'
                  : 'Scheduled',
          badgeTrend: fixture.hostCity,
          highlight: fixture.highlight,
          hot: isHeroFixture || (!normalizedSearchQuery && index === 0),
          listingIdentifier: fixtureListings[fixture.id]?.slug ?? fixtureListings[fixture.id]?.id ?? null,
          nearbyFans: nearbyCounts[fixture.id] ?? 0,
          stage: fixture.stage,
          timeLabel: formatFixtureTime(fixture.kickoffAt),
        };
      }),
    [fixtureListings, heroFixture?.id, matchDayEnabled, nearbyCounts, normalizedSearchQuery, visibleFixtures],
  );

  async function handleMatchDayToggle() {
    if (!heroFixture) {
      return;
    }

    if (!profile) {
      router.push('/profile-setup');
      return;
    }

    setModeSaving(true);
    setModeError(null);

    try {
      await upsertMyProfile({
        matchDayModeFixtureId: matchDayEnabled ? null : heroFixture.id,
      });
      await refreshProfile();
    } catch (error) {
      setModeError(error instanceof Error ? error.message : 'Could not update Match Day Mode.');
    } finally {
      setModeSaving(false);
    }
  }

  function openFixture(card: FixtureCardModel) {
    if (card.listingIdentifier) {
      router.push({ pathname: '/listing/[listingId]', params: { listingId: card.listingIdentifier } });
      return;
    }

    router.push('/listings');
  }

  function handleSearchToggle() {
    setSearchOpen((current) => {
      const next = !current;
      if (!next) {
        setSearchQuery('');
      }

      return next;
    });
  }

  function handleLoadMore() {
    if (!hasMoreFixtures) {
      return;
    }

    setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredFixtures.length));
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Fixtures' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 280;

          if (nearBottom && contentSize.height !== lastLoadedContentHeight) {
            setLastLoadedContentHeight(contentSize.height);
            handleLoadMore();
          }
        }}
        scrollEventThrottle={16}
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingTop: insets.top + 10,
          paddingBottom: BottomTabInset + 24,
        }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 18 }}>
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: -38,
              width: 148,
              height: 148,
              borderRadius: 72,
              backgroundColor: 'rgba(157,123,255,0.08)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 92,
              right: -18,
              width: 170,
              height: 170,
              borderRadius: 82,
              backgroundColor: 'rgba(160,255,97,0.06)',
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: Spacing.three,
            }}>
            <View style={{ gap: 4 }}>
              <MatchText variant="label" tone="muted">
                Matchday · Jun
              </MatchText>
              <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
                Fixtures
              </MatchText>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <CircleAction
                onPress={handleSearchToggle}
                symbolName={
                  searchOpen
                    ? { ios: 'xmark', android: 'close', web: 'close' }
                    : { ios: 'magnifyingglass', android: 'search', web: 'search' }
                }
              />
              <CircleAction
                onPress={() => {
                  router.push('/notifications');
                }}
                badgeLabel={
                  notificationUnreadCount > 0
                    ? notificationUnreadCount > 99
                      ? '99+'
                      : String(notificationUnreadCount)
                    : null
                }
                symbolName={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
              />
            </View>
          </View>

          {searchOpen ? (
            <SurfaceCard
              style={{
                borderRadius: 24,
                paddingHorizontal: 14,
                paddingVertical: 12,
                backgroundColor: '#141A2B',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MatchSymbol
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  color="rgba(235,238,244,0.68)"
                  size={18}
                />
                <TextInput
                  autoFocus
                  onChangeText={setSearchQuery}
                  placeholder="Search fixtures, teams, city, or stage"
                  placeholderTextColor="rgba(235,238,244,0.45)"
                  returnKeyType="search"
                  selectionColor={theme.accent}
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontFamily: Fonts.sans,
                    fontSize: 14,
                    fontWeight: '600',
                    paddingVertical: 2,
                  }}
                  value={searchQuery}
                />
                {searchQuery ? (
                  <Pressable
                    hitSlop={10}
                    onPress={() => {
                      setSearchQuery('');
                    }}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.72 : 1,
                    })}>
                    <MatchSymbol
                      name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                      color="rgba(235,238,244,0.56)"
                      size={18}
                    />
                  </Pressable>
                ) : null}
              </View>
            </SurfaceCard>
          ) : null}

          <View
            style={{
              borderRadius: 28,
              padding: 2,
              backgroundColor: 'rgba(214, 104, 255, 0.95)',
            }}>
            <View
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                padding: 14,
                minHeight: 148,
                backgroundColor: '#1A2032',
                borderWidth: 1,
                borderColor: 'rgba(190,255,105,0.55)',
              }}>
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 16,
                  bottom: -18,
                  width: 148,
                  height: 118,
                  borderRadius: 44,
                  backgroundColor: 'rgba(72,255,192,0.12)',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  right: -10,
                  top: -14,
                  width: 166,
                  height: 128,
                  borderRadius: 48,
                  backgroundColor: 'rgba(166,255,97,0.12)',
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      backgroundColor: '#66D8FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MatchSymbol
                      name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
                      color="#0C1320"
                      size={30}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        backgroundColor: theme.accent,
                        borderWidth: 3,
                        borderColor: '#233047',
                      }}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <MatchText variant="title" style={{ fontSize: 23, lineHeight: 26 }}>
                      Match Day Mode
                    </MatchText>
                    <MatchText
                      style={{
                        color: 'rgba(235,237,244,0.72)',
                        fontSize: 14,
                        lineHeight: 20,
                      }}>
                      {heroFixture
                        ? `${matchDayEnabled ? 'Visible for' : 'Ready for'} ${heroFixture.homeCode}-${heroFixture.awayCode} · ${formatTimeUntil(heroFixture.kickoffAt)}`
                        : 'No upcoming fixtures loaded yet'}
                    </MatchText>
                  </View>
                </View>

                <ModeToggle
                  enabled={matchDayEnabled}
                  loading={modeSaving}
                  onPress={() => {
                    handleMatchDayToggle().catch(() => undefined);
                  }}
                />
              </View>

              <View style={{ marginTop: 14, flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <MetaPill
                  label={
                    heroFixture
                      ? `${heroFixture.homeCode} vs ${heroFixture.awayCode}`
                      : 'Pick a fixture'
                  }
                />
                <MetaPill
                  accent
                  label={
                    heroFixture
                      ? `${nearbyCounts[heroFixture.id] ?? 0} nearby`
                      : 'Nearby soon'
                  }
                />
                {heroFixture ? <MetaPill label={heroFixture.stage} /> : null}
              </View>
            </View>
          </View>

          {modeError ? (
            <SurfaceCard tone="warm" style={{ borderRadius: 24 }}>
              <MatchText tone="warm">{modeError}</MatchText>
            </SurfaceCard>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: Spacing.two,
              flexWrap: 'wrap',
            }}>
            <View style={{ gap: 2, flex: 1, minWidth: 0 }}>
              <MatchText variant="title" style={{ fontSize: 24, lineHeight: 26 }}>
                World Cup 2026
              </MatchText>
              <MatchText tone="muted" style={{ fontSize: 13 }}>
                {normalizedSearchQuery
                  ? `Showing ${filteredFixtures.length} fixture${filteredFixtures.length === 1 ? '' : 's'} for "${searchQuery.trim()}"`
                  : 'Browse the full schedule and keep scrolling for more'}
              </MatchText>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(160,255,97,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(160,255,97,0.18)',
                flexShrink: 0,
                alignSelf: 'flex-start',
              }}>
              <MatchText
                variant="caption"
                tone="accent"
                style={{ fontSize: 12, textAlign: 'center' }}>
                {filteredFixtures.length
                  ? `${Math.min(visibleFixtures.length, filteredFixtures.length)} / ${filteredFixtures.length}`
                  : fixtures.length
                    ? '0 found'
                    : 'Preview'}
              </MatchText>
            </View>
          </View>

          {loading && !fixtures.length ? (
            <SurfaceCard style={{ borderRadius: 24, padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={theme.accent} />
                <MatchText tone="muted">Loading the official schedule…</MatchText>
              </View>
            </SurfaceCard>
          ) : null}

          {loadError ? (
            <SurfaceCard tone="warm" style={{ borderRadius: 24 }}>
              <MatchText tone="warm">{loadError}</MatchText>
            </SurfaceCard>
          ) : null}

          {!loading && !filteredFixtures.length ? (
            <SurfaceCard style={{ borderRadius: 24, padding: 20 }}>
              <View style={{ gap: 6 }}>
                <MatchText variant="subtitle">No fixtures matched your search.</MatchText>
                <MatchText tone="muted">
                  Try a team name, city, stadium, or tournament stage.
                </MatchText>
              </View>
            </SurfaceCard>
          ) : null}

          <View style={{ gap: 16 }}>
            {cards.map((fixture) => (
              <Pressable
                key={fixture.id}
                onPress={() => openFixture(fixture)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.95 : 1,
                  transform: [{ scale: pressed ? 0.995 : 1 }],
                })}>
                <SurfaceCard
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderRadius: 28,
                    backgroundColor: '#151B2D',
                    borderColor: 'rgba(255,255,255,0.10)',
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: fixture.hot ? 46 : 20,
                      right: -22,
                      width: 134,
                      height: 134,
                      borderRadius: 68,
                      backgroundColor: fixture.hot ? 'rgba(255, 94, 120, 0.14)' : 'rgba(101, 215, 255, 0.12)',
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      left: -26,
                      bottom: -38,
                      width: 128,
                      height: 98,
                      borderRadius: 50,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                  />

                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: fixture.hot ? 'rgba(255, 88, 120, 0.18)' : 'rgba(255,255,255,0.04)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <MatchSymbol
                      name={fixture.hot ? { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' } : { ios: 'calendar', android: 'calendar_today', web: 'calendar_month' }}
                      color={fixture.hot ? '#FF5E78' : 'rgba(235,238,244,0.72)'}
                      size={15}
                    />
                    <MatchText
                      variant="caption"
                      style={{
                        color: fixture.hot ? '#FF5E78' : 'rgba(235,238,244,0.72)',
                        fontSize: 13,
                        fontWeight: '800',
                      }}>
                      {fixture.badge.toUpperCase()}
                    </MatchText>
                    <View
                      style={{
                        marginLeft: 'auto',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                      <MatchSymbol
                        name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                        color={fixture.hot ? '#FF8B63' : 'rgba(235,238,244,0.72)'}
                        size={14}
                      />
                      <MatchText
                        variant="caption"
                        style={{
                          color: fixture.hot ? '#FF8B63' : 'rgba(235,238,244,0.72)',
                          fontSize: 13,
                          fontWeight: '700',
                        }}>
                        {fixture.badgeTrend}
                      </MatchText>
                    </View>
                  </View>

                  <View style={{ padding: 16, gap: 14 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: Spacing.two,
                      }}>
                      <MatchText
                        variant="label"
                        tone="muted"
                        style={{ fontSize: 14, color: 'rgba(235,238,244,0.72)' }}>
                        {fixture.stage}
                      </MatchText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <MatchSymbol
                          name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
                          color="rgba(235,238,244,0.72)"
                          size={15}
                        />
                        <MatchText tone="muted" style={{ fontSize: 14, color: 'rgba(235,238,244,0.8)' }}>
                          {fixture.timeLabel}
                        </MatchText>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                      }}>
                      <TeamBadge
                        emblem={flagForCode(fixture.homeCode)}
                        code={fixture.homeCode}
                        fallbackLabel={fixture.homeTeam}
                      />
                      <MatchText variant="subtitle" tone="muted" style={{ fontSize: 18 }}>
                        VS
                      </MatchText>
                      <TeamBadge
                        emblem={flagForCode(fixture.awayCode)}
                        code={fixture.awayCode}
                        fallbackLabel={fixture.awayTeam}
                      />
                    </View>

                    <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
                      {fixture.highlight}
                    </MatchText>

                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <MatchSymbol
                          name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                          color="rgba(235,238,244,0.72)"
                          size={15}
                        />
                        <MatchText tone="muted" style={{ fontSize: 14 }} numberOfLines={1}>
                          {fixture.venue}
                        </MatchText>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                          borderRadius: 999,
                          backgroundColor: 'rgba(160,255,97,0.10)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                        <MatchSymbol
                          name={{ ios: 'person.2.fill', android: 'groups', web: 'groups' }}
                          color={theme.accent}
                          size={15}
                        />
                        <MatchText tone="accent" style={{ fontSize: 13, fontWeight: '800' }}>
                          {fixture.nearbyFans} nearby
                        </MatchText>
                      </View>
                    </View>
                  </View>
                </SurfaceCard>
              </Pressable>
            ))}

            {filteredFixtures.length ? (
              <View style={{ alignItems: 'center', paddingBottom: 4 }}>
                <MatchText tone="muted" style={{ textAlign: 'center' }}>
                  {hasMoreFixtures
                    ? `Scroll for more fixtures · ${visibleFixtures.length} of ${filteredFixtures.length} loaded`
                    : normalizedSearchQuery
                      ? `Showing all ${filteredFixtures.length} search result${filteredFixtures.length === 1 ? '' : 's'}`
                      : `All ${filteredFixtures.length} fixtures loaded`}
                </MatchText>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function ModeToggle({
  enabled,
  loading,
  onPress,
}: {
  enabled: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => ({
        width: 82,
        height: 50,
        borderRadius: 999,
        backgroundColor: enabled ? '#9BFF62' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: enabled ? 'rgba(184,255,97,0.32)' : 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        paddingHorizontal: 6,
        opacity: pressed || loading ? 0.94 : 1,
      })}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          marginLeft: enabled ? 'auto' : 0,
          backgroundColor: enabled ? '#101624' : 'rgba(255,255,255,0.16)',
          borderWidth: 1,
          borderColor: enabled ? 'rgba(184,255,97,0.6)' : 'rgba(255,255,255,0.10)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {loading ? (
          <ActivityIndicator color={enabled ? '#9BFF62' : theme.text} size="small" />
        ) : (
          <MatchSymbol
            name={
              enabled
                ? { ios: 'checkmark', android: 'check', web: 'check' }
                : { ios: 'circle.fill', android: 'radio_button_checked', web: 'radio_button_checked' }
            }
            color={enabled ? '#9BFF62' : 'rgba(255,255,255,0.6)'}
            size={enabled ? 18 : 14}
          />
        )}
      </View>
    </Pressable>
  );
}

function MetaPill({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: accent ? 'rgba(160,255,97,0.12)' : 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: accent ? 'rgba(160,255,97,0.18)' : 'rgba(255,255,255,0.08)',
      }}>
      <MatchText
        variant="caption"
        tone={accent ? 'accent' : 'default'}
        style={{ fontSize: 12, fontWeight: '700' }}>
        {label}
      </MatchText>
    </View>
  );
}

function CircleAction({
  symbolName,
  accentDot = false,
  badgeLabel = null,
  onPress,
}: {
  symbolName: any;
  accentDot?: boolean;
  badgeLabel?: null | string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 64,
        height: 64,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: pressed ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.92 : 1,
      })}>
      <MatchSymbol name={symbolName} size={23} />
      {badgeLabel ? (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 8,
            minWidth: 20,
            height: 20,
            borderRadius: 999,
            paddingHorizontal: 5,
            backgroundColor: '#FF5E78',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <MatchText
            variant="caption"
            style={{ color: '#FFF6F8', fontSize: 10, lineHeight: 12, fontWeight: '800' }}>
            {badgeLabel}
          </MatchText>
        </View>
      ) : accentDot ? (
        <View
          style={{
            position: 'absolute',
            top: 15,
            right: 15,
            width: 11,
            height: 11,
            borderRadius: 999,
            backgroundColor: '#FF5E78',
          }}
        />
      ) : null}
    </Pressable>
  );
}

function TeamBadge({
  emblem,
  code,
  fallbackLabel,
}: {
  emblem: null | string;
  code: string;
  fallbackLabel: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 10, flex: 1 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          backgroundColor: 'rgba(255,255,255,0.05)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
        }}>
        {emblem ? (
          <MatchText variant="hero" style={{ fontSize: 30, lineHeight: 32 }}>
            {emblem}
          </MatchText>
        ) : (
          <MatchText
            variant="title"
            style={{ fontSize: code.length > 3 ? 18 : 24, lineHeight: 26, textAlign: 'center' }}>
            {code}
          </MatchText>
        )}
      </View>
      <MatchText variant="subtitle" style={{ fontSize: 16, letterSpacing: 1 }}>
        {code}
      </MatchText>
      {!emblem ? (
        <MatchText tone="muted" style={{ fontSize: 11, textAlign: 'center' }} numberOfLines={2}>
          {fallbackLabel}
        </MatchText>
      ) : null}
    </View>
  );
}

function MatchSymbol({
  name,
  color,
  size = 18,
}: {
  name: any;
  color?: string;
  size?: number;
}) {
  const theme = useTheme();

  return <SymbolView name={name} size={size} tintColor={color ?? theme.text} type="monochrome" />;
}

function flagForCode(code: string) {
  return flagByCode[code] ?? null;
}

function formatFixtureTime(kickoffAt: string) {
  const kickoff = new Date(kickoffAt);

  if (Number.isNaN(kickoff.getTime())) {
    return 'Kickoff TBD';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const fixtureDay = new Date(kickoff.getFullYear(), kickoff.getMonth(), kickoff.getDate());
  const time = kickoff.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (fixtureDay.getTime() === today.getTime()) {
    return `Today · ${time}`;
  }

  if (fixtureDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow · ${time}`;
  }

  return `${kickoff.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })} · ${time}`;
}

function formatTimeUntil(kickoffAt: string) {
  const deltaMs = new Date(kickoffAt).getTime() - Date.now();

  if (!Number.isFinite(deltaMs)) {
    return 'Kickoff soon';
  }

  if (deltaMs <= 0) {
    return 'Live now';
  }

  const totalHours = Math.round(deltaMs / (1000 * 60 * 60));

  if (totalHours < 24) {
    return `${Math.max(1, totalHours)}h left`;
  }

  const totalDays = Math.round(deltaMs / (1000 * 60 * 60 * 24));
  return `${Math.max(1, totalDays)}d left`;
}
