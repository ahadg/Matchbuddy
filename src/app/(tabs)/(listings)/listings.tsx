import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingSurface, MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, getChatsInbox, sendWave } from '@/lib/api';
import { useSocialStore } from '@/stores/social-store';
import type { ApiChatsInbox, ApiDirectThreadPreview, ApiIncomingWave } from '@/types/api';

export default function ChatsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const socialRevision = useSocialStore((state) => state.revision);
  const bumpSocialRevision = useSocialStore((state) => state.bumpRevision);
  const [inbox, setInbox] = useState<ApiChatsInbox | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [activeWaveId, setActiveWaveId] = useState<null | string>(null);

  async function refreshInbox() {
    if (loading || refreshing) {
      return;
    }

    setRefreshing(true);
    setLoadError(null);

    try {
      const nextInbox = await getChatsInbox();
      setInbox(nextInbox);
    } catch (error) {
      if (!(error instanceof ApiConfigurationError)) {
        setLoadError(error instanceof Error ? error.message : 'Could not refresh your inbox.');
      }
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInbox() {
      setLoading(true);
      setLoadError(null);

      try {
        const nextInbox = await getChatsInbox();

        if (!cancelled) {
          setInbox(nextInbox);
        }
      } catch (error) {
        if (!cancelled) {
          if (!(error instanceof ApiConfigurationError)) {
            setLoadError(error instanceof Error ? error.message : 'Could not load your inbox.');
          }
          setInbox(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInbox().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [socialRevision]);

  const featuredThread = inbox?.directThreads[0] ?? null;
  const additionalThreads = useMemo(() => inbox?.directThreads.slice(1) ?? [], [inbox?.directThreads]);
  const incomingWaves = inbox?.incomingWaves ?? [];
  const groupRooms = inbox?.groupRooms ?? [];
  const hasLoadedInbox = Boolean(inbox);
  const isInitialLoad = (loading || refreshing) && !hasLoadedInbox;
  const isRefreshing = (loading || refreshing) && hasLoadedInbox;

  async function handleIncomingWave(wave: ApiIncomingWave) {
    setActiveWaveId(wave.id);
    setLoadError(null);

    try {
      const result = await sendWave(wave.fromProfileId);
      bumpSocialRevision();

      if (result.threadId && result.status === 'mutual') {
        router.push({ pathname: '/chat/[threadId]', params: { threadId: result.threadId } });
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not wave back right now.');
    } finally {
      setActiveWaveId(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Chats' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refreshInbox().catch(() => undefined);
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
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.three }}>
            <View style={{ gap: 4 }}>
              <MatchText variant="label" tone="muted">
                Inbox
              </MatchText>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
                  Waves
                </MatchText>
                <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36, color: '#FF8F61' }}>
                  & chats
                </MatchText>
              </View>
            </View>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                backgroundColor: theme.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Pressable
                onPress={() => {
                  refreshInbox().catch(() => undefined);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <MatchText variant="hero" style={{ color: '#0A0F17', fontSize: refreshing ? 14 : 20, lineHeight: refreshing ? 16 : 22 }}>
                  {refreshing ? '...' : '↻'}
                </MatchText>
              </Pressable>
            </View>
          </View>

          {isInitialLoad ? (
            <LoadingSurface
              title="Loading your inbox"
              subtitle="Fetching waves, unlocked chats, and group rooms."
            />
          ) : hasLoadedInbox && featuredThread ? (
            <FeaturedThreadCard thread={featuredThread} onOpen={() => router.push({ pathname: '/chat/[threadId]', params: { threadId: featuredThread.id } })} />
          ) : hasLoadedInbox ? (
            <SurfaceCard
              style={{
                padding: 18,
                borderRadius: 28,
                backgroundColor: '#171D30',
                borderColor: 'rgba(255,255,255,0.10)',
              }}>
              <MatchText variant="title" style={{ fontSize: 22, lineHeight: 24 }}>
                No mutual waves yet
              </MatchText>
              <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
                Start in Nearby, send a wave, and chats will unlock here after it is mutual.
              </MatchText>
            </SurfaceCard>
          ) : null}

          {isRefreshing ? (
            <LoadingSurface
              compact
              title="Refreshing chats"
              subtitle="Checking for new waves and replies."
            />
          ) : null}

          {loadError ? (
            <SurfaceCard tone="warm" style={{ borderRadius: 24 }}>
              <MatchText tone="warm">{loadError}</MatchText>
            </SurfaceCard>
          ) : null}

          {hasLoadedInbox && additionalThreads.length > 0 ? <SectionLabel label="Open chats" /> : null}
          {hasLoadedInbox && additionalThreads.length > 0 ? (
            <View style={{ gap: 16 }}>
              {additionalThreads.map((thread) => (
                <Pressable
                  key={thread.id}
                  onPress={() => router.push({ pathname: '/chat/[threadId]', params: { threadId: thread.id } })}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.96 : 1,
                    transform: [{ scale: pressed ? 0.995 : 1 }],
                  })}>
                  <SurfaceCard
                    style={{
                      padding: 16,
                      borderRadius: 24,
                      backgroundColor: '#171D30',
                      borderColor: 'rgba(255,255,255,0.10)',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <GradientSquare label={thread.otherInitial} warm={thread.otherVibe === 'Chill'} />
                      <View style={{ flex: 1, gap: 5 }}>
                        <MatchText variant="title" style={{ fontSize: 21, lineHeight: 23 }}>
                          {thread.otherDisplayName}
                        </MatchText>
                        <MatchText tone="muted" style={{ fontSize: 14 }}>
                          {thread.lastMessage ?? `${thread.fixtureSummary ?? 'Match night'} chat ready`}
                        </MatchText>
                      </View>
                      <MatchText tone="muted" style={{ fontSize: 13 }}>
                        {formatRelativeTime(thread.lastMessageAt)}
                      </MatchText>
                    </View>
                  </SurfaceCard>
                </Pressable>
              ))}
            </View>
          ) : null}

          {hasLoadedInbox ? <SectionLabel label="Anonymous waves" /> : null}
          {hasLoadedInbox ? (
            <View style={{ gap: 16 }}>
              {incomingWaves.length ? (
                incomingWaves.map((wave) => (
                  <SurfaceCard
                    key={wave.id}
                    style={{
                      padding: 16,
                      borderRadius: 24,
                      backgroundColor: '#171D30',
                      borderColor: 'rgba(255,255,255,0.10)',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View
                        style={{
                          width: 74,
                          height: 74,
                          borderRadius: 22,
                          backgroundColor: 'rgba(255, 92, 120, 0.18)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <MatchText variant="title" style={{ color: '#FF647D', fontSize: 24, lineHeight: 26 }}>
                          ☞
                        </MatchText>
                      </View>

                      <View style={{ flex: 1, gap: 5 }}>
                        <MatchText variant="title" style={{ fontSize: 21, lineHeight: 23 }}>
                          Someone in {wave.fromNeighborhood}
                        </MatchText>
                        <MatchText tone="muted" style={{ fontSize: 14 }}>
                          Waved you for {wave.fixtureSummary ?? 'tonight'}
                        </MatchText>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 12 }}>
                        <MatchText tone="muted" style={{ fontSize: 13 }}>
                          {formatRelativeTime(wave.createdAt)}
                        </MatchText>
                        <Pressable
                          onPress={() => {
                            handleIncomingWave(wave).catch(() => undefined);
                          }}
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 999,
                            backgroundColor: '#FFAA4A',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <MatchText variant="title" style={{ color: '#141924', fontSize: 14, lineHeight: 16 }}>
                            {activeWaveId === wave.id ? '...' : 'Back'}
                          </MatchText>
                        </Pressable>
                      </View>
                    </View>
                  </SurfaceCard>
                ))
              ) : (
                <SurfaceCard
                  style={{
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor: '#171D30',
                    borderColor: 'rgba(255,255,255,0.10)',
                  }}>
                  <MatchText tone="muted">No pending waves right now.</MatchText>
                </SurfaceCard>
              )}
            </View>
          ) : null}

          {hasLoadedInbox ? <SectionLabel label="Group rooms" /> : null}
          {hasLoadedInbox ? (
            <View style={{ gap: 16 }}>
              {groupRooms.length ? (
                groupRooms.map((group) => (
                  <Pressable
                    key={group.listingId}
                    onPress={() => router.push({ pathname: '/room/[listingId]', params: { listingId: group.listingId } })}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.96 : 1,
                      transform: [{ scale: pressed ? 0.995 : 1 }],
                    })}>
                    <SurfaceCard
                      style={{
                        padding: 16,
                        borderRadius: 24,
                        backgroundColor: '#171D30',
                        borderColor: 'rgba(255,255,255,0.10)',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View
                          style={{
                            width: 74,
                            height: 74,
                            borderRadius: 22,
                            backgroundColor: 'rgba(160,255,97,0.18)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <MatchText variant="title" style={{ fontSize: 24, lineHeight: 26 }}>
                            {group.isHost ? '♕' : '💬'}
                          </MatchText>
                        </View>
                        <View style={{ flex: 1, gap: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MatchText variant="title" style={{ fontSize: 20, lineHeight: 22, flex: 1 }} numberOfLines={1}>
                              {group.hostName}&apos;s room
                            </MatchText>
                            <View
                              style={{
                                minWidth: 30,
                                paddingHorizontal: 8,
                                paddingVertical: 5,
                                borderRadius: 999,
                                backgroundColor: 'rgba(160,255,97,0.16)',
                              }}>
                              <MatchText style={{ color: theme.accent, fontWeight: '800', textAlign: 'center' }}>{group.attendeeCount}</MatchText>
                            </View>
                          </View>
                          <MatchText tone="muted" numberOfLines={1} style={{ fontSize: 14 }}>
                            {group.lastMessage ?? `${group.fixtureSummary ?? 'Watch party'} room ready`}
                          </MatchText>
                        </View>
                        <MatchText tone="muted" style={{ fontSize: 13 }}>
                          {group.lastMessageAt ? formatRelativeTime(group.lastMessageAt) : 'new'}
                        </MatchText>
                      </View>
                    </SurfaceCard>
                  </Pressable>
                ))
              ) : (
                <SurfaceCard
                  style={{
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor: '#171D30',
                    borderColor: 'rgba(255,255,255,0.10)',
                  }}>
                  <MatchText tone="muted">Approved rooms will show up here after a host lets you in.</MatchText>
                </SurfaceCard>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

function FeaturedThreadCard({
  thread,
  onOpen,
}: {
  thread: ApiDirectThreadPreview;
  onOpen: () => void;
}) {
  return (
    <View
      style={{
        borderRadius: 30,
        padding: 2,
        backgroundColor: 'rgba(216, 92, 197, 0.9)',
      }}>
      <View
        style={{
          borderRadius: 28,
          backgroundColor: '#1A1E2D',
          borderWidth: 1,
          borderColor: 'rgba(158,255,97,0.55)',
          overflow: 'hidden',
          padding: 18,
        }}>
        <View style={{ position: 'absolute', left: -20, bottom: -26, width: 180, height: 120, borderRadius: 50, backgroundColor: 'rgba(158,255,97,0.10)' }} />
        <View style={{ position: 'absolute', right: -30, top: -12, width: 180, height: 120, borderRadius: 50, backgroundColor: 'rgba(157,113,255,0.14)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <GradientSquare label={thread.otherInitial} warm={thread.otherVibe === 'Chill'} />
            <View style={{ marginLeft: -8 }}>
              <GradientSquare label="☞" />
            </View>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <MatchText variant="title" style={{ fontSize: 24, lineHeight: 30 }}>
              Mutual{'\n'}wave{'\n'}with{'\n'}
              {thread.otherDisplayName}
            </MatchText>
            <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
              {thread.lastMessage ?? 'Chat unlocked · say hi'}
            </MatchText>
          </View>
          <Pressable
            onPress={onOpen}
            style={{
              alignSelf: 'center',
              paddingHorizontal: 22,
              paddingVertical: 15,
              borderRadius: 999,
              backgroundColor: '#F4F2EC',
            }}>
            <MatchText variant="title" style={{ color: '#111722', fontSize: 19, lineHeight: 21 }}>
              Open
            </MatchText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function GradientSquare({ label, warm = false }: { label: string; warm?: boolean }) {
  return (
    <View
      style={{
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: warm ? '#FFB24E' : '#66D8FF',
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
          borderRadius: 20,
          backgroundColor: warm ? '#FF6C78' : '#9BFF62',
          opacity: 0.68,
        }}
      />
      <MatchText variant="title" style={{ color: '#091019', fontSize: 24, lineHeight: 26, zIndex: 1 }}>
        {label}
      </MatchText>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <MatchText variant="label" tone="muted" style={{ fontSize: 11, lineHeight: 14 }}>
      {label}
    </MatchText>
  );
}

function formatRelativeTime(value: string) {
  const now = Date.now();
  const timestamp = new Date(value).getTime();
  const diffMs = Math.max(0, now - timestamp);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}
