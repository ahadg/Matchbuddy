import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ActionButton, MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const extras = ['🍿 Snacks', '🍺 BYOB', '🎥 Projector', '🌆 Balcony', '❄️ AC'];

export default function ListingDetailScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Listing detail' }} />
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
                  <CircleIcon label="✕" />
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <CircleIcon label="♡" warm />
                    <CircleIcon label="⋯" coral />
                  </View>
                </View>

                <View style={{ marginTop: 146, gap: 14 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    <Badge label="🔥 LOUD & ROWDY" tone="hot" />
                    <Badge label="TONIGHT" tone="dark" />
                  </View>

                  <View style={{ gap: 6 }}>
                    <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
                      Amir&apos;s rooftop
                    </MatchText>
                    <MatchText style={{ fontSize: 18, lineHeight: 24 }}>
                      ARG 🇦🇷 vs 🇫🇷 FRA · Semi-Final
                    </MatchText>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ paddingHorizontal: Spacing.three, paddingTop: 16, gap: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <AvatarTile />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MatchText variant="title" style={{ fontSize: 26, lineHeight: 28 }}>
                      Amir K.
                    </MatchText>
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
                  </View>
                  <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 19 }}>
                    ⭐ 4.9 · 23 watches hosted
                  </MatchText>
                </View>
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.10)',
                    backgroundColor: '#1A2032',
                  }}>
                  <MatchText variant="title" style={{ fontSize: 16, lineHeight: 18 }}>
                    0.4 km
                  </MatchText>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <StatPill label="SPOTS" value="3/8" note="left" accent />
                <StatPill label="VIBE" value="9/10" note="rated" />
                <StatPill label="SCREEN" value={'75"'} note="4K HDR" />
              </View>

              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

              <View style={{ gap: 14 }}>
                <MatchText variant="title" style={{ fontSize: 22, lineHeight: 24 }}>
                  Extras
                </MatchText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {extras.map((extra) => (
                    <View
                      key={extra}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.10)',
                        backgroundColor: '#151B2D',
                      }}>
                      <MatchText variant="title" style={{ fontSize: 14, lineHeight: 16 }}>
                        {extra}
                      </MatchText>
                    </View>
                  ))}
                </View>
              </View>
            </View>
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
                    Free
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 14 }}>
                    · split snacks
                  </MatchText>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton tone="accent">Request a spot</ActionButton>
              </View>
            </View>
          </View>
        </View>
      </View>
    </>
  );
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

function AvatarTile() {
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
        A
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
          fontSize: 31,
          lineHeight: 33,
          color: accent ? '#9BFF62' : undefined,
        }}>
        {value}
      </MatchText>
      <MatchText tone="muted" style={{ textAlign: 'center', fontSize: 14 }}>
        {note}
      </MatchText>
    </SurfaceCard>
  );
}
