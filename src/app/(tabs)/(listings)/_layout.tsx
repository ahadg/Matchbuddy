import { Stack } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = {
  anchor: 'listings',
};

export default function ListingsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontFamily: Fonts.rounded,
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}>
      <Stack.Screen name="listings" />
      <Stack.Screen name="listing/[listingId]" />
    </Stack>
  );
}
