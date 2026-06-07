import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const fixtureCards = [
  {
    id: 'azteca-loft',
    badge: 'Hottest tonight',
    badgeTrend: '+84 today',
    stage: 'Semi-Final',
    timeLabel: 'Today · 21:00',
    homeCode: 'ARG',
    awayCode: 'FRA',
    homeFlag: '🇦🇷',
    awayFlag: '🇫🇷',
    venue: 'Lusail Stadium',
    nearbyFans: 248,
    hot: true,
    accent: '#FF5E78',
    glow: 'rgba(255, 94, 120, 0.14)',
  },
  {
    id: 'queens-oled',
    stage: 'Group F',
    timeLabel: 'Tomorrow · 18:30',
    homeCode: 'ENG',
    awayCode: 'GER',
    homeFlag: '🏴',
    awayFlag: '🇩🇪',
    venue: 'Wembley',
    nearbyFans: 132,
    accent: '#7FB6FF',
    glow: 'rgba(101, 215, 255, 0.12)',
  },
  {
    id: 'bushwick-sound-room',
    stage: 'Group A',
    timeLabel: 'Sat · 20:00',
    homeCode: 'BRA',
    awayCode: 'ESP',
    homeFlag: '🇧🇷',
    awayFlag: '🇪🇸',
    venue: 'Maracana',
    nearbyFans: 91,
    accent: '#A8FF6C',
    glow: 'rgba(168, 255, 108, 0.12)',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [matchDayEnabled, setMatchDayEnabled] = useState(true);

  return (
    <>
      <Stack.Screen options={{ title: 'Fixtures' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingTop: 18,
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
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.three }}>
            <View style={{ gap: 4 }}>
              <MatchText variant="label" tone="muted">
                Matchday · Jun
              </MatchText>
              <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
                Fixtures
              </MatchText>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <CircleAction symbolName={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} />
              <CircleAction symbolName={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} accentDot />
            </View>
          </View>

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
              <View style={{ position: 'absolute', left: 16, bottom: -18, width: 148, height: 118, borderRadius: 44, backgroundColor: 'rgba(72,255,192,0.12)' }} />
              <View style={{ position: 'absolute', right: -10, top: -14, width: 166, height: 128, borderRadius: 48, backgroundColor: 'rgba(166,255,97,0.12)' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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
                    <MatchText style={{ color: 'rgba(235,237,244,0.72)', fontSize: 14, lineHeight: 20 }}>
                      Visible for ARG-FRA · 3h left
                    </MatchText>
                  </View>
                </View>
                <ModeToggle enabled={matchDayEnabled} onPress={() => setMatchDayEnabled((value) => !value)} />
              </View>

              <View style={{ marginTop: 14, flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <MetaPill label="ARG vs FRA" />
                <MetaPill label="248 nearby" accent />
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two }}>
            <View style={{ gap: 2 }}>
              <MatchText variant="title" style={{ fontSize: 24, lineHeight: 26 }}>
                Upcoming
              </MatchText>
              <MatchText tone="muted" style={{ fontSize: 13 }}>
                Best matchups near you
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
              }}>
              <MatchText variant="caption" tone="accent" style={{ fontSize: 12 }}>
                This week
              </MatchText>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            {fixtureCards.map((fixture, index) => (
              <Pressable
                key={fixture.id}
                onPress={() => index === 0 && router.push('/listing/azteca-loft')}
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
                      backgroundColor: fixture.glow,
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
                  {fixture.hot ? (
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: 'rgba(255, 88, 120, 0.18)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                      <MatchSymbol
                        name={{ ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' }}
                        color="#FF5E78"
                        size={15}
                      />
                      <MatchText variant="caption" style={{ color: '#FF5E78', fontSize: 13, fontWeight: '800' }}>
                        HOTTEST TONIGHT
                      </MatchText>
                      <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MatchSymbol
                          name={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }}
                          color="#FF8B63"
                          size={14}
                        />
                        <MatchText variant="caption" style={{ color: '#FF8B63', fontSize: 13, fontWeight: '700' }}>
                          {fixture.badgeTrend}
                        </MatchText>
                      </View>
                    </View>
                  ) : null}

                  <View style={{ padding: 16, gap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two }}>
                      <MatchText variant="label" tone="muted" style={{ fontSize: 14, color: 'rgba(235,238,244,0.72)' }}>
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

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                      <TeamBadge flag={fixture.homeFlag} code={fixture.homeCode} />
                      <MatchText variant="subtitle" tone="muted" style={{ fontSize: 18 }}>
                        VS
                      </MatchText>
                      <TeamBadge flag={fixture.awayFlag} code={fixture.awayCode} />
                    </View>

                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MatchSymbol
                          name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                          color="rgba(235,238,244,0.72)"
                          size={15}
                        />
                        <MatchText tone="muted" style={{ fontSize: 14 }}>
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
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function ModeToggle({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 82,
        height: 50,
        borderRadius: 999,
        backgroundColor: enabled ? '#9BFF62' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: enabled ? 'rgba(184,255,97,0.32)' : 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        paddingHorizontal: 6,
        opacity: pressed ? 0.94 : 1,
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
        <MatchSymbol
          name={
            enabled
              ? { ios: 'checkmark', android: 'check', web: 'check' }
              : { ios: 'circle.fill', android: 'radio_button_checked', web: 'radio_button_checked' }
          }
          color={enabled ? '#9BFF62' : 'rgba(255,255,255,0.6)'}
          size={enabled ? 18 : 14}
        />
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

function CircleAction({ symbolName, accentDot = false }: { symbolName: any; accentDot?: boolean }) {
  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <MatchSymbol name={symbolName} size={23} />
      {accentDot ? (
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
    </View>
  );
}

function TeamBadge({ flag, code }: { flag: string; code: string }) {
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
        }}>
        <MatchText variant="hero" style={{ fontSize: 30, lineHeight: 32 }}>
          {flag}
        </MatchText>
      </View>
      <MatchText variant="subtitle" style={{ fontSize: 16, letterSpacing: 1 }}>
        {code}
      </MatchText>
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
