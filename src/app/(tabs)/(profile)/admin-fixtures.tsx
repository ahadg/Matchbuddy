import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { MATCHBUDDY_ADMIN_EMAIL } from '@/constants/admin';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiConfigurationError, createFixture, getFixtures, updateFixture } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { ApiFixture } from '@/types/api';

type FixtureDraft = {
  awayCode: string;
  awayTeam: string;
  highlight: string;
  homeCode: string;
  homeTeam: string;
  hostCity: string;
  kickoffAt: string;
  slug: string;
  stage: string;
  venue: string;
};

const emptyDraft: FixtureDraft = {
  awayCode: '',
  awayTeam: '',
  highlight: '',
  homeCode: '',
  homeTeam: '',
  hostCity: '',
  kickoffAt: '',
  slug: '',
  stage: '',
  venue: '',
};

const stagePresets = [
  'Group Stage',
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Third-place play-off',
  'Final',
] as const;

export default function AdminFixturesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const session = useAuthStore((state) => state.session);
  const isAdmin = session?.user?.email?.trim().toLowerCase() === MATCHBUDDY_ADMIN_EMAIL;
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [selectedFixtureId, setSelectedFixtureId] = useState<null | string>(null);
  const [draft, setDraft] = useState<FixtureDraft>(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFixtures() {
      setLoading(true);
      setError(null);

      try {
        const nextFixtures = await getFixtures();

        if (!cancelled) {
          setFixtures(nextFixtures);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (!(loadError instanceof ApiConfigurationError)) {
            setError(loadError instanceof Error ? loadError.message : 'Could not load fixtures.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (isAdmin) {
      loadFixtures().catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const selectedFixture = useMemo(
    () => fixtures.find((fixture) => fixture.id === selectedFixtureId) ?? null,
    [fixtures, selectedFixtureId],
  );
  const stageCounts = useMemo(() => {
    return fixtures.reduce<Record<string, number>>((counts, fixture) => {
      counts[fixture.stage] = (counts[fixture.stage] ?? 0) + 1;
      return counts;
    }, {});
  }, [fixtures]);

  function fillDraftFromFixture(fixture: ApiFixture) {
    setSelectedFixtureId(fixture.id);
    setDraft({
      awayCode: fixture.awayCode,
      awayTeam: fixture.awayTeam,
      highlight: fixture.highlight,
      homeCode: fixture.homeCode,
      homeTeam: fixture.homeTeam,
      hostCity: fixture.hostCity,
      kickoffAt: fixture.kickoffAt,
      slug: fixture.slug,
      stage: fixture.stage,
      venue: fixture.venue,
    });
  }

  function resetDraft() {
    setSelectedFixtureId(null);
    setDraft(emptyDraft);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        awayCode: draft.awayCode.trim().toUpperCase(),
        awayTeam: draft.awayTeam.trim(),
        highlight: draft.highlight.trim(),
        homeCode: draft.homeCode.trim().toUpperCase(),
        homeTeam: draft.homeTeam.trim(),
        hostCity: draft.hostCity.trim(),
        kickoffAt: draft.kickoffAt.trim(),
        slug: draft.slug.trim(),
        stage: draft.stage.trim(),
        venue: draft.venue.trim(),
      };

      const savedFixture = selectedFixtureId
        ? await updateFixture(selectedFixtureId, payload)
        : await createFixture(payload);

      const nextFixtures = selectedFixtureId
        ? fixtures.map((fixture) => (fixture.id === savedFixture.id ? savedFixture : fixture))
        : [...fixtures, savedFixture];

      nextFixtures.sort((left, right) => left.kickoffAt.localeCompare(right.kickoffAt));

      setFixtures(nextFixtures);
      fillDraftFromFixture(savedFixture);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this fixture.');
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <>
        <Stack.Screen options={{ title: 'Admin fixtures' }} />
        <View style={{ flex: 1, backgroundColor: theme.background, padding: Spacing.three, justifyContent: 'center' }}>
          <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
            <SurfaceCard style={{ padding: 20, gap: 10, borderRadius: 28 }}>
              <MatchText variant="title">Admin access only</MatchText>
              <MatchText tone="muted">
                This screen is reserved for the MatchBuddy admin account.
              </MatchText>
              <Pressable
                onPress={() => {
                  router.back();
                }}
                style={{
                  minHeight: 52,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.accent,
                }}>
                <MatchText variant="title" style={{ color: '#0B121A', fontSize: 18, lineHeight: 20 }}>
                  Go back
                </MatchText>
              </Pressable>
            </SurfaceCard>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Admin fixtures' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.three,
          paddingTop: Spacing.three,
          paddingBottom: BottomTabInset + 28,
        }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 18 }}>
          <View style={{ gap: 4 }}>
            <MatchText variant="label" tone="muted">
              Admin
            </MatchText>
            <MatchText variant="hero" style={{ fontSize: 34, lineHeight: 36 }}>
              Fixtures manager
            </MatchText>
            <MatchText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
              Import is already live. Use this screen to overwrite knockout placeholders or add custom matches.
            </MatchText>
          </View>

          <SurfaceCard
            style={{
              padding: 18,
              borderRadius: 24,
              backgroundColor: '#171D30',
              borderColor: 'rgba(255,255,255,0.10)',
              gap: 10,
            }}>
            <MatchText variant="title" style={{ fontSize: 22, lineHeight: 24 }}>
              Tournament controls
            </MatchText>
            <MatchText tone="muted" style={{ fontSize: 13, lineHeight: 18 }}>
              {fixtures.length} fixtures loaded. Edit placeholder knockout pairings here when the bracket gets confirmed.
            </MatchText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {stagePresets.map((stage) => (
                <View
                  key={stage}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}>
                  <MatchText tone="muted" style={{ fontSize: 12, fontWeight: '700' }}>
                    {stage} · {stageCounts[stage] ?? 0}
                  </MatchText>
                </View>
              ))}
            </View>
          </SurfaceCard>

          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <Pressable
              onPress={resetDraft}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: 'rgba(160,255,97,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(160,255,97,0.22)',
              }}>
              <MatchText tone="accent" style={{ fontWeight: '800' }}>
                Add new fixture
              </MatchText>
            </Pressable>
            <Pressable
              onPress={() => {
                router.back();
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.10)',
              }}>
              <MatchText tone="muted" style={{ fontWeight: '700' }}>
                Close
              </MatchText>
            </Pressable>
          </View>

          <SurfaceCard
            style={{
              padding: 18,
              borderRadius: 28,
              backgroundColor: '#171D30',
              borderColor: 'rgba(255,255,255,0.10)',
              gap: 12,
            }}>
            <MatchText variant="title" style={{ fontSize: 22, lineHeight: 24 }}>
              {selectedFixture ? 'Edit selected fixture' : 'Create a fixture'}
            </MatchText>
            <MatchText tone="muted" style={{ fontSize: 13, lineHeight: 18 }}>
              Use ISO UTC for kickoff, for example `2026-07-19T19:00:00.000Z`.
            </MatchText>

            <Input label="Slug (optional)" value={draft.slug} onChangeText={(value) => setDraft((current) => ({ ...current, slug: value }))} />
            <Input label="Stage" value={draft.stage} onChangeText={(value) => setDraft((current) => ({ ...current, stage: value }))} />
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {stagePresets.map((stage) => (
                <Pressable
                  key={stage}
                  onPress={() => {
                    setDraft((current) => ({ ...current, stage }));
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor:
                      draft.stage === stage ? 'rgba(160,255,97,0.14)' : 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor:
                      draft.stage === stage ? 'rgba(160,255,97,0.22)' : 'rgba(255,255,255,0.08)',
                  }}>
                  <MatchText
                    tone={draft.stage === stage ? 'accent' : 'muted'}
                    style={{ fontSize: 12, fontWeight: '800' }}>
                    {stage}
                  </MatchText>
                </Pressable>
              ))}
            </View>
            <Input label="Kickoff UTC" value={draft.kickoffAt} onChangeText={(value) => setDraft((current) => ({ ...current, kickoffAt: value }))} />
            <Input label="Home code" value={draft.homeCode} onChangeText={(value) => setDraft((current) => ({ ...current, homeCode: value }))} />
            <Input label="Home team" value={draft.homeTeam} onChangeText={(value) => setDraft((current) => ({ ...current, homeTeam: value }))} />
            <Input label="Away code" value={draft.awayCode} onChangeText={(value) => setDraft((current) => ({ ...current, awayCode: value }))} />
            <Input label="Away team" value={draft.awayTeam} onChangeText={(value) => setDraft((current) => ({ ...current, awayTeam: value }))} />
            <Input label="Venue" value={draft.venue} onChangeText={(value) => setDraft((current) => ({ ...current, venue: value }))} />
            <Input label="Host city" value={draft.hostCity} onChangeText={(value) => setDraft((current) => ({ ...current, hostCity: value }))} />
            <Input
              label="Highlight"
              value={draft.highlight}
              multiline
              onChangeText={(value) => setDraft((current) => ({ ...current, highlight: value }))}
            />

            {error ? (
              <MatchText tone="warm" style={{ fontSize: 14 }}>
                {error}
              </MatchText>
            ) : null}

            <Pressable
              onPress={() => {
                handleSave().catch(() => undefined);
              }}
              style={{
                minHeight: 52,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.accent,
              }}>
              <MatchText variant="title" style={{ color: '#0B121A', fontSize: 18, lineHeight: 20 }}>
                {saving ? 'Saving…' : selectedFixture ? 'Update fixture' : 'Create fixture'}
              </MatchText>
            </Pressable>
          </SurfaceCard>

          <View style={{ gap: 10 }}>
            <MatchText variant="title" style={{ fontSize: 24, lineHeight: 26 }}>
              All fixtures
            </MatchText>
            {loading ? (
              <SurfaceCard style={{ borderRadius: 24 }}>
                <MatchText tone="muted">Loading fixtures…</MatchText>
              </SurfaceCard>
            ) : null}
            {fixtures.map((fixture) => (
              <Pressable
                key={fixture.id}
                onPress={() => fillDraftFromFixture(fixture)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.95 : 1,
                })}>
                <SurfaceCard
                  style={{
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor: selectedFixtureId === fixture.id ? 'rgba(160,255,97,0.12)' : '#171D30',
                    borderColor: selectedFixtureId === fixture.id ? 'rgba(160,255,97,0.22)' : 'rgba(255,255,255,0.10)',
                    gap: 6,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <MatchText variant="subtitle">
                      {fixture.homeCode} vs {fixture.awayCode}
                    </MatchText>
                    <MatchText tone="muted" style={{ fontSize: 12 }}>
                      {fixture.stage}
                    </MatchText>
                  </View>
                  <MatchText style={{ fontSize: 15, lineHeight: 20 }}>
                    {fixture.homeTeam} vs {fixture.awayTeam}
                  </MatchText>
                  <MatchText tone="muted" style={{ fontSize: 13, lineHeight: 18 }}>
                    {formatDateTime(fixture.kickoffAt)} · {fixture.venue}
                  </MatchText>
                </SurfaceCard>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function Input({
  label,
  multiline = false,
  onChangeText,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <MatchText variant="caption" tone="muted">
        {label}
      </MatchText>
      <TextInput
        multiline={multiline}
        placeholder={label}
        placeholderTextColor="rgba(232, 238, 245, 0.38)"
        selectionColor={theme.accent}
        style={{
          minHeight: multiline ? 92 : 52,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          backgroundColor: '#11182A',
          color: theme.text,
          fontSize: 15,
          paddingHorizontal: 16,
          paddingVertical: 14,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date);
}
