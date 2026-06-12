import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Avatar, MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, getListingRoomMessages, sendListingRoomMessage } from '@/lib/api';
import { connectActiveChatSocket } from '@/lib/realtime';
import { useProfileStore } from '@/stores/profile-store';
import { useSocialStore } from '@/stores/social-store';
import type { ApiListingRoomMessages } from '@/types/api';

export default function ListingRoomScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const profileId = useProfileStore((state) => state.profile?.id ?? null);
  const bumpSocialRevision = useSocialStore((state) => state.bumpRevision);
  const [roomState, setRoomState] = useState<ApiListingRoomMessages | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      if (!listingId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextRoom = await getListingRoomMessages(listingId);

        if (!cancelled) {
          setRoomState(nextRoom);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (!(loadError instanceof ApiConfigurationError)) {
            setError(loadError instanceof Error ? loadError.message : 'Could not load this room.');
          }
          setRoomState(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRoom().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  useEffect(() => {
    if (!listingId) {
      return undefined;
    }

    let disposed = false;
    let disconnect: () => void = () => undefined;

    connectActiveChatSocket({
      listingId,
      onListingMessage: (message) => {
        if (disposed) {
          return;
        }

        setRoomState((current) => {
          if (!current || current.messages.some((entry) => entry.id === message.id)) {
            return current;
          }

          return {
            ...current,
            messages: [...current.messages, message],
          };
        });
      },
      onError: (message) => {
        if (!disposed) {
          setError((current) => current ?? message);
        }
      },
    })
      .then((cleanup) => {
        disconnect = cleanup;
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      disconnect();
    };
  }, [listingId]);

  async function handleSend() {
    if (!listingId || !draft.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const message = await sendListingRoomMessage(listingId, draft);
      setRoomState((current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, message],
            }
          : current,
      );
      setDraft('');
      bumpSocialRevision();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send this room update.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: roomState?.room.hostName ?? 'Room chat' }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: Spacing.three,
              paddingTop: Spacing.three,
              paddingBottom: BottomTabInset + 116,
            }}>
            <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable onPress={() => router.back()}>
                  <SurfaceCard
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}>
                    <MatchText variant="title">‹</MatchText>
                  </SurfaceCard>
                </Pressable>
                {roomState?.room ? (
                  <Avatar
                    name={roomState.room.hostName}
                    imageUrl={roomState.room.hostAvatarUrl}
                    size={48}
                  />
                ) : null}
                <View style={{ flex: 1, gap: 2 }}>
                  <MatchText variant="title" style={{ fontSize: 24, lineHeight: 26 }}>
                    {roomState?.room.hostName ?? 'Room chat'}
                  </MatchText>
                  <MatchText tone="muted">
                    {roomState?.room.fixtureSummary ?? 'Watch party'} · {roomState?.room.fixtureStage ?? 'Room'}
                  </MatchText>
                </View>
              </View>

              {roomState ? (
                <SurfaceCard
                  style={{
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor: '#171D30',
                    borderColor: 'rgba(255,255,255,0.10)',
                    gap: 8,
                  }}>
                  <MatchText variant="title" style={{ fontSize: 20, lineHeight: 22 }}>
                    {roomState.room.isHost ? 'Host room' : 'Approved room'}
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
                    {roomState.room.joinMessage}
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 13 }}>
                    {roomState.room.attendeeCount}/{roomState.room.maxGuests + 1} people in room
                  </MatchText>
                </SurfaceCard>
              ) : null}

              {loading ? (
                <SurfaceCard style={{ borderRadius: 24 }}>
                  <MatchText tone="muted">Loading room messages…</MatchText>
                </SurfaceCard>
              ) : null}

              {error ? (
                <SurfaceCard tone="warm" style={{ borderRadius: 24 }}>
                  <MatchText tone="warm">{error}</MatchText>
                </SurfaceCard>
              ) : null}

              {roomState?.messages.length ? (
                roomState.messages.map((message) => {
                  const own = message.senderProfileId === profileId;

                  return (
                    <View
                      key={message.id}
                      style={{
                        alignItems: own ? 'flex-end' : 'flex-start',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                        {!own ? (
                          <Avatar
                            name={message.senderDisplayName}
                            imageUrl={message.senderAvatarUrl}
                            size={38}
                          />
                        ) : null}
                        <View
                          style={{
                            maxWidth: '86%',
                            borderRadius: 24,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            backgroundColor: own ? 'rgba(160,255,97,0.18)' : '#171D30',
                            borderWidth: 1,
                            borderColor: own ? 'rgba(160,255,97,0.24)' : 'rgba(255,255,255,0.10)',
                            gap: 6,
                          }}>
                          <MatchText variant="caption" tone={own ? 'accent' : 'muted'}>
                            {own ? 'You' : message.senderDisplayName}
                          </MatchText>
                          <MatchText style={{ fontSize: 14, lineHeight: 20 }}>{message.body}</MatchText>
                          <MatchText tone="muted" style={{ fontSize: 12 }}>
                            {formatMessageTime(message.createdAt)}
                          </MatchText>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <SurfaceCard style={{ borderRadius: 24 }}>
                  <MatchText tone="muted">No group messages yet. Use this room for arrival updates and host notes.</MatchText>
                </SurfaceCard>
              )}
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: Spacing.three,
              paddingBottom: 12,
            }}>
            <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
              <SurfaceCard
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 12,
                  padding: 12,
                  borderRadius: 26,
                }}>
                <TextInput
                  placeholder="Share an update"
                  placeholderTextColor="rgba(232, 238, 245, 0.42)"
                  selectionColor={theme.accent}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    maxHeight: 110,
                    color: theme.text,
                    fontSize: 15,
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                  }}
                  multiline
                  value={draft}
                  onChangeText={setDraft}
                />
                <Pressable
                  onPress={() => {
                    handleSend().catch(() => undefined);
                  }}
                  style={{
                    minWidth: 88,
                    minHeight: 48,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.accent,
                    paddingHorizontal: 18,
                  }}>
                  <MatchText variant="subtitle" style={{ color: '#0B121A' }}>
                    {sending ? '...' : 'Send'}
                  </MatchText>
                </Pressable>
              </SurfaceCard>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${minutes} ${suffix}`;
}
