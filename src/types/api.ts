import type { HostSetup, WatchingVibe } from '@/types/matchbuddy';

export type ApiEnvelope<T> = {
  data: T;
};

export type ApiWaveStatus = 'none' | 'pending' | 'received' | 'mutual';
export type ApiListingRequestStatus = 'none' | 'pending' | 'approved' | 'declined' | 'cancelled';

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
  avatarUrl: null | string;
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
  avatarUrl: null | string;
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
  waveStatus: ApiWaveStatus;
  directThreadId: null | string;
};

export type ApiFanDetail = ApiNearbyFan & {
  age: number;
  bio: string;
  favouriteTeams: string[];
  myRating: null | number;
};

export type ApiListing = {
  id: string;
  slug: string;
  fixtureId: string;
  fixtureSummary: null | string;
  fixtureStage: string;
  hostId: string;
  hostName: string;
  hostInitial: string;
  hostVerified: boolean;
  hostRating: number;
  hostHostWins: number;
  neighborhood: string;
  vibe: WatchingVibe;
  maxGuests: number;
  approvedGuests: number;
  spotsLeft: number;
  extras: string[];
  houseRules: string[];
  joinMessage: string;
  priceNote: string;
  distanceKm: null | number;
  isOpen: boolean;
  myRequestStatus: ApiListingRequestStatus;
  isHost: boolean;
  canOpenRoom: boolean;
};

export type ApiListingDetail = ApiListing & {
  hostBio: string;
  hostSetup: HostSetup | null;
  homeCode: string;
  homeTeam: string;
  awayCode: string;
  awayTeam: string;
  venue: string;
};

export type ApiWaveResult = {
  status: ApiWaveStatus;
  threadId: null | string;
  fanId: string;
};

export type ApiFanRatingResult = {
  fanId: string;
  rating: number;
  ratingCount: number;
  myRating: number;
};

export type ApiJoinRequest = {
  id: string;
  listingId: string;
  guestProfileId: string;
  message: string;
  status: Exclude<ApiListingRequestStatus, 'none'>;
  respondedAt: null | string;
};

export type ApiDirectThreadPreview = {
  id: string;
  otherProfileId: string;
  otherAvatarUrl: null | string;
  otherDisplayName: string;
  otherInitial: string;
  otherVibe: WatchingVibe;
  otherNeighborhood: string;
  fixtureSummary: null | string;
  fixtureStage: null | string;
  lastMessage: null | string;
  lastMessageAt: string;
};

export type ApiIncomingWave = {
  id: string;
  fromProfileId: string;
  fromNeighborhood: string;
  fromCity: string;
  fixtureSummary: null | string;
  createdAt: string;
};

export type ApiGroupRoomPreview = {
  listingId: string;
  slug: string;
  vibe: WatchingVibe;
  hostId: string;
  hostAvatarUrl: null | string;
  hostName: string;
  isHost: boolean;
  attendeeCount: number;
  maxGuests: number;
  fixtureSummary: null | string;
  fixtureStage: string;
  lastMessage: null | string;
  lastMessageAt: null | string;
  myRequestStatus: 'host' | Exclude<ApiListingRequestStatus, 'none'>;
};

export type ApiChatsInbox = {
  directThreads: ApiDirectThreadPreview[];
  incomingWaves: ApiIncomingWave[];
  groupRooms: ApiGroupRoomPreview[];
};

export type ApiDirectThread = {
  id: string;
  otherProfileId: string;
  otherAvatarUrl: null | string;
  otherDisplayName: string;
  otherInitial: string;
  otherVibe: WatchingVibe;
  otherNeighborhood: string;
  fixtureSummary: null | string;
  fixtureStage: null | string;
};

export type ApiDirectMessage = {
  id: string;
  threadId: string;
  senderProfileId: string;
  senderAvatarUrl: null | string;
  senderDisplayName: string;
  senderInitial: string;
  body: string;
  createdAt: string;
};

export type ApiDirectThreadMessages = {
  thread: ApiDirectThread;
  messages: ApiDirectMessage[];
};

export type ApiListingRoom = {
  listingId: string;
  slug: string;
  hostAvatarUrl: null | string;
  hostName: string;
  isHost: boolean;
  vibe: WatchingVibe;
  attendeeCount: number;
  maxGuests: number;
  joinMessage: string;
  fixtureSummary: null | string;
  fixtureStage: string;
};

export type ApiListingMessage = {
  id: string;
  listingId: string;
  senderProfileId: string;
  senderAvatarUrl: null | string;
  senderDisplayName: string;
  senderInitial: string;
  body: string;
  createdAt: string;
};

export type ApiListingRoomMessages = {
  room: ApiListingRoom;
  messages: ApiListingMessage[];
};
