import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, Text, type TextProps, useWindowDimensions, View, type ViewProps } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Fonts, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FanProfile, Fixture, Listing, WatchingVibe } from '@/types/matchbuddy';
import { formatDistance, formatFixtureKickoff, setupSummary } from '@/utils/formatters';

type Tone = 'default' | 'accent' | 'warm' | 'danger' | 'muted';
type TextTone = 'default' | 'muted' | 'inverse' | 'accent' | 'warm' | 'danger';
type TextVariant = 'hero' | 'title' | 'subtitle' | 'body' | 'bodyLarge' | 'label' | 'caption';

type MatchTextProps = TextProps & {
  tone?: TextTone;
  variant?: TextVariant;
};

type SurfaceCardProps = ViewProps & {
  enteringDelay?: number;
  tone?: Tone;
};

type PillProps = {
  children: string;
  tone?: Tone;
};

type MetricProps = {
  label: string;
  value: string;
  tone?: Tone;
};

type SectionRowProps = {
  title: string;
  action?: string;
};

const vibeTone: Record<WatchingVibe, Tone> = {
  Loud: 'accent',
  Chill: 'default',
  Family: 'warm',
  'Women-only': 'danger',
};

export function MatchText({
  children,
  selectable,
  style,
  tone = 'default',
  variant = 'body',
  ...rest
}: MatchTextProps) {
  const theme = useTheme();

  const color = {
    default: theme.text,
    muted: theme.textSecondary,
    inverse: theme.textInverted,
    accent: theme.accent,
    warm: theme.warm,
    danger: theme.danger,
  }[tone];

  const fontStyle = {
    hero: {
      fontFamily: Fonts.display,
      fontSize: 28,
      lineHeight: 31,
      fontWeight: '800' as const,
      letterSpacing: -0.7,
    },
    title: {
      fontFamily: Fonts.display,
      fontSize: 22,
      lineHeight: 26,
      fontWeight: '800' as const,
      letterSpacing: -0.45,
    },
    subtitle: {
      fontFamily: Fonts.rounded,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '700' as const,
    },
    bodyLarge: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500' as const,
    },
    label: {
      fontFamily: Fonts.rounded,
      fontSize: 8,
      lineHeight: 11,
      fontWeight: '700' as const,
      letterSpacing: 1.05,
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '600' as const,
    },
  }[variant];

  return (
    <Text
      selectable={selectable ?? variant !== 'label'}
      style={[{ color }, fontStyle, style]}
      {...rest}>
      {children}
    </Text>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  description,
  trailing,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.three,
      }}>
      <View style={{ flex: 1, gap: Spacing.one }}>
        <MatchText variant="label" tone="muted">
          {eyebrow}
        </MatchText>
        <MatchText variant="title">{title}</MatchText>
        {description ? <MatchText tone="muted">{description}</MatchText> : null}
      </View>
      {trailing ? <View style={{ paddingTop: Spacing.one }}>{trailing}</View> : null}
    </View>
  );
}

export function TopBar({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: Spacing.three,
        minHeight: 64,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        {subtitle ? (
          <MatchText variant="label" tone="muted">
            {subtitle}
          </MatchText>
        ) : null}
        <MatchText variant="hero">{title}</MatchText>
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const theme = useTheme();
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();

  const palettes = [
    { bg: theme.accent, fg: theme.textInverted },
    { bg: theme.warmSoft, fg: theme.warm },
    { bg: theme.infoSoft, fg: theme.info },
    { bg: theme.violetSoft, fg: theme.danger },
  ];
  const palette = palettes[name.charCodeAt(0) % palettes.length];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(18, Math.floor(size * 0.32)),
        borderWidth: 1.5,
        borderColor: theme.border,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 14px 30px ${theme.shadow}`,
      }}>
      <Text
        selectable={false}
        style={{
          color: palette.fg,
          fontFamily: Fonts.rounded,
          fontSize: Math.floor(size * 0.34),
          fontWeight: '700',
          letterSpacing: 0.4,
        }}>
        {initials}
      </Text>
    </View>
  );
}

export function SurfaceCard({
  children,
  enteringDelay = 0,
  style,
  tone = 'default',
  ...rest
}: SurfaceCardProps) {
  const theme = useTheme();

  const palette = {
    default: {
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
      sheen: theme.glassStrong,
    },
    accent: {
      backgroundColor: theme.accentSoft,
      borderColor: 'rgba(184, 255, 97, 0.22)',
      sheen: 'rgba(184, 255, 97, 0.16)',
    },
    warm: {
      backgroundColor: theme.warmSoft,
      borderColor: 'rgba(255, 141, 98, 0.22)',
      sheen: 'rgba(255, 141, 98, 0.18)',
    },
    danger: {
      backgroundColor: theme.dangerSoft,
      borderColor: 'rgba(185, 131, 255, 0.24)',
      sheen: 'rgba(185, 131, 255, 0.20)',
    },
    muted: {
      backgroundColor: theme.backgroundMuted,
      borderColor: theme.border,
      sheen: theme.glass,
    },
  }[tone];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(22).delay(enteringDelay)}
      style={[
        {
          borderRadius: Radii.large,
          borderWidth: 1,
          padding: 12,
          gap: 10,
          overflow: 'hidden',
          boxShadow: `0 18px 38px ${theme.shadow}`,
        },
        palette,
        style,
      ]}
      {...rest}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '34%',
          backgroundColor: palette.sheen,
          opacity: 0.28,
          pointerEvents: 'none',
        }}
      />
      {children}
    </Animated.View>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={{ gap: Spacing.one }}>
      <MatchText variant="label" tone="muted">
        {eyebrow}
      </MatchText>
      <MatchText variant="subtitle">{title}</MatchText>
      {description ? <MatchText tone="muted">{description}</MatchText> : null}
    </View>
  );
}

export function SectionRow({ title, action }: SectionRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
      }}>
      <MatchText variant="subtitle">{title}</MatchText>
      {action ? (
        <MatchText variant="label" tone="accent">
          {action}
        </MatchText>
      ) : null}
    </View>
  );
}

export function Pill({ children, tone = 'default' }: PillProps) {
  const theme = useTheme();

  const palette = {
    default: {
      backgroundColor: theme.backgroundSelected,
      color: theme.text,
      borderColor: theme.border,
    },
    accent: {
      backgroundColor: theme.accentSoft,
      color: theme.accent,
      borderColor: 'rgba(184, 255, 97, 0.26)',
    },
    warm: {
      backgroundColor: theme.warmSoft,
      color: theme.warm,
      borderColor: 'rgba(255, 141, 98, 0.24)',
    },
    danger: {
      backgroundColor: theme.dangerSoft,
      color: theme.danger,
      borderColor: 'rgba(185, 131, 255, 0.24)',
    },
    muted: {
      backgroundColor: theme.backgroundMuted,
      color: theme.textSecondary,
      borderColor: theme.border,
    },
  }[tone];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radii.pill,
        backgroundColor: palette.backgroundColor,
        borderWidth: 1,
        borderColor: palette.borderColor,
      }}>
      <MatchText variant="label" style={{ color: palette.color }}>
        {children}
      </MatchText>
    </View>
  );
}

export function IconBadge({
  label,
  tone = 'default',
  size = 38,
}: {
  label: string;
  tone?: Tone;
  size?: number;
}) {
  const theme = useTheme();

  const palette = {
    default: { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
    accent: { backgroundColor: theme.accentSoft, color: theme.accent, borderColor: 'rgba(184, 255, 97, 0.24)' },
    warm: { backgroundColor: theme.warmSoft, color: theme.warm, borderColor: 'rgba(255, 141, 98, 0.24)' },
    danger: { backgroundColor: theme.dangerSoft, color: theme.danger, borderColor: 'rgba(185, 131, 255, 0.24)' },
    muted: { backgroundColor: theme.backgroundMuted, color: theme.textSecondary, borderColor: theme.border },
  }[tone];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.floor(size / 2.15),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.backgroundColor,
        borderWidth: 1,
        borderColor: palette.borderColor,
        boxShadow: `0 12px 28px ${theme.shadow}`,
      }}>
      <MatchText variant="caption" style={{ color: palette.color }}>
        {label}
      </MatchText>
    </View>
  );
}

export function ActionButton({
  children,
  tone = 'default',
  onPress,
}: {
  children: ReactNode;
  tone?: Tone;
  onPress?: () => void;
}) {
  const theme = useTheme();

  const palette = {
    default: {
      backgroundColor: theme.backgroundSelected,
      borderColor: theme.border,
      color: theme.text,
    },
    accent: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
      color: theme.textInverted,
    },
    warm: {
      backgroundColor: theme.warm,
      borderColor: theme.warm,
      color: theme.textInverted,
    },
    danger: {
      backgroundColor: theme.danger,
      borderColor: theme.danger,
      color: theme.textInverted,
    },
    muted: {
      backgroundColor: theme.backgroundMuted,
      borderColor: theme.border,
      color: theme.textSecondary,
    },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: Radii.pill,
        backgroundColor: palette.backgroundColor,
        borderWidth: 1,
        borderColor: palette.borderColor,
        opacity: pressed ? 0.94 : 1,
        boxShadow: tone === 'default' ? `0 12px 24px ${theme.shadow}` : `0 18px 34px ${theme.shadow}`,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}>
      <MatchText variant="caption" selectable={false} style={{ color: palette.color, textAlign: 'center' }}>
        {children}
      </MatchText>
    </Pressable>
  );
}

export function MetricTile({ label, value, tone = 'default' }: MetricProps) {
  const theme = useTheme();

  const palette = {
    default: { bg: theme.backgroundElement, fg: theme.text, borderColor: theme.border },
    accent: { bg: theme.accentSoft, fg: theme.accent, borderColor: 'rgba(184, 255, 97, 0.24)' },
    warm: { bg: theme.warmSoft, fg: theme.warm, borderColor: 'rgba(255, 141, 98, 0.24)' },
    danger: { bg: theme.dangerSoft, fg: theme.danger, borderColor: 'rgba(185, 131, 255, 0.24)' },
    muted: { bg: theme.backgroundMuted, fg: theme.textSecondary, borderColor: theme.border },
  }[tone];

  return (
    <View
      style={{
        flex: 1,
        minWidth: 96,
        gap: Spacing.one,
        borderRadius: 22,
        padding: 14,
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.borderColor,
      }}>
      <MatchText variant="label" tone="muted">
        {label}
      </MatchText>
      <MatchText variant="title" style={{ color: palette.fg }}>
        {value}
      </MatchText>
    </View>
  );
}

export function QuickActionCard({
  title,
  subtitle,
  tone = 'default',
}: {
  title: string;
  subtitle: string;
  tone?: Tone;
}) {
  const theme = useTheme();

  const palette = {
    default: {
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
      dot: theme.info,
    },
    accent: {
      backgroundColor: theme.accentSoft,
      borderColor: theme.accent,
      dot: theme.accent,
    },
    warm: {
      backgroundColor: theme.warmSoft,
      borderColor: theme.warm,
      dot: theme.warm,
    },
    danger: {
      backgroundColor: theme.dangerSoft,
      borderColor: theme.danger,
      dot: theme.danger,
    },
    muted: {
      backgroundColor: theme.backgroundSelected,
      borderColor: theme.border,
      dot: theme.textSecondary,
    },
  }[tone];

  return (
    <View
      style={{
        minWidth: 132,
        gap: Spacing.two,
        padding: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: palette.borderColor,
        backgroundColor: palette.backgroundColor,
        boxShadow: `0 16px 32px ${theme.shadow}`,
      }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: Radii.pill,
          backgroundColor: palette.dot,
        }}
      />
      <View style={{ gap: 2 }}>
        <MatchText variant="caption">{title}</MatchText>
        <MatchText variant="caption" tone="muted">
          {subtitle}
        </MatchText>
      </View>
    </View>
  );
}

export function AuroraBackdrop({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();

  return (
    <>
      <View
        style={{
          position: 'absolute',
          top: compact ? -106 : -166,
          right: compact ? -104 : -148,
          width: compact ? 156 : 218,
          height: compact ? 156 : 218,
          borderRadius: 999,
          backgroundColor: theme.violetSoft,
          opacity: compact ? 0.38 : 0.46,
          pointerEvents: 'none',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: compact ? 124 : 188,
          left: compact ? -112 : -154,
          width: compact ? 132 : 178,
          height: compact ? 132 : 178,
          borderRadius: 999,
          backgroundColor: theme.accentSoft,
          opacity: compact ? 0.18 : 0.22,
          pointerEvents: 'none',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: compact ? 18 : 36,
          right: compact ? -42 : -58,
          width: compact ? 108 : 150,
          height: compact ? 108 : 150,
          borderRadius: 999,
          backgroundColor: theme.warmSoft,
          opacity: compact ? 0.14 : 0.18,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.two,
        paddingVertical: 4,
      }}>
      <MatchText variant="label" tone="muted" style={{ flexShrink: 1 }}>
        {label}
      </MatchText>
      <MatchText variant="caption" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </MatchText>
    </View>
  );
}

export function CapacityBar({ approved, max }: { approved: number; max: number }) {
  const theme = useTheme();
  const progress = Math.min(approved / max, 1);
  const spotsLeft = max - approved;
  const color = progress >= 1 ? theme.danger : progress >= 0.75 ? theme.warm : theme.accent;

  return (
    <View style={{ gap: Spacing.one }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <MatchText variant="label" tone="muted">
          Capacity
        </MatchText>
        <MatchText variant="caption" style={{ color }}>
          {approved}/{max} · {progress >= 1 ? 'Full' : `${spotsLeft} left`}
        </MatchText>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: Radii.pill,
          backgroundColor: theme.backgroundSelected,
          overflow: 'hidden',
        }}>
        <View
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: '100%',
            borderRadius: Radii.pill,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

export function FilterRow({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
      {options.map((option) => {
        const isSelected = option === selected;

        return (
          <Pressable key={option} onPress={() => onSelect(option)}>
            <Pill tone={isSelected ? 'accent' : 'default'}>{option}</Pill>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FixtureCard({ fixture, index = 0 }: { fixture: Fixture; index?: number }) {
  const theme = useTheme();

  return (
    <SurfaceCard enteringDelay={index * 40} style={{ minWidth: 242, padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two }}>
        <Pill tone="warm">{fixture.stage}</Pill>
        <MatchText variant="label" tone="muted">
          {formatFixtureKickoff(fixture.kickoffAt)}
        </MatchText>
      </View>

      <View
        style={{
          borderRadius: 22,
          padding: 16,
          backgroundColor: theme.backgroundSelected,
          gap: Spacing.three,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two }}>
          <MatchText variant="bodyLarge" style={{ flex: 1 }}>
            {fixture.homeTeam}
          </MatchText>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: Radii.pill,
              backgroundColor: theme.backgroundMuted,
            }}>
            <MatchText variant="label" tone="muted">
              vs
            </MatchText>
          </View>
          <MatchText variant="bodyLarge" style={{ flex: 1, textAlign: 'right' }}>
            {fixture.awayTeam}
          </MatchText>
        </View>
        <MatchText variant="caption" tone="muted">
          {fixture.venue} · {fixture.hostCity}
        </MatchText>
      </View>

      <MatchText variant="caption" tone="muted" numberOfLines={2}>
        {fixture.highlight}
      </MatchText>
    </SurfaceCard>
  );
}

export function FanCard({
  fan,
  fixture,
  index = 0,
}: {
  fan: FanProfile;
  fixture?: Fixture;
  index?: number;
}) {
  const theme = useTheme();

  return (
    <Link href={`/fan/${fan.id}`} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
        <SurfaceCard enteringDelay={index * 50} style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three }}>
            <Avatar name={fan.name} size={56} />
            <View style={{ flex: 1, gap: Spacing.half }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two }}>
                <MatchText variant="subtitle" style={{ flex: 1 }}>
                  {fan.name}
                </MatchText>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: Radii.pill,
                    backgroundColor: theme.warmSoft,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 141, 98, 0.24)',
                  }}>
                  <MatchText variant="caption" style={{ color: theme.warm }}>
                    ★ {fan.rating.toFixed(1)}
                  </MatchText>
                </View>
              </View>
              <MatchText variant="caption" tone="muted">
                {fan.neighborhood}, {fan.city} · {formatDistance(fan.distanceKm)}
              </MatchText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
            <Pill tone={vibeTone[fan.vibe]}>{fan.vibe}</Pill>
            {fan.hasScreen ? <Pill tone="accent">Host setup</Pill> : <Pill tone="muted">Guest mode</Pill>}
            {fan.verified ? <Pill tone="warm">18+</Pill> : null}
          </View>

          <MatchText numberOfLines={2}>{fan.bio}</MatchText>

          <View
            style={{
              borderRadius: 20,
              padding: 14,
              backgroundColor: fan.hasScreen ? theme.accentSoft : theme.backgroundSelected,
              gap: Spacing.one,
            }}>
            <MatchText variant="label" tone="muted">
              Setup
            </MatchText>
            <MatchText variant="caption">{setupSummary(fan)}</MatchText>
            <MatchText variant="caption" tone="muted">
              {fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : 'Upcoming'} · {fan.waveBackRate}% back
            </MatchText>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
            {fan.favouriteTeams.slice(0, 2).map((team) => (
              <Pill key={team} tone="default">
                {team}
              </Pill>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <View style={{ flex: 1 }}>
              <ActionButton tone="accent">Wave</ActionButton>
            </View>
            <View style={{ flex: 1 }}>
              <ActionButton>Profile</ActionButton>
            </View>
          </View>
        </SurfaceCard>
      </Pressable>
    </Link>
  );
}

export function ListingCard({
  fan,
  fixture,
  listing,
  index = 0,
}: {
  fan: FanProfile;
  fixture: Fixture;
  listing: Listing;
  index?: number;
}) {
  const theme = useTheme();

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
        <SurfaceCard enteringDelay={index * 60} style={{ gap: 14 }}>
          <View
            style={{
              borderRadius: 22,
              padding: 16,
              backgroundColor: theme.backgroundSelected,
              gap: Spacing.three,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pill tone={vibeTone[listing.vibe]}>{listing.vibe}</Pill>
              <MatchText variant="label" tone="muted">
                {formatFixtureKickoff(fixture.kickoffAt)}
              </MatchText>
            </View>
            <MatchText variant="bodyLarge">
              {fixture.homeTeam} vs {fixture.awayTeam}
            </MatchText>
            <MatchText tone="muted">
              {listing.neighborhood} · {formatDistance(listing.distanceKm)}
            </MatchText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Avatar name={fan.name} size={42} />
            <View style={{ flex: 1, gap: 2 }}>
              <MatchText variant="caption">{fan.name}</MatchText>
              <MatchText variant="caption" tone="muted">
                ★ {fan.rating.toFixed(1)} · {fan.ratingCount} meetups
              </MatchText>
            </View>
            <Pill tone="warm">Host</Pill>
          </View>

          <MatchText numberOfLines={2}>{listing.joinMessage}</MatchText>
          <MatchText variant="caption" tone="muted" numberOfLines={1}>
            {setupSummary(fan)}
          </MatchText>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
            {listing.extras.slice(0, 2).map((extra) => (
              <Pill key={extra} tone="default">
                {extra}
              </Pill>
            ))}
          </View>

          <CapacityBar approved={listing.approvedGuests} max={listing.maxGuests} />

          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <View style={{ flex: 1 }}>
              <ActionButton tone="accent">Request</ActionButton>
            </View>
            <View style={{ flex: 1 }}>
              <ActionButton>Details</ActionButton>
            </View>
          </View>
        </SurfaceCard>
      </Pressable>
    </Link>
  );
}

export function TwoColumn({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1120;

  return (
    <View
      style={{
        flexDirection: isWide ? 'row' : 'column',
        alignItems: 'stretch',
        gap: Spacing.three,
      }}>
      <View style={{ flex: 1, gap: Spacing.three }}>{left}</View>
      <View style={{ flex: 1, gap: Spacing.three }}>{right}</View>
    </View>
  );
}

export function DotDivider() {
  const theme = useTheme();

  return (
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: Radii.pill,
        backgroundColor: theme.border,
      }}
    />
  );
}
