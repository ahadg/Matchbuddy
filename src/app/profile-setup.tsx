import { Redirect, Stack, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appConfig } from '@/lib/config';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import type { WatchingVibe } from '@/types/matchbuddy';

const vibeOptions: WatchingVibe[] = ['Loud', 'Chill', 'Family', 'Women-only'];

function defaultDisplayName(email: null | string | undefined) {
  const localPart = email?.split('@')[0] ?? 'MatchBuddy fan';

  return localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function parseTeams(value: string) {
  return value
    .split(',')
    .map((team) => team.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const session = useAuthStore((state) => state.session);
  const loading = useProfileStore((state) => state.loading);
  const profile = useProfileStore((state) => state.profile);
  const saveProfile = useProfileStore((state) => state.saveProfile);

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [bio, setBio] = useState('');
  const [favouriteTeamsInput, setFavouriteTeamsInput] = useState('');
  const [vibe, setVibe] = useState<WatchingVibe>('Chill');
  const [isHost, setIsHost] = useState(true);
  const [screenSize, setScreenSize] = useState('');
  const [displayType, setDisplayType] = useState('');
  const [audio, setAudio] = useState('');
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? defaultDisplayName(session?.user.email));
    setCity(profile?.city ?? '');
    setNeighborhood(profile?.neighborhood ?? '');
    setBio(profile?.bio ?? '');
    setFavouriteTeamsInput((profile?.favouriteTeams ?? []).join(', '));
    setVibe(profile?.vibe ?? 'Chill');
    setIsHost(profile?.isHost ?? true);
    setScreenSize(profile?.setup?.screenSize ?? '');
    setDisplayType(profile?.setup?.displayType ?? '');
    setAudio(profile?.setup?.audio ?? '');
  }, [profile, session?.user.email]);

  if (!appConfig.api.enabled || !appConfig.supabase.enabled) {
    return <Redirect href="/sign-in" />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  async function handleSubmit() {
    const normalizedDisplayName = displayName.trim();
    const normalizedCity = city.trim();
    const normalizedNeighborhood = neighborhood.trim();
    const favouriteTeams = parseTeams(favouriteTeamsInput);

    if (!normalizedDisplayName || !normalizedCity || !normalizedNeighborhood) {
      setError('Add your name, city, and neighborhood first.');
      return;
    }

    if (favouriteTeams.length === 0) {
      setError('Add at least one favourite team.');
      return;
    }

    if (isHost && (!screenSize.trim() || !displayType.trim() || !audio.trim())) {
      setError('Add your TV setup details so guests know what to expect.');
      return;
    }

    const result = await saveProfile({
      bio,
      city: normalizedCity,
      displayName: normalizedDisplayName,
      favouriteTeams,
      isHost,
      neighborhood: normalizedNeighborhood,
      setup: isHost
        ? {
            audio: audio.trim(),
            displayType: displayType.trim(),
            screenSize: screenSize.trim(),
          }
        : null,
      vibe,
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    router.replace('/(tabs)/(home)');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Create profile' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ padding: Spacing.three }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 18 }}>
          <View style={{ gap: 6 }}>
            <MatchText variant="label" tone="muted">
              Welcome
            </MatchText>
            <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
              {profile ? 'Edit your profile' : 'Create your profile'}
            </MatchText>
            <MatchText tone="muted" style={{ fontSize: 15, lineHeight: 21 }}>
              Let&apos;s start with the essentials so nearby fans can match with the right vibe and setup.
            </MatchText>
          </View>

          <SurfaceCard style={{ padding: 18, borderRadius: 28 }}>
            <View style={{ gap: 14 }}>
              <Field label="Display name">
                <TextField value={displayName} onChangeText={setDisplayName} placeholder="Jamal R." />
              </Field>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Field label="City" style={{ flex: 1 }}>
                  <TextField value={city} onChangeText={setCity} placeholder="Dubai" />
                </Field>
                <Field label="Neighborhood" style={{ flex: 1 }}>
                  <TextField value={neighborhood} onChangeText={setNeighborhood} placeholder="Westside" />
                </Field>
              </View>

              <Field label="Favourite teams">
                <TextField
                  value={favouriteTeamsInput}
                  onChangeText={setFavouriteTeamsInput}
                  placeholder="Real Madrid, Argentina"
                />
                <MatchText tone="muted" style={{ fontSize: 12, lineHeight: 16 }}>
                  Separate multiple teams with commas.
                </MatchText>
              </Field>

              <Field label="Watching vibe">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {vibeOptions.map((option) => {
                    const selected = vibe === option;

                    return (
                      <Pressable
                        key={option}
                        onPress={() => setVibe(option)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? theme.accent : theme.border,
                          backgroundColor: selected ? theme.accentSoft : theme.backgroundMuted,
                        }}>
                        <MatchText style={{ color: selected ? theme.accent : theme.text, fontSize: 14, fontWeight: '800' }}>
                          {option}
                        </MatchText>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label="Bio">
                <TextField
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Host loud watch-parties on my rooftop."
                  multiline
                  style={{ minHeight: 96, textAlignVertical: 'top' }}
                />
              </Field>

              <View
                style={{
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundMuted,
                  padding: 16,
                  gap: 12,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <MatchText variant="subtitle">Hosting setup</MatchText>
                    <MatchText tone="muted" style={{ fontSize: 13, lineHeight: 18 }}>
                      Turn this on if you want guests to see your TV and audio setup.
                    </MatchText>
                  </View>
                  <Switch value={isHost} onValueChange={setIsHost} />
                </View>

                {isHost ? (
                  <View style={{ gap: 14 }}>
                    <Field label="Screen size">
                      <TextField value={screenSize} onChangeText={setScreenSize} placeholder='75"' />
                    </Field>
                    <Field label="Display type">
                      <TextField value={displayType} onChangeText={setDisplayType} placeholder="4K OLED" />
                    </Field>
                    <Field label="Audio">
                      <TextField value={audio} onChangeText={setAudio} placeholder="Dolby Atmos soundbar" />
                    </Field>
                  </View>
                ) : null}
              </View>

              {error ? (
                <MatchText tone="warm" style={{ fontSize: 14 }}>
                  {error}
                </MatchText>
              ) : null}

              <Pressable
                disabled={loading}
                onPress={() => {
                  handleSubmit().catch(() => undefined);
                }}
                style={({ pressed }) => ({
                  minHeight: 56,
                  borderRadius: 999,
                  backgroundColor: theme.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed || loading ? 0.92 : 1,
                })}>
                {loading ? (
                  <ActivityIndicator color="#111722" />
                ) : (
                  <MatchText variant="title" style={{ color: '#111722', fontSize: 18, lineHeight: 20 }}>
                    {profile ? 'Update profile' : 'Save profile'}
                  </MatchText>
                )}
              </Pressable>
            </View>
          </SurfaceCard>
        </View>
      </ScrollView>
    </>
  );
}

function Field({
  children,
  label,
  style,
}: {
  children: ReactNode;
  label: string;
  style?: object;
}) {
  return (
    <View style={[{ gap: 8 }, style]}>
      <MatchText variant="label" tone="muted">
        {label}
      </MatchText>
      {children}
    </View>
  );
}

function TextField({
  multiline,
  onChangeText,
  placeholder,
  style,
  value,
}: {
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  style?: object;
  value: string;
}) {
  const theme = useTheme();

  return (
    <TextInput
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor="rgba(232, 238, 245, 0.45)"
      selectionColor={theme.accent}
      style={[
        {
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          backgroundColor: 'rgba(255,255,255,0.04)',
          color: theme.text,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
        },
        style,
      ]}
      value={value}
      onChangeText={onChangeText}
    />
  );
}
