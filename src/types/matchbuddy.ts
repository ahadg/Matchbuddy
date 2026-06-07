export type WatchingVibe = 'Loud' | 'Chill' | 'Family' | 'Women-only';

export type HostSetup = {
  screenSize: string;
  displayType: string;
  audio: string;
};

export type Fixture = {
  id: string;
  stage: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  hostCity: string;
  highlight: string;
};

export type FanProfile = {
  id: string;
  name: string;
  age: number;
  neighborhood: string;
  city: string;
  distanceKm: number;
  rating: number;
  ratingCount: number;
  bio: string;
  favouriteTeams: string[];
  vibe: WatchingVibe;
  verified: boolean;
  waveBackRate: number;
  hostWins: number;
  hasScreen: boolean;
  womenOnly?: boolean;
  familyFriendly?: boolean;
  matchDayModeFixtureId?: string;
  setup?: HostSetup;
};

export type Listing = {
  id: string;
  fixtureId: string;
  hostId: string;
  neighborhood: string;
  distanceKm: number;
  maxGuests: number;
  approvedGuests: number;
  vibe: WatchingVibe;
  extras: string[];
  houseRules: string[];
  joinMessage: string;
};

export type SafetyTip = {
  title: string;
  body: string;
};

export type CurrentUser = {
  name: string;
  bio: string;
  neighborhood: string;
  city: string;
  favouriteTeams: string[];
  vibe: WatchingVibe;
  setup: HostSetup;
  rating: number;
  ratingCount: number;
  wavesLeftToday: number;
  verified: boolean;
  oneTimeFeeUsd: number;
};
