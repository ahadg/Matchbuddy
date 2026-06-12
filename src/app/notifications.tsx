import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotificationStore } from '@/stores/notification-store';

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const items = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const loading = useNotificationStore((state) => state.loading);
  const initialized = useNotificationStore((state) => state.initialized);
  const error = useNotificationStore((state) => state.error);
  const refresh = useNotificationStore((state) => state.refresh);
  const markReadOnOpen = useNotificationStore((state) => state.markReadOnOpen);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await refresh().catch(() => undefined);
        await markReadOnOpen().catch(() => undefined);
      })().catch(() => undefined);
      return undefined;
    }, [markReadOnOpen, refresh]),
  );

  function openNotification(target: (typeof items)[number]) {
    if (target.threadId) {
      router.push({ pathname: '/chat/[threadId]', params: { threadId: target.threadId } });
      return;
    }

    if (target.listingId) {
      router.push({ pathname: '/room/[listingId]', params: { listingId: target.listingId } });
      return;
    }

    if (target.fanId) {
      router.push({ pathname: '/fan/[fanId]', params: { fanId: target.fanId } });
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              refresh().catch(() => undefined);
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
          <View style={{ gap: 4 }}>
            <MatchText variant="label" tone="muted">
              Alerts
            </MatchText>
            <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
              Notifications
            </MatchText>
            <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
                : 'Waves, messages, and room updates appear here'}
            </MatchText>
          </View>

          {loading && !initialized ? (
            <SurfaceCard style={{ borderRadius: 24 }}>
              <MatchText tone="muted">Loading notifications…</MatchText>
            </SurfaceCard>
          ) : null}

          {error ? (
            <SurfaceCard tone="warm" style={{ borderRadius: 24 }}>
              <MatchText tone="warm">{error}</MatchText>
            </SurfaceCard>
          ) : null}

          {initialized && !items.length ? (
            <SurfaceCard style={{ borderRadius: 24, padding: 18 }}>
              <MatchText variant="title" style={{ fontSize: 22, lineHeight: 24 }}>
                No notifications yet
              </MatchText>
              <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
                When someone waves or sends a message, you’ll see it here.
              </MatchText>
            </SurfaceCard>
          ) : null}

          <View style={{ gap: 14 }}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => openNotification(item)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.96 : 1,
                  transform: [{ scale: pressed ? 0.995 : 1 }],
                })}>
                <SurfaceCard
                  style={{
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor: item.readAt ? '#171D30' : 'rgba(160,255,97,0.10)',
                    borderColor: item.readAt ? 'rgba(255,255,255,0.10)' : 'rgba(160,255,97,0.20)',
                    gap: 12,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar
                      name={item.actorDisplayName ?? item.title}
                      imageUrl={item.actorAvatarUrl}
                      size={48}
                    />
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MatchText variant="subtitle" style={{ flex: 1 }}>
                          {item.title}
                        </MatchText>
                        {!item.readAt ? (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 999,
                              backgroundColor: theme.accent,
                            }}
                          />
                        ) : null}
                      </View>
                      <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                        {item.body}
                      </MatchText>
                      <MatchText tone="muted" style={{ fontSize: 12 }}>
                        {formatRelativeTime(item.createdAt)}
                      </MatchText>
                    </View>
                  </View>
                </SurfaceCard>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function formatRelativeTime(value: string) {
  const createdAt = new Date(value).getTime();
  const deltaMs = Date.now() - createdAt;

  if (!Number.isFinite(createdAt) || deltaMs < 0) {
    return 'Just now';
  }

  const minutes = Math.floor(deltaMs / (1000 * 60));
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}
