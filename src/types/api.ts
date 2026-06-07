import type { HostSetup, WatchingVibe } from '@/types/matchbuddy';

export type ApiEnvelope<T> = {
  data: T;
};

export type ApiFixture = {
  id: string;
  slug: string;
  stage: string;
  kickoffAt: string;
  homeCode: string;
  homeTeam: string;
  awayCode: string;
  awayTeam: string;
  venue: string;
  hostCity: string;
  highlight: string;
};

export type ApiProfile = {
  id: string;
  authUserId: null | string;
  email: null | string;
  displayName: string;
  age: number;
  bio: string;
  neighborhood: string;
  city: string;
  vibe: WatchingVibe;
  favouriteTeams: string[];
  verified: boolean;
  rating: number;
  ratingCount: number;
  waveBackRate: number;
  hostWins: number;
  isHost: boolean;
  womenOnly: boolean;
  familyFriendly: boolean;
  matchDayModeFixtureId: null | string;
  setup: HostSetup | null;
  location: null | {
    latitude: number;
    longitude: number;
  };
};

export type ApiNearbyFan = {
  id: string;
  displayName: string;
  neighborhood: string;
  city: string;
  vibe: WatchingVibe;
  verified: boolean;
  isHost: boolean;
  womenOnly: boolean;
  familyFriendly: boolean;
  rating: number;
  ratingCount: number;
  waveBackRate: number;
  hostWins: number;
  matchDayModeFixtureId: null | string;
  distanceKm: number;
  initial: string;
  setup: HostSetup | null;
};

export type ApiFanDetail = ApiNearbyFan & {
  age: number;
  bio: string;
  favouriteTeams: string[];
};

export type ApiListing = {
  id: string;
  slug: string;
  fixtureId: string;
  hostId: string;
  hostName: string;
  neighborhood: string;
  vibe: WatchingVibe;
  maxGuests: number;
  approvedGuests: number;
  extras: string[];
  houseRules: string[];
  joinMessage: string;
  priceNote: string;
  distanceKm: number;
  isOpen: boolean;
};
