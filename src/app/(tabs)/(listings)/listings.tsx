import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const waves = [
  { name: 'Someone in Old Town', note: 'Waved you for ARG-FRA', time: '2m', fresh: true },
  { name: 'Someone in Westside', note: 'Waved you for ENG-GER', time: '1h' },
];

const groups = [
  { id: 'azteca-loft', title: "Amir's rooftop · ARG-FRA", note: 'Host: doors open 20:30 🟢', count: 7, emoji: '🏟️', time: '12m' },
  { id: 'queens-oled', title: "Yara's family room", note: 'You: bringing the kids!', count: 4, emoji: '👨‍👩‍👧', time: '3h' },
];

export default function ChatsScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Chats' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingTop: Spacing.three,
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
              <MatchText variant="hero" style={{ color: '#0A0F17', fontSize: 28, lineHeight: 28 }}>
                +
              </MatchText>
            </View>
          </View>

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
                  <GradientSquare label="S" warm />
                  <View style={{ marginLeft: -8 }}>
                    <GradientSquare label="☞" />
                  </View>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <MatchText variant="title" style={{ fontSize: 24, lineHeight: 30 }}>
                    Mutual{'\n'}wave{'\n'}with{'\n'}Sofia ✨
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                    Chat{'\n'}unlocked ·{'\n'}say hi
                  </MatchText>
                </View>
                <Pressable
                  onPress={() => router.push('/listing/azteca-loft')}
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

          <SectionLabel label="Anonymous waves" />
          <View style={{ gap: 16 }}>
            {waves.map((wave) => (
              <SurfaceCard
                key={wave.name}
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
                    {wave.fresh ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          backgroundColor: '#FF5E78',
                          borderWidth: 2,
                          borderColor: '#171D30',
                        }}
                      />
                    ) : null}
                  </View>

                  <View style={{ flex: 1, gap: 5 }}>
                    <MatchText variant="title" style={{ fontSize: 21, lineHeight: 23 }}>
                      {wave.name}
                    </MatchText>
                    <MatchText tone="muted" style={{ fontSize: 14 }}>
                      {wave.note}
                    </MatchText>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 12 }}>
                    <MatchText tone="muted" style={{ fontSize: 13 }}>
                      {wave.time}
                    </MatchText>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 999,
                        backgroundColor: '#FFAA4A',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <MatchText variant="title" style={{ color: '#141924', fontSize: 24, lineHeight: 24 }}>
                        ♥
                      </MatchText>
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            ))}
          </View>

          <SectionLabel label="Group rooms" />
          <View style={{ gap: 16 }}>
            {groups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => router.push(`/listing/${group.id}`)}
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
                        {group.emoji}
                      </MatchText>
                    </View>
                    <View style={{ flex: 1, gap: 5 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MatchText variant="title" style={{ fontSize: 20, lineHeight: 22, flex: 1 }} numberOfLines={1}>
                          {group.title}
                        </MatchText>
                        <View
                          style={{
                            minWidth: 30,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: 999,
                            backgroundColor: 'rgba(160,255,97,0.16)',
                          }}>
                          <MatchText style={{ color: theme.accent, fontWeight: '800', textAlign: 'center' }}>{group.count}</MatchText>
                        </View>
                      </View>
                      <MatchText tone="muted" numberOfLines={1} style={{ fontSize: 14 }}>
                        {group.note}
                      </MatchText>
                    </View>
                    <MatchText tone="muted" style={{ fontSize: 13 }}>
                      {group.time}
                    </MatchText>
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

function GradientSquare({ label, warm = false }: { label: string; warm?: boolean }) {
  const theme = useTheme();

  return (
    <View
      style={{
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: warm ? '#FFB24E' : '#66D8FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#171D30',
      }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: 17,
          backgroundColor: warm ? '#FF647D' : theme.accent,
          opacity: 0.68,
        }}
      />
      <MatchText variant="title" style={{ color: '#0C1320', fontSize: 24, lineHeight: 26, zIndex: 1 }}>
        {label}
      </MatchText>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <MatchText variant="label" tone="muted" style={{ fontSize: 14 }}>
      {label}
    </MatchText>
  );
}
