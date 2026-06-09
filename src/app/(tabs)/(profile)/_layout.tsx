import { Stack } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = {
  anchor: 'profile',
  initialRouteName: 'profile',
};

export default function ProfileLayout() {
  const theme = useTheme();

  return (
    <Stack
      initialRouteName="profile"
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
      <Stack.Screen name="profile" />
      <Stack.Screen name="admin-fixtures" />
    </Stack>
  );
}
