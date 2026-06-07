import { Stack } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appConfig } from '@/lib/config';
import { useAuthStore } from '@/stores/auth-store';

const teams = [
  { name: 'Real Madrid', tone: 'accent' },
  { name: 'Argentina', tone: 'warm' },
  { name: 'Liverpool', tone: 'danger' },
] as const;

const rows = [
  { icon: '✦', label: 'Match Day Mode', value: 'On' },
  { icon: '♕', label: 'Hosting', value: 'Active' },
  { icon: '🔒', label: 'Privacy', value: 'Address hidden' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const accountLabel = appConfig.supabase.enabled && session ? 'Sign out' : 'Edit profile';

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingBottom: BottomTabInset + 22,
        }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
          <View
            style={{
              height: 144,
              backgroundColor: '#161B2C',
              overflow: 'hidden',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}>
            <View style={{ position: 'absolute', left: -8, top: 18, width: 170, height: 170, borderRadius: 60, backgroundColor: 'rgba(101, 246, 178, 0.10)' }} />
            <View style={{ position: 'absolute', right: -24, top: -6, width: 190, height: 150, borderRadius: 62, backgroundColor: 'rgba(255, 141, 98, 0.12)' }} />
            <View style={{ position: 'absolute', left: 110, top: -10, width: 180, height: 120, borderRadius: 52, backgroundColor: 'rgba(157, 123, 255, 0.14)' }} />
          </View>

          <View style={{ paddingHorizontal: Spacing.three, marginTop: -96, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three }}>
              <View
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: 32,
                  backgroundColor: '#66D8FF',
                  borderWidth: 6,
                  borderColor: theme.background,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View style={{ position: 'absolute', inset: 0, borderRadius: 26, backgroundColor: theme.accent, opacity: 0.62 }} />
                <MatchText variant="hero" style={{ color: '#091019', fontSize: 48, lineHeight: 50, zIndex: 1 }}>
                  J
                </MatchText>
                <View
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: theme.accent,
                    borderWidth: 3,
                    borderColor: theme.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MatchText variant="title" style={{ color: '#0B121C', fontSize: 22, lineHeight: 24 }}>
                    ✓
                  </MatchText>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  if (appConfig.supabase.enabled && session) {
                    signOut().catch(() => undefined);
                  }
                }}
                style={{
                  marginTop: 62,
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 999,
                  backgroundColor: '#1A2032',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.10)',
                }}>
                <MatchText variant="title" style={{ fontSize: 18, lineHeight: 20 }}>
                  {accountLabel}
                </MatchText>
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <MatchText variant="hero" style={{ fontSize: 38, lineHeight: 40 }}>
                  Jamal R.
                </MatchText>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: 'rgba(160,255,97,0.18)',
                  }}>
                  <MatchText style={{ color: theme.accent, fontWeight: '800', fontSize: 14 }}>VERIFIED</MatchText>
                </View>
              </View>
              <MatchText tone="muted" style={{ fontSize: 15, lineHeight: 20 }}>
                📍 Westside · Dubai · he/him
              </MatchText>
              {appConfig.supabase.enabled && session?.user?.email ? (
                <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 18 }}>
                  Signed in as {session.user.email}
                </MatchText>
              ) : null}
              <MatchText style={{ fontSize: 16, lineHeight: 24 }}>
                Lifelong Madridista. Host loud watch-parties{'\n'}on my rooftop. Snacks always on me 🍿
              </MatchText>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {teams.map((team) => (
                <View
                  key={team.name}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor:
                      team.tone === 'accent'
                        ? 'rgba(160,255,97,0.24)'
                        : team.tone === 'warm'
                          ? 'rgba(255,141,98,0.24)'
                          : 'rgba(157,123,255,0.24)',
                    backgroundColor:
                      team.tone === 'accent'
                        ? 'rgba(160,255,97,0.12)'
                        : team.tone === 'warm'
                          ? 'rgba(255,141,98,0.14)'
                          : 'rgba(157,123,255,0.14)',
                  }}>
                  <MatchText
                    style={{
                      color: team.tone === 'accent' ? theme.accent : team.tone === 'warm' ? theme.warm : theme.danger,
                      fontSize: 14,
                      fontWeight: '800',
                    }}>
                    ⚽ {team.name}
                  </MatchText>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard top="23" bottom="HOSTED" />
              <StatCard top="★ 4.9" bottom="RATING" />
              <StatCard top="142" bottom="WAVES" />
            </View>

            <SurfaceCard
              style={{
                padding: 0,
                borderRadius: 30,
                overflow: 'hidden',
                backgroundColor: '#171D30',
                borderColor: 'rgba(255,255,255,0.10)',
              }}>
              {rows.map((row, index) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingHorizontal: 20,
                    paddingVertical: 17,
                    borderBottomWidth: index === rows.length - 1 ? 0 : 1,
                    borderBottomColor: 'rgba(255,255,255,0.08)',
                  }}>
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      backgroundColor: 'rgba(160,255,97,0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MatchText variant="title" style={{ color: theme.accent, fontSize: 24, lineHeight: 26 }}>
                      {row.icon}
                    </MatchText>
                  </View>
                  <MatchText variant="title" style={{ flex: 1, fontSize: 20, lineHeight: 22 }}>
                    {row.label}
                  </MatchText>
                  <MatchText style={{ color: theme.accent, fontSize: 15, fontWeight: '800' }}>{row.value}</MatchText>
                  <MatchText tone="muted" style={{ fontSize: 20 }}>
                    ›
                  </MatchText>
                </View>
              ))}
            </SurfaceCard>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function StatCard({ top, bottom }: { top: string; bottom: string }) {
  return (
    <SurfaceCard
      style={{
        flex: 1,
        paddingVertical: 22,
        paddingHorizontal: 14,
        borderRadius: 26,
        backgroundColor: '#171D30',
        borderColor: 'rgba(255,255,255,0.10)',
      }}>
      <MatchText variant="hero" style={{ textAlign: 'center', fontSize: 32, lineHeight: 34 }}>
        {top}
      </MatchText>
      <MatchText variant="label" tone="muted" style={{ textAlign: 'center', fontSize: 14 }}>
        {bottom}
      </MatchText>
    </SurfaceCard>
  );
}
