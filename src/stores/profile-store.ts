import { create } from 'zustand';

import { ApiRequestError, getMyProfile, upsertMyProfile } from '@/lib/api';
import { appConfig } from '@/lib/config';
import type { ApiProfile } from '@/types/api';
import type { HostSetup, WatchingVibe } from '@/types/matchbuddy';

export type ProfileSetupInput = {
  bio: string;
  city: string;
  displayName: string;
  favouriteTeams: string[];
  isHost: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  neighborhood: string;
  setup: HostSetup | null;
  vibe: WatchingVibe;
};

type SaveProfileResult = {
  error: null | string;
};

type ProfileState = {
  activeUserId: null | string;
  error: null | string;
  initialized: boolean;
  loading: boolean;
  profile: ApiProfile | null;
  bootstrapForUser: (authUserId: null | string) => Promise<void>;
  clear: () => void;
  saveProfile: (input: ProfileSetupInput) => Promise<SaveProfileResult>;
  refresh: () => Promise<void>;
};

function hasSetupDetails(setup: ApiProfile['setup']) {
  if (!setup) {
    return false;
  }

  return Boolean(setup.screenSize.trim() && setup.displayType.trim() && setup.audio.trim());
}

export function hasCompletedProfile(profile: ApiProfile | null) {
  if (!profile) {
    return false;
  }

  const hasBasicFields =
    profile.displayName.trim().length > 0 &&
    profile.city.trim().length > 0 &&
    profile.neighborhood.trim().length > 0 &&
    profile.favouriteTeams.length > 0 &&
    Boolean(profile.location);

  if (!hasBasicFields) {
    return false;
  }

  if (!profile.isHost) {
    return true;
  }

  return hasSetupDetails(profile.setup);
}

async function fetchProfileOrNull() {
  try {
    return await getMyProfile();
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  activeUserId: null,
  error: null,
  initialized: false,
  loading: false,
  profile: null,
  bootstrapForUser: async (authUserId) => {
    if (!appConfig.api.enabled || !appConfig.supabase.enabled || !authUserId) {
      set({
        activeUserId: authUserId,
        error: null,
        initialized: true,
        loading: false,
        profile: null,
      });
      return;
    }

    if (get().initialized && get().activeUserId === authUserId) {
      return;
    }

    set({
      activeUserId: authUserId,
      error: null,
      initialized: false,
      loading: true,
      profile: null,
    });

    try {
      const profile = await fetchProfileOrNull();

      set({
        activeUserId: authUserId,
        error: null,
        initialized: true,
        loading: false,
        profile,
      });
    } catch (error) {
      set({
        activeUserId: authUserId,
        error: error instanceof Error ? error.message : 'Unable to load your profile right now.',
        initialized: true,
        loading: false,
        profile: null,
      });
    }
  },
  clear: () =>
    set({
      activeUserId: null,
      error: null,
      initialized: false,
      loading: false,
      profile: null,
    }),
  refresh: async () => {
    const authUserId = get().activeUserId;

    if (!appConfig.api.enabled || !appConfig.supabase.enabled || !authUserId) {
      set({
        error: null,
        initialized: true,
        loading: false,
        profile: null,
      });
      return;
    }

    set({ error: null, loading: true });

    try {
      const profile = await fetchProfileOrNull();

      set({
        error: null,
        initialized: true,
        loading: false,
        profile,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to refresh your profile right now.',
        initialized: true,
        loading: false,
      });
    }
  },
  saveProfile: async (input) => {
    set({ error: null, loading: true });

    try {
      const profile = await upsertMyProfile({
        bio: input.bio.trim(),
        city: input.city.trim(),
        displayName: input.displayName.trim(),
        favouriteTeams: input.favouriteTeams,
        isHost: input.isHost,
        location: input.location,
        neighborhood: input.neighborhood.trim(),
        setup: input.isHost ? input.setup : null,
        vibe: input.vibe,
      });

      set({
        error: null,
        initialized: true,
        loading: false,
        profile,
      });

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save your profile right now.';

      set({
        error: message,
        initialized: true,
        loading: false,
      });

      return { error: message };
    }
  },
}));
