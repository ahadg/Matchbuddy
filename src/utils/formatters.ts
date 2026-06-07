import type { FanProfile } from '@/types/matchbuddy';

export function formatFixtureKickoff(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatFixtureDay(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

export function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(1)} km away`;
}

export function formatAvailability(approvedGuests: number, maxGuests: number) {
  const left = maxGuests - approvedGuests;
  return `${left} of ${maxGuests} spots left`;
}

export function setupSummary(fan: FanProfile) {
  if (!fan.setup) {
    return 'Watching as a guest for now';
  }

  return `${fan.setup.screenSize} ${fan.setup.displayType} · ${fan.setup.audio}`;
}
