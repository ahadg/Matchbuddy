import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { ActionButton, MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, getListingById, requestListingSpot } from '@/lib/api';
import { useDiscoveryStore } from '@/stores/discovery-store';
import { useSocialStore } from '@/stores/social-store';
import type { ApiListingDetail, ApiListingRequestStatus } from '@/types/api';

export default function ListingDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const anchor = useDiscoveryStore((state) => state.anchor);
  const socialRevision = useSocialStore((state) => state.revision);
  const bumpSocialRevision = useSocialStore((state) => state.bumpRevision);
  const [listing, setListing] = useState<ApiListingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [requestingSpot, setRequestingSpot] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadListing() {
      if (!listingId) {
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const remoteListing = await getListingById(listingId, {
          latitude: anchor.latitude,
          longitude: anchor.longitude,
        });

        if (!cancelled) {
          setListing(remoteListing);
        }
      } catch (error) {
        if (!cancelled) {
          if (!(error instanceof ApiConfigurationError)) {
            setLoadError(error instanceof Error ? error.message : 'Could not load this room.');
          }
          setListing(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadListing().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [anchor.latitude, anchor.longitude, listingId, socialRevision]);

  const ctaLabel = useMemo(() => {
    if (!listing) {
      return 'Request a spot';
    }

    if (listing.isHost || listing.canOpenRoom) {
      return 'Open room';
    }

    if (!listing.isOpen || listing.spotsLeft === 0) {
      return 'Room full';
    }

    if (listing.myRequestStatus === 'pending') {
      return 'Request pending';
    }

    if (listing.myRequestStatus === 'declined') {
      return 'Request again';
    }

    return 'Request a spot';
  }, [listing]);

  async function handlePrimaryAction() {
    if (!listing) {
      return;
    }

    if (listing.isHost || listing.canOpenRoom) {
      router.push({ pathname: '/room/[listingId]', params: { listingId: listing.id } });
      return;
    }

    if (!listing.isOpen || listing.spotsLeft === 0 || listing.myRequestStatus === 'pending') {
      return;
    }

    setRequestingSpot(true);
    setLoadError(null);

    try {
      const joinRequest = await requestListingSpot(listing.id);
      const nextStatus = normalizeJoinStatus(joinRequest.status);
      setListing((current) =>
        current
          ? {
              ...current,
              myRequestStatus: nextStatus,
              canOpenRoom: nextStatus === 'approved',
              approvedGuests: nextStatus === 'approved' && current.myRequestStatus !== 'approved'
                ? current.approvedGuests + 1
                : current.approvedGuests,
              spotsLeft:
                nextStatus === 'approved' && current.myRequestStatus !== 'approved'
                  ? Math.max(0, current.spotsLeft - 1)
                  : current.spotsLeft,
            }
          : current,
      );
      bumpSocialRevision();

      if (joinRequest.status === 'approved') {
        router.push({ pathname: '/room/[listingId]', params: { listingId: listing.id } });
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not request this room.');
    } finally {
      setRequestingSpot(false);
    }
  }

  const vibeScore = listing ? Math.max(1, Math.min(10, Math.round(listing.hostRating * 2))) : 0;

  return (
    <>
      <Stack.Screen options={{ title: listing?.hostName ?? 'Listing detail' }} />
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 150 }}>
          <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
            <View
              style={{
                minHeight: 424,
                overflow: 'hidden',
                backgroundColor: '#171B2A',
              }}>
              <View style={{ position: 'absolute', left: 58, top: 118, width: 108, height: 108, borderRadius: 56, backgroundColor: 'rgba(160,255,97,0.20)' }} />
              <View style={{ position: 'absolute', right: 26, top: 132, width: 146, height: 138, borderRadius: 72, backgroundColor: 'rgba(255,141,98,0.22)' }} />
              <View style={{ position: 'absolute', left: 204, top: 62, width: 138, height: 138, borderRadius: 68, backgroundColor: 'rgba(157,123,255,0.22)' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 156, backgroundColor: theme.background }} />

              <View style={{ paddingHorizontal: Spacing.three, paddingTop: 18, gap: 22 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Pressable onPress={() => router.back()}>
                    <CircleIcon label="✕" />
                  </Pressable>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <CircleIcon label="♡" warm />
                    <CircleIcon label="⋯" coral />
                  </View>
                </View>

                <View style={{ marginTop: 146, gap: 14 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    <Badge label={listing?.vibe === 'Loud' ? '🔥 LOUD & ROWDY' : `${listing?.vibe ?? 'WATCH PARTY'}`.toUpperCase()} tone="hot" />
                    <Badge label={listing?.fixtureStage?.toUpperCase() ?? 'TONIGHT'} tone="dark" />
                  </View>

                  {loading && !listing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <ActivityIndicator color={theme.accent} />
                      <MatchText tone="muted">Loading room…</MatchText>
                    </View>
                  ) : listing ? (
                    <View style={{ gap: 6 }}>
                      <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
                        {listing.hostName}&apos;s room
                      </MatchText>
                      <MatchText style={{ fontSize: 18, lineHeight: 24 }}>
                        {listing.homeCode} {` `}
                        {listing.homeTeam}{' '}
                        vs {listing.awayTeam} {listing.awayCode} · {listing.fixtureStage}
                      </MatchText>
                    </View>
                  ) : (
                    <View style={{ gap: 6 }}>
                      <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
                        Room unavailable
                      </MatchText>
                      <MatchText style={{ fontSize: 18, lineHeight: 24 }}>
                        {loadError ?? 'This listing could not be loaded right now.'}
                      </MatchText>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {listing ? (
              <View style={{ paddingHorizontal: Spacing.three, paddingTop: 16, gap: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <AvatarTile initial={listing.hostInitial} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MatchText variant="title" style={{ fontSize: 26, lineHeight: 28 }}>
                        {listing.hostName}
                      </MatchText>
                      {listing.hostVerified ? (
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            backgroundColor: theme.accent,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <MatchText variant="title" style={{ color: '#0B121A', fontSize: 17, lineHeight: 17 }}>
                            ✓
                          </MatchText>
                        </View>
                      ) : null}
                    </View>
                    <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                      ★ {listing.hostRating.toFixed(1)} · {listing.hostHostWins} watches hosted
                    </MatchText>
                    <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                      {listing.neighborhood} · {listing.distanceKm?.toFixed(1) ?? '--'} km
                    </MatchText>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <StatPill label="SPOTS" value={`${listing.spotsLeft}/${listing.maxGuests}`} note="left" accent />
                  <StatPill label="VIBE" value={`${vibeScore}/10`} note="rated" />
                  <StatPill
                    label="SCREEN"
                    value={listing.hostSetup?.screenSize ?? 'Shared'}
                    note={listing.hostSetup?.displayType ?? 'No TV listed'}
                  />
                </View>

                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                <View style={{ gap: 14 }}>
                  <MatchText variant="title" style={{ fontSize: 22, lineHeight: 24 }}>
                    Extras
                  </MatchText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {listing.extras.map((extra) => (
                      <Chip key={extra} label={extra} />
                    ))}
                  </View>
                </View>

                <View style={{ gap: 14 }}>
                  <MatchText variant="title" style={{ fontSize: 22, lineHeight: 24 }}>
                    House rules
                  </MatchText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {listing.houseRules.map((rule) => (
                      <Chip key={rule} label={rule} muted />
                    ))}
                  </View>
                </View>

                <SurfaceCard
                  style={{
                    borderRadius: 26,
                    padding: 18,
                    backgroundColor: '#151B2D',
                    borderColor: 'rgba(255,255,255,0.10)',
                    gap: 10,
                  }}>
                  <MatchText variant="title" style={{ fontSize: 20, lineHeight: 22 }}>
                    Host note
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
                    {listing.joinMessage || listing.hostBio}
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 13 }}>
                    Venue: {listing.venue}
                  </MatchText>
                </SurfaceCard>

                {loadError ? <MatchText tone="warm">{loadError}</MatchText> : null}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            paddingHorizontal: Spacing.three,
            paddingBottom: 12,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: MaxContentWidth,
              borderRadius: 28,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
              backgroundColor: 'rgba(40,46,62,0.96)',
            }}>
            <View style={{ position: 'absolute', left: 18, bottom: -26, width: 180, height: 120, borderRadius: 56, backgroundColor: 'rgba(160,255,97,0.10)' }} />
            <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ minWidth: 110, gap: 3 }}>
                <MatchText variant="label" tone="muted" style={{ fontSize: 14 }}>
                  Per head
                </MatchText>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <MatchText variant="hero" style={{ fontSize: 30, lineHeight: 32 }}>
                    {listing?.priceNote?.split('·')[0]?.trim() ?? 'Free'}
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 14 }}>
                    {listing?.priceNote?.includes('·') ? `· ${listing.priceNote.split('·').slice(1).join('·').trim()}` : ''}
                  </MatchText>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton tone={ctaToneForListing(listing)} onPress={handlePrimaryAction}>
                  {requestingSpot ? 'Working…' : ctaLabel}
                </ActionButton>
              </View>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

function normalizeJoinStatus(status: string): ApiListingRequestStatus {
  if (status === 'approved' || status === 'pending' || status === 'declined' || status === 'cancelled') {
    return status;
  }

  return 'none';
}

function ctaToneForListing(listing: ApiListingDetail | null) {
  if (!listing) {
    return 'default' as const;
  }

  if (listing.isHost || listing.canOpenRoom) {
    return 'accent' as const;
  }

  if (listing.myRequestStatus === 'pending') {
    return 'default' as const;
  }

  if (!listing.isOpen || listing.spotsLeft === 0) {
    return 'muted' as const;
  }

  if (listing.myRequestStatus === 'declined') {
    return 'warm' as const;
  }

  return 'accent' as const;
}

function CircleIcon({ label, warm = false, coral = false }: { label: string; warm?: boolean; coral?: boolean }) {
  return (
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: warm ? 'rgba(171, 73, 173, 0.34)' : coral ? 'rgba(161, 60, 88, 0.34)' : 'rgba(255,255,255,0.12)',
      }}>
      <MatchText variant="title" style={{ fontSize: 24, lineHeight: 24 }}>
        {label}
      </MatchText>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: 'hot' | 'dark' }) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: tone === 'hot' ? '#FF5872' : 'rgba(255,255,255,0.10)',
      }}>
      <MatchText
        style={{
          color: tone === 'hot' ? '#1B1013' : '#F6F0EE',
          fontSize: 15,
          fontWeight: '800',
          letterSpacing: 0.9,
        }}>
        {label}
      </MatchText>
    </View>
  );
}

function AvatarTile({ initial }: { initial: string }) {
  return (
    <View
      style={{
        width: 74,
        height: 74,
        borderRadius: 24,
        backgroundColor: '#66D8FF',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: 24,
          backgroundColor: '#9BFF62',
          opacity: 0.68,
        }}
      />
      <MatchText variant="hero" style={{ color: '#091018', fontSize: 36, lineHeight: 38, zIndex: 1 }}>
        {initial}
      </MatchText>
    </View>
  );
}

function StatPill({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <SurfaceCard
      style={{
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 26,
        backgroundColor: accent ? 'rgba(160,255,97,0.12)' : '#151B2D',
        borderColor: accent ? 'rgba(160,255,97,0.24)' : 'rgba(255,255,255,0.10)',
      }}>
      <MatchText variant="label" tone="muted" style={{ textAlign: 'center', fontSize: 14 }}>
        {label}
      </MatchText>
      <MatchText
        variant="hero"
        style={{
          textAlign: 'center',
          fontSize: 29,
          lineHeight: 31,
          color: accent ? '#9BFF62' : undefined,
        }}>
        {value}
      </MatchText>
      <MatchText tone="muted" style={{ textAlign: 'center', fontSize: 13 }}>
        {note}
      </MatchText>
    </SurfaceCard>
  );
}

function Chip({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: muted ? '#11182A' : '#151B2D',
      }}>
      <MatchText variant="title" style={{ fontSize: 14, lineHeight: 16 }}>
        {label}
      </MatchText>
    </View>
  );
}
