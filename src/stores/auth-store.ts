import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { appConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase';

type AuthResult = {
  error: null | string;
};

type AuthState = {
  initialized: boolean;
  loading: boolean;
  session: null | Session;
  user: null | User;
  pendingEmail: string;
  bootstrap: () => Promise<void>;
  sendOtp: (email: string) => Promise<AuthResult>;
  verifyOtp: (token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  clearPendingEmail: () => void;
};

let bootstrapPromise: null | Promise<void> = null;
let authSubscriptionRegistered = false;

export const useAuthStore = create<AuthState>()((set, get) => ({
  initialized: false,
  loading: false,
  session: null,
  user: null,
  pendingEmail: '',
  bootstrap: async () => {
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      try {
        if (!appConfig.supabase.enabled) {
          set({
            initialized: true,
            session: null,
            user: null,
          });
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        set({
          initialized: true,
          session,
          user: session?.user ?? null,
        });

        if (!authSubscriptionRegistered) {
          authSubscriptionRegistered = true;

          supabase.auth.onAuthStateChange((_event, nextSession) => {
            set({
              initialized: true,
              session: nextSession,
              user: nextSession?.user ?? null,
            });
          });
        }
      } catch {
        set({
          initialized: true,
          session: null,
          user: null,
        });
      }
    })();

    return bootstrapPromise;
  },
  sendOtp: async (email) => {
    if (!appConfig.supabase.enabled) {
      return { error: 'Supabase is not configured yet. Add the Expo public Supabase env vars first.' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { error: 'Enter an email address first.' };
    }

    set({ loading: true });

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    set({ loading: false });

    if (error) {
      return { error: error.message };
    }

    set({ pendingEmail: normalizedEmail });

    return { error: null };
  },
  verifyOtp: async (token) => {
    if (!appConfig.supabase.enabled) {
      return { error: 'Supabase is not configured yet. Add the Expo public Supabase env vars first.' };
    }

    const pendingEmail = get().pendingEmail.trim().toLowerCase();

    if (!pendingEmail) {
      return { error: 'Start with your email first so we know where to verify the code.' };
    }

    if (!token.trim()) {
      return { error: 'Enter the verification code from your email.' };
    }

    set({ loading: true });

    const {
      data: { session, user },
      error,
    } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: token.trim(),
      type: 'email',
    });

    set({ loading: false });

    if (error) {
      return { error: error.message };
    }

    set({
      session,
      user: user ?? session?.user ?? null,
      pendingEmail: '',
    });

    return { error: null };
  },
  signOut: async () => {
    if (!appConfig.supabase.enabled) {
      return;
    }

    await supabase.auth.signOut();
    set({ session: null, user: null, pendingEmail: '' });
  },
  clearPendingEmail: () => set({ pendingEmail: '' }),
}));
