import { Link, Stack } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { MatchText, SurfaceCard } from '@/components/matchbuddy/ui';
import { Radii } from '@/constants/theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: Spacing.three,
          paddingVertical: Spacing.five,
          justifyContent: 'center',
        }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
          <SurfaceCard tone="danger">
            <MatchText variant="title">That route is offside.</MatchText>
            <MatchText>Try jumping back to the main Match Day feed.</MatchText>
            <Link href="/" asChild>
              <Pressable
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: Radii.pill,
                  backgroundColor: theme.accent,
                  opacity: pressed ? 0.82 : 1,
                })}>
                <MatchText variant="caption" selectable={false} style={{ color: theme.textInverted }}>
                  Back to home
                </MatchText>
              </Pressable>
            </Link>
          </SurfaceCard>
        </View>
      </ScrollView>
    </>
  );
}
