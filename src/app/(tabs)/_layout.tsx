import { Platform } from 'react-native';
import { Tabs, useSegments } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function TabIcon({
  focused,
  symbolName,
}: {
  focused: boolean;
  symbolName: any;
}) {
  const theme = useTheme();
  const color = focused ? theme.accent : theme.textSecondary;

  return (
    <SymbolView
      name={symbolName}
      size={28}
      tintColor={color}
      type="monochrome"
    />
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const segments = useSegments() as string[];
  const hideTabBar = segments.includes('listing') || segments.includes('fan') || segments.includes('chat') || segments.includes('room');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarActiveBackgroundColor: 'rgba(160, 255, 97, 0.14)',
        tabBarStyle: {
          display: hideTabBar ? 'none' : 'flex',
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 12 : 8,
          height: 72,
          paddingTop: 7,
          paddingBottom: 8,
          paddingHorizontal: 9,
          borderTopWidth: 1,
          borderColor: theme.border,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          borderBottomLeftRadius: 26,
          borderBottomRightRadius: 26,
          backgroundColor: theme.backgroundElement,
          boxShadow: `0 16px 40px ${theme.shadow}`,
          ...(Platform.OS === 'web'
            ? {
                width: 408,
                left: '50%',
                marginLeft: -204,
              }
            : {
                left: 12,
                right: 12,
              }),
        },
        tabBarItemStyle: {
          borderRadius: 22,
          marginHorizontal: 2,
          marginVertical: 2,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.rounded,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.25,
          paddingBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 1,
        },
        sceneStyle: {
          backgroundColor: theme.background,
        },
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Fixtures',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} symbolName={{ ios: 'house.fill', android: 'home', web: 'home' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="(fans)"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} symbolName={{ ios: 'location.north.circle.fill', android: 'explore', web: 'explore' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="(listings)"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} symbolName={{ ios: 'bubble.left.and.bubble.right.fill', android: 'chat_bubble', web: 'chat_bubble' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} symbolName={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }} />
          ),
        }}
      />
    </Tabs>
  );
}
