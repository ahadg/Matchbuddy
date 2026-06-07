import { appConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import type { ApiEnvelope, ApiFanDetail, ApiFixture, ApiListing, ApiNearbyFan, ApiProfile } from '@/types/api';
import type { WatchingVibe } from '@/types/matchbuddy';

export class ApiConfigurationError extends Error {
  constructor(message = 'API base URL is not configured.') {
    super(message);
    this.name = 'ApiConfigurationError';
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

    throw new Error(message);
  }

  return payload as T;
}

export async function getFixtures() {
  const response = await apiFetch<ApiEnvelope<ApiFixture[]>>('/api/fixtures');
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
