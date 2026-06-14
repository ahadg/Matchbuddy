import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, getDirectThreadMessages, sendDirectThreadMessage } from '@/lib/api';
import { connectActiveChatSocket } from '@/lib/realtime';
import { useProfileStore } from '@/stores/profile-store';
import { useSocialStore } from '@/stores/social-store';
import type { ApiDirectThreadMessages } from '@/types/api';

export default function DirectChatScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const profileId = useProfileStore((state) => state.profile?.id ?? null);
  const bumpSocialRevision = useSocialStore((state) => state.bumpRevision);
  const [conversation, setConversation] = useState<ApiDirectThreadMessages | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      if (!threadId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextConversation = await getDirectThreadMessages(threadId);

        if (!cancelled) {
          setConversation(nextConversation);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (!(loadError instanceof ApiConfigurationError)) {
            setError(loadError instanceof Error ? loadError.message : 'Could not load this chat.');
          }
          setConversation(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadConversation().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  useEffect(() => {
    if (!threadId) {
      return undefined;
    }

    let disposed = false;
    let disconnect: () => void = () => undefined;

    connectActiveChatSocket({
      threadId,
      onDirectMessage: (message) => {
        if (disposed) {
          return;
        }

        setConversation((current) => {
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
  }, [threadId]);

  async function handleSend() {
    if (!threadId || !draft.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const message = await sendDirectThreadMessage(threadId, draft);
      setConversation((current) =>
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
      setError(sendError instanceof Error ? sendError.message : 'Could not send this message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: conversation?.thread.otherDisplayName ?? 'Chat' }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentInsetAdjustmentBehavior="never"
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: Spacing.three,
              paddingTop: insets.top + Spacing.two,
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
                {conversation?.thread ? (
                  <Avatar
                    name={conversation.thread.otherDisplayName}
                    imageUrl={conversation.thread.otherAvatarUrl}
                    size={48}
                  />
                ) : null}
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <MatchText
                    variant="title"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ fontSize: 22, lineHeight: 24 }}>
                    {conversation?.thread.otherDisplayName ?? 'Chat'}
                  </MatchText>
                  <MatchText numberOfLines={1} ellipsizeMode="tail" tone="muted">
                    {conversation?.thread.fixtureSummary ?? 'Mutual wave'} {conversation?.thread.fixtureStage ? `· ${conversation.thread.fixtureStage}` : ''}
                  </MatchText>
                  {conversation?.thread.otherProfileId ? (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/fan/[fanId]',
                          params: { fanId: conversation.thread.otherProfileId },
                        })
                      }
                      style={({ pressed }) => ({
                        alignSelf: 'flex-start',
                        marginTop: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: theme.border,
                        backgroundColor: theme.backgroundElement,
                        opacity: pressed ? 0.92 : 1,
                      })}>
                      <MatchText variant="caption" tone="accent">
                        View profile & safety
                      </MatchText>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {loading ? (
                <SurfaceCard style={{ borderRadius: 24 }}>
                  <MatchText tone="muted">Loading messages…</MatchText>
                </SurfaceCard>
              ) : null}

              {error ? (
                <SurfaceCard tone="warm" style={{ borderRadius: 24 }}>
                  <MatchText tone="warm">{error}</MatchText>
                </SurfaceCard>
              ) : null}

              {conversation?.messages.length ? (
                conversation.messages.map((message) => {
                  const own = message.senderProfileId === profileId;
                  const bubbleTone = own ? 'rgba(160,255,97,0.18)' : '#171D30';
                  const bubbleBorder = own ? 'rgba(160,255,97,0.24)' : 'rgba(255,255,255,0.10)';

                  return (
                    <View
                      key={message.id}
                      style={{
                        alignItems: own ? 'flex-end' : 'flex-start',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-end',
                          justifyContent: own ? 'flex-end' : 'flex-start',
                          gap: 10,
                          width: '100%',
                        }}>
                        {!own ? (
                          <Avatar
                            name={message.senderDisplayName}
                            imageUrl={message.senderAvatarUrl}
                            size={38}
                          />
                        ) : null}
                        <View
                          style={{
                            minWidth: own ? 148 : undefined,
                            maxWidth: own ? '78%' : '84%',
                            borderRadius: 24,
                            paddingHorizontal: 16,
                            paddingVertical: own ? 14 : 12,
                            backgroundColor: bubbleTone,
                            borderWidth: 1,
                            borderColor: bubbleBorder,
                            borderTopRightRadius: own ? 16 : 24,
                            borderTopLeftRadius: own ? 24 : 16,
                            gap: own ? 8 : 6,
                          }}>
                          {!own ? (
                            <MatchText variant="caption" tone="muted">
                              {message.senderDisplayName}
                            </MatchText>
                          ) : null}
                          <MatchText style={{ fontSize: 14, lineHeight: 20 }}>{message.body}</MatchText>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}>
                            {own ? (
                              <MatchText variant="caption" tone="accent">
                                You
                              </MatchText>
                            ) : (
                              <View />
                            )}
                            <MatchText tone="muted" style={{ fontSize: 12 }}>
                              {formatMessageTime(message.createdAt)}
                            </MatchText>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <SurfaceCard style={{ borderRadius: 24 }}>
                  <MatchText tone="muted">Say hi. This chat unlocked because the wave was mutual.</MatchText>
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
                  placeholder="Send a message"
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
