import { appConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import type {
  ApiChatsInbox,
  ApiDirectMessage,
  ApiDirectThreadMessages,
  ApiEnvelope,
  ApiFanDetail,
  ApiFanRatingResult,
  ApiFixture,
  ApiJoinRequest,
  ApiListing,
  ApiListingDetail,
  ApiListingMessage,
  ApiListingRoomMessages,
  ApiNearbyFan,
  ApiProfile,
  ApiWaveResult,
} from '@/types/api';
import type { WatchingVibe } from '@/types/matchbuddy';

export class ApiConfigurationError extends Error {
  constructor(message = 'API base URL is not configured.') {
    super(message);
    this.name = 'ApiConfigurationError';
  }
}

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!appConfig.api.enabled) {
    throw new ApiConfigurationError();
  }

  const headers = new Headers(init?.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${appConfig.api.baseUrl}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : `Request failed with ${response.status}`;

    throw new ApiRequestError(response.status, message);
  }

  return payload as T;
}

export async function getFixtures() {
  const response = await apiFetch<ApiEnvelope<ApiFixture[]>>('/api/fixtures');
  return response.data;
}

export async function createFixture(fixture: {
  awayCode: string;
  awayTeam: string;
  highlight: string;
  homeCode: string;
  homeTeam: string;
  hostCity: string;
  kickoffAt: string;
  slug?: string;
  stage: string;
  venue: string;
}) {
  const response = await apiFetch<ApiEnvelope<ApiFixture>>('/api/fixtures', {
    method: 'POST',
    body: JSON.stringify(fixture),
  });

  return response.data;
}

export async function updateFixture(
  fixtureId: string,
  fixture: {
    awayCode: string;
    awayTeam: string;
    highlight: string;
    homeCode: string;
    homeTeam: string;
    hostCity: string;
    kickoffAt: string;
    slug?: string;
    stage: string;
    venue: string;
  },
) {
  const response = await apiFetch<ApiEnvelope<ApiFixture>>(`/api/fixtures/${fixtureId}`, {
    method: 'PUT',
    body: JSON.stringify(fixture),
  });

  return response.data;
}

export async function sendEmailOtp(email: string) {
  const response = await apiFetch<ApiEnvelope<{ email: string; sent: boolean }>>('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  return response.data;
}

export async function getNearbyFans(params: {
  radiusKm: number;
  latitude?: number;
  longitude?: number;
  fixtureId?: string;
  vibe?: WatchingVibe;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  searchParams.set('radiusKm', String(params.radiusKm));

  if (typeof params.latitude === 'number' && typeof params.longitude === 'number') {
    searchParams.set('lat', String(params.latitude));
    searchParams.set('lng', String(params.longitude));
  }

  if (params.fixtureId) {
    searchParams.set('fixtureId', params.fixtureId);
  }

  if (params.vibe) {
    searchParams.set('vibe', params.vibe);
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  const response = await apiFetch<ApiEnvelope<ApiNearbyFan[]>>(`/api/fans/nearby?${searchParams.toString()}`);
  return response.data;
}

export async function getFanById(
  fanId: string,
  params?: {
    latitude?: number;
    longitude?: number;
  },
) {
  const searchParams = new URLSearchParams();

  if (typeof params?.latitude === 'number' && typeof params?.longitude === 'number') {
    searchParams.set('lat', String(params.latitude));
    searchParams.set('lng', String(params.longitude));
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
  const response = await apiFetch<ApiEnvelope<ApiFanDetail>>(`/api/fans/${fanId}${suffix}`);
  return response.data;
}

export async function sendWave(fanId: string) {
  const response = await apiFetch<ApiEnvelope<ApiWaveResult>>(`/api/fans/${fanId}/wave`, {
    method: 'POST',
  });

  return response.data;
}

export async function rateFan(fanId: string, score: number) {
  const response = await apiFetch<ApiEnvelope<ApiFanRatingResult>>(`/api/fans/${fanId}/rate`, {
    method: 'POST',
    body: JSON.stringify({ score }),
  });

  return response.data;
}

export async function getListings(params: {
  radiusKm?: number;
  latitude?: number;
  longitude?: number;
  fixtureId?: string;
}) {
  const searchParams = new URLSearchParams();

  if (typeof params.radiusKm === 'number') {
    searchParams.set('radiusKm', String(params.radiusKm));
  }

  if (typeof params.latitude === 'number' && typeof params.longitude === 'number') {
    searchParams.set('lat', String(params.latitude));
    searchParams.set('lng', String(params.longitude));
  }

  if (params.fixtureId) {
    searchParams.set('fixtureId', params.fixtureId);
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
  const response = await apiFetch<ApiEnvelope<ApiListing[]>>(`/api/listings${suffix}`);
  return response.data;
}

export async function getListingById(
  listingId: string,
  params?: {
    latitude?: number;
    longitude?: number;
  },
) {
  const searchParams = new URLSearchParams();

  if (typeof params?.latitude === 'number' && typeof params?.longitude === 'number') {
    searchParams.set('lat', String(params.latitude));
    searchParams.set('lng', String(params.longitude));
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
  const response = await apiFetch<ApiEnvelope<ApiListingDetail>>(`/api/listings/${listingId}${suffix}`);
  return response.data;
}

export async function requestListingSpot(listingId: string, message?: string) {
  const response = await apiFetch<ApiEnvelope<ApiJoinRequest>>(`/api/listings/${listingId}/join-requests`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  return response.data;
}

export async function getListingRoomMessages(listingId: string) {
  const response = await apiFetch<ApiEnvelope<ApiListingRoomMessages>>(`/api/listings/${listingId}/messages`);
  return response.data;
}

export async function sendListingRoomMessage(listingId: string, body: string) {
  const response = await apiFetch<ApiEnvelope<ApiListingMessage>>(`/api/listings/${listingId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

  return response.data;
}

export async function getChatsInbox() {
  const response = await apiFetch<ApiEnvelope<ApiChatsInbox>>('/api/chats/inbox');
  return response.data;
}

export async function getDirectThreadMessages(threadId: string) {
  const response = await apiFetch<ApiEnvelope<ApiDirectThreadMessages>>(`/api/chats/direct/${threadId}/messages`);
  return response.data;
}

export async function sendDirectThreadMessage(threadId: string, body: string) {
  const response = await apiFetch<ApiEnvelope<ApiDirectMessage>>(`/api/chats/direct/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

  return response.data;
}

export async function getMyProfile() {
  const response = await apiFetch<ApiEnvelope<ApiProfile>>('/api/profile/me');
  return response.data;
}

export async function upsertMyProfile(profile: Partial<ApiProfile>) {
  const response = await apiFetch<ApiEnvelope<ApiProfile>>('/api/profile/me', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });

  return response.data;
}
