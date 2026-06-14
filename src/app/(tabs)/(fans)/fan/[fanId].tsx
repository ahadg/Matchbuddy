import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';

import {
  ActionButton,
  AuroraBackdrop,
  Avatar,
  DetailRow,
  MatchText,
  MetricTile,
  Pill,
  QuickActionCard,
  SectionRow,
  SurfaceCard,
  TopBar,
} from '@/components/matchbuddy/ui';
import { reportCategoryOptions } from '@/constants/safety';
import { MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { fansById, worldCupFixtures } from '@/data/matchbuddy-data';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, blockFan, getFanById, rateFan, reportFan, sendWave } from '@/lib/api';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { useSocialStore } from '@/stores/social-store';
import type { ApiFanDetail, ApiReportCategory, ApiWaveStatus } from '@/types/api';
import type { FanProfile } from '@/types/matchbuddy';
import { formatDistance, setupSummary } from '@/utils/formatters';

export default function FanDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { fanId } = useLocalSearchParams<{ fanId: string }>();
  const anchor = useDiscoveryStore((state) => state.anchor);
  const socialRevision = useSocialStore((state) => state.revision);
  const bumpSocialRevision = useSocialStore((state) => state.bumpRevision);
  const fallbackFan = fanId ? fansById.get(fanId) : undefined;
  const [remoteFan, setRemoteFan] = useState<ApiFanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [actionError, setActionError] = useState<null | string>(null);
  const [ratingError, setRatingError] = useState<null | string>(null);
  const [sendingWave, setSendingWave] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showSafetyTools, setShowSafetyTools] = useState(false);
  const [reportCategory, setReportCategory] = useState<ApiReportCategory>('unsafe');
  const [safetyDetails, setSafetyDetails] = useState('');
  const [safetyError, setSafetyError] = useState<null | string>(null);
  const [safetySuccess, setSafetySuccess] = useState<null | string>(null);
  const [reportingFan, setReportingFan] = useState(false);
  const [blockingFan, setBlockingFan] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteFan() {
      if (!fanId || fallbackFan) {
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const fan = await getFanById(fanId, {
          latitude: anchor.latitude,
          longitude: anchor.longitude,
        });

        if (!cancelled) {
          setRemoteFan(fan);
        }
      } catch (error) {
        if (!cancelled) {
          if (!(error instanceof ApiConfigurationError)) {
            setLoadError(error instanceof Error ? error.message : 'Could not load this fan.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRemoteFan().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [anchor.latitude, anchor.longitude, fanId, fallbackFan, socialRevision]);

  const fan: FanProfile | undefined = useMemo(() => {
    if (fallbackFan) {
      return fallbackFan;
    }

    if (!remoteFan) {
      return undefined;
    }

    return {
      id: remoteFan.id,
      name: remoteFan.displayName,
      age: remoteFan.age,
      neighborhood: remoteFan.neighborhood,
      city: remoteFan.city,
      distanceKm: remoteFan.distanceKm,
      rating: remoteFan.rating,
      ratingCount: remoteFan.ratingCount,
      bio: remoteFan.bio,
      favouriteTeams: remoteFan.favouriteTeams,
      vibe: remoteFan.vibe,
      verified: remoteFan.verified,
      waveBackRate: remoteFan.waveBackRate,
      hostWins: remoteFan.hostWins,
      hasScreen: Boolean(remoteFan.setup),
      womenOnly: remoteFan.womenOnly,
      familyFriendly: remoteFan.familyFriendly,
      matchDayModeFixtureId: remoteFan.matchDayModeFixtureId ?? undefined,
      setup: remoteFan.setup ?? undefined,
    };
  }, [fallbackFan, remoteFan]);
  const fixture = fan?.matchDayModeFixtureId
    ? worldCupFixtures.find((item) => item.id === fan.matchDayModeFixtureId)
    : undefined;
  const waveStatus = remoteFan?.waveStatus ?? 'none';
  const directThreadId = remoteFan?.directThreadId ?? null;

  async function handlePrimaryAction() {
    if (!remoteFan) {
      return;
    }

    if (waveStatus === 'mutual' && directThreadId) {
      router.push({ pathname: '/chat/[threadId]', params: { threadId: directThreadId } });
      return;
    }

    if (waveStatus === 'pending') {
      return;
    }

    setSendingWave(true);
    setActionError(null);

    try {
      const result = await sendWave(remoteFan.id);
      setRemoteFan((current) =>
        current
          ? {
              ...current,
              waveStatus: result.status,
              directThreadId: result.threadId ?? current.directThreadId,
            }
          : current,
      );
      bumpSocialRevision();

      if (result.threadId && result.status === 'mutual') {
        router.push({ pathname: '/chat/[threadId]', params: { threadId: result.threadId } });
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not send your wave.');
    } finally {
      setSendingWave(false);
    }
  }

  async function handleRate(score: number) {
    if (!remoteFan || submittingRating) {
      return;
    }

    setSubmittingRating(true);
    setRatingError(null);

    try {
      const result = await rateFan(remoteFan.id, score);
      setRemoteFan((current) =>
        current
          ? {
              ...current,
              rating: result.rating,
              ratingCount: result.ratingCount,
              myRating: result.myRating,
            }
          : current,
      );
      bumpSocialRevision();
    } catch (error) {
      setRatingError(error instanceof Error ? error.message : 'Could not save your rating.');
    } finally {
      setSubmittingRating(false);
    }
  }

  async function handleReportFan() {
    if (!remoteFan || reportingFan) {
      return;
    }

    setReportingFan(true);
    setSafetyError(null);
    setSafetySuccess(null);

    try {
      await reportFan(remoteFan.id, {
        category: reportCategory,
        details: safetyDetails.trim() || undefined,
      });
      setSafetyDetails('');
      setSafetySuccess('Thanks. We saved your report and the team will review it.');
    } catch (error) {
      setSafetyError(error instanceof Error ? error.message : 'Could not send your report.');
    } finally {
      setReportingFan(false);
    }
  }

  async function handleBlockFan() {
    if (!remoteFan || blockingFan) {
      return;
    }

    setBlockingFan(true);
    setSafetyError(null);
    setSafetySuccess(null);

    try {
      await blockFan(remoteFan.id, safetyDetails.trim() || undefined);
      bumpSocialRevision();
      router.replace('/fans');
    } catch (error) {
      setSafetyError(error instanceof Error ? error.message : 'Could not block this fan.');
      setBlockingFan(false);
    }
  }

  function handleSafetyToggle() {
    if (!remoteFan) {
      setSafetyError('Safety tools unlock once this live profile finishes loading.');
      return;
    }

    setSafetyError(null);
    setSafetySuccess(null);
    setShowSafetyTools((current) => !current);
  }

  return (
    <>
      <Stack.Screen options={{ title: fan?.name ?? 'Fan profile' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingTop: Spacing.two,
          paddingBottom: 136,
        }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.four, position: 'relative' }}>
          <AuroraBackdrop compact />
          {!fan && loading ? (
            <SurfaceCard tone="default">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ActivityIndicator color={theme.accent} />
                <MatchText tone="muted">Loading fan profile…</MatchText>
              </View>
            </SurfaceCard>
          ) : !fan ? (
            <SurfaceCard tone="danger">
              <MatchText variant="subtitle">This fan is no longer visible.</MatchText>
              <MatchText tone="muted">
                They may have gone private, blocked you, or switched Match Day Mode off.
              </MatchText>
              {loadError ? (
                <MatchText tone="warm">
                  {loadError}
                </MatchText>
              ) : null}
            </SurfaceCard>
          ) : (
            <>
              <TopBar
                title={fan.name}
                subtitle={`${fan.neighborhood}, ${fan.city}`}
                trailing={<Pill tone="warm">{`★ ${fan.rating.toFixed(1)}`}</Pill>}
              />

              <SurfaceCard tone="default" style={{ minHeight: 320, padding: Spacing.four }}>
                <View
                  style={{
                    position: 'absolute',
                    right: -28,
                    top: -20,
                    width: 154,
                    height: 154,
                    borderRadius: 52,
                    backgroundColor: theme.warmSoft,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: -18,
                    bottom: -20,
                    width: 120,
                    height: 120,
                    borderRadius: 38,
                    backgroundColor: theme.violetSoft,
                  }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                  <Avatar name={fan.name} size={74} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                      <Pill tone={toneForVibe(fan.vibe)}>{fan.vibe}</Pill>
                      <Pill tone={fan.hasScreen ? 'accent' : 'default'}>
                        {fan.hasScreen ? 'Host setup ready' : 'Guest mode'}
                      </Pill>
                      {remoteFan ? <Pill tone={toneForWave(waveStatus)}>{waveCopy(waveStatus)}</Pill> : null}
                    </View>
                    <MatchText variant="title">
                      {fan.name}, {fan.age}
                    </MatchText>
                    <MatchText tone="muted">
                      {formatDistance(fan.distanceKm)} away · {fan.waveBackRate}% wave back rate
                    </MatchText>
                  </View>
                </View>

                <MatchText>{fan.bio}</MatchText>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                  {fan.favouriteTeams.map((team) => (
                    <Pill key={team} tone="default">
                      {team}
                    </Pill>
                  ))}
                  {fan.verified ? <Pill tone="warm">Verified 18+</Pill> : null}
                </View>

                <View
                  style={{
                    borderRadius: Radii.large,
                    padding: Spacing.three,
                    backgroundColor: theme.backgroundMuted,
                    gap: Spacing.one,
                  }}>
                  <MatchText variant="caption">Match Day Mode</MatchText>
                  <MatchText>
                    {fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : 'Open to upcoming watch plans'}
                  </MatchText>
                  <MatchText tone="muted">
                    {fixture ? fixture.highlight : 'Wave first and unlock chat only if the interest is mutual.'}
                  </MatchText>
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                  <View style={{ flex: 1 }}>
                    <ActionButton tone={toneForPrimaryAction(waveStatus)} onPress={handlePrimaryAction}>
                      {sendingWave ? 'Sending…' : primaryActionLabel(waveStatus)}
                    </ActionButton>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ActionButton tone={showSafetyTools ? 'danger' : remoteFan ? 'default' : 'muted'} onPress={handleSafetyToggle}>
                      {showSafetyTools ? 'Hide safety tools' : 'Block or report'}
                    </ActionButton>
                  </View>
                </View>
                {actionError ? <MatchText tone="warm">{actionError}</MatchText> : null}
                {safetyError ? <MatchText tone="warm">{safetyError}</MatchText> : null}
              </SurfaceCard>

              {showSafetyTools && remoteFan ? (
                <SurfaceCard tone="danger" style={{ gap: Spacing.three }}>
                  <View style={{ gap: 6 }}>
                    <MatchText variant="subtitle">Safety tools</MatchText>
                    <MatchText tone="muted">
                      Report abusive behavior, scams, or unsafe meetup vibes. Blocking removes this fan from nearby discovery and chat access.
                    </MatchText>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                    {reportCategoryOptions.map((option) => {
                      const selected = reportCategory === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setReportCategory(option.value)}
                          style={({ pressed }) => ({
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: selected ? theme.danger : theme.border,
                            backgroundColor: selected ? theme.dangerSoft : theme.backgroundElement,
                            opacity: pressed ? 0.92 : 1,
                          })}>
                          <MatchText tone={selected ? 'danger' : 'default'}>{option.label}</MatchText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View
                    style={{
                      borderRadius: Radii.large,
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundElement,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}>
                    <TextInput
                      multiline
                      value={safetyDetails}
                      onChangeText={setSafetyDetails}
                      placeholder="Optional details for the safety team or your block note"
                      placeholderTextColor={theme.textSecondary}
                      selectionColor={theme.accent}
                      style={{
                        minHeight: 64,
                        color: theme.text,
                        fontSize: 14,
                        lineHeight: 20,
                        textAlignVertical: 'top',
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <View style={{ flex: 1 }}>
                      <ActionButton tone="warm" onPress={() => handleReportFan().catch(() => undefined)}>
                        {reportingFan ? 'Sending…' : 'Send report'}
                      </ActionButton>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ActionButton tone="danger" onPress={() => handleBlockFan().catch(() => undefined)}>
                        {blockingFan ? 'Blocking…' : 'Block fan'}
                      </ActionButton>
                    </View>
                  </View>

                  {safetySuccess ? <MatchText tone="accent">{safetySuccess}</MatchText> : null}
                  <MatchText tone="muted">
                    Reviews happen after submission. For urgent safety issues, block immediately so this fan disappears from your experience.
                  </MatchText>
                </SurfaceCard>
              ) : null}

              {remoteFan ? (
                <SurfaceCard tone="warm" style={{ gap: Spacing.three }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <MatchText variant="subtitle">Rate this fan</MatchText>
                      <MatchText tone="muted">
                        {remoteFan.myRating
                          ? `Your rating: ${remoteFan.myRating}/5. Tap again any time to update it.`
                          : 'Leave a 1 to 5 star rating after you watch together.'}
                      </MatchText>
                    </View>
                    <Pill tone="warm">{`${fan.rating.toFixed(1)} avg`}</Pill>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                    {[1, 2, 3, 4, 5].map((score) => {
                      const isSelected = remoteFan.myRating === score;

                      return (
                        <Pressable
                          key={score}
                          disabled={submittingRating}
                          onPress={() => {
                            handleRate(score).catch(() => undefined);
                          }}
                          style={({ pressed }) => ({
                            minWidth: 56,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: isSelected ? theme.accent : theme.border,
                            backgroundColor: isSelected ? theme.accent : theme.backgroundElement,
                            opacity: pressed || submittingRating ? 0.78 : 1,
                            alignItems: 'center',
                          })}>
                          <MatchText
                            variant="bodyLarge"
                            style={{
                              color: isSelected ? theme.textInverted : theme.text,
                              fontSize: 16,
                              lineHeight: 18,
                              fontWeight: '800',
                            }}>
                            {`★ ${score}`}
                          </MatchText>
                        </Pressable>
                      );
                    })}
                  </View>

                  {submittingRating ? <MatchText tone="muted">Saving your rating…</MatchText> : null}
                  {ratingError ? <MatchText tone="warm">{ratingError}</MatchText> : null}
                </SurfaceCard>
              ) : null}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                <MetricTile label="Wave back" value={`${fan.waveBackRate}%`} tone="accent" />
                <MetricTile label="Host nights" value={`${fan.hostWins}`} tone="warm" />
                <MetricTile label="Ratings" value={`${fan.ratingCount}`} tone="danger" />
              </View>

              <View style={{ gap: Spacing.two }}>
                <SectionRow title="Why they fit" action="Trust first" />
                <SurfaceCard tone="accent">
                  <DetailRow label="Setup" value={setupSummary(fan)} />
                  <DetailRow label="Watching vibe" value={fan.vibe} />
                  <DetailRow label="Favourite teams" value={fan.favouriteTeams.join(' · ')} />
                  <DetailRow label="Public area" value={`${fan.neighborhood}, ${fan.city}`} />
                </SurfaceCard>
              </View>

              <View style={{ gap: Spacing.two }}>
                <SectionRow title="Before chat unlocks" action="3 steps" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
                  <QuickActionCard title="Wave stays private" subtitle="No name shown on the first tap" tone="accent" />
                  <QuickActionCard title="Mutual wave opens chat" subtitle="Message only after both say yes" tone="warm" />
                  <QuickActionCard title="Safety tools stay live" subtitle="Open profile anytime to block or report" tone="danger" />
                </ScrollView>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function toneForVibe(vibe: string) {
  if (vibe === 'Loud') {
    return 'accent' as const;
  }

  if (vibe === 'Family') {
    return 'warm' as const;
  }

  if (vibe === 'Women-only') {
    return 'danger' as const;
  }

  return 'default' as const;
}

function primaryActionLabel(status: ApiWaveStatus) {
  if (status === 'mutual') {
    return 'Open chat';
  }

  if (status === 'pending') {
    return 'Wave sent';
  }

  if (status === 'received') {
    return 'Wave back';
  }

  return 'Wave hello';
}

function toneForPrimaryAction(status: ApiWaveStatus) {
  if (status === 'received') {
    return 'warm' as const;
  }

  if (status === 'pending') {
    return 'default' as const;
  }

  return 'accent' as const;
}

function toneForWave(status: ApiWaveStatus) {
  if (status === 'mutual') {
    return 'accent' as const;
  }

  if (status === 'received') {
    return 'warm' as const;
  }

  if (status === 'pending') {
    return 'danger' as const;
  }

  return 'default' as const;
}

function waveCopy(status: ApiWaveStatus) {
  if (status === 'mutual') {
    return 'Chat unlocked';
  }

  if (status === 'received') {
    return 'Waved you first';
  }

  if (status === 'pending') {
    return 'Wave sent';
  }

  return 'Private first tap';
}
