import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { sendEmailOtp } from '@/lib/api';
import { appConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase';

const OTP_LENGTH = 8;

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
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
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
    if (!appConfig.api.enabled || !appConfig.supabase.enabled) {
      return {
        error:
          'Auth is not configured yet. Add EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_SUPABASE_URL, and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY first.',
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { error: 'Enter an email address first.' };
    }

    set({ loading: true });

    try {
      await sendEmailOtp(normalizedEmail);
    } catch (error) {
      set({ loading: false });
      return { error: error instanceof Error ? error.message : 'Unable to send a sign-in code right now.' };
    }

    set({
      loading: false,
      pendingEmail: normalizedEmail,
    });

    return { error: null };
  },
  signInWithPassword: async (email, password) => {
    if (!appConfig.supabase.enabled) {
      return { error: 'Supabase is not configured yet. Add the Expo public Supabase env vars first.' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { error: 'Enter an email address first.' };
    }

    if (!password.trim()) {
      return { error: 'Enter the password for this review account.' };
    }

    set({ loading: true });

    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    set({ loading: false });

    if (error) {
      return { error: error.message };
    }

    set({
      session,
      user: session?.user ?? null,
      pendingEmail: '',
    });

    return { error: null };
  },
  verifyOtp: async (token) => {
    if (!appConfig.supabase.enabled) {
      return { error: 'Supabase is not configured yet. Add the Expo public Supabase env vars first.' };
    }

    const pendingEmail = get().pendingEmail.trim().toLowerCase();
    const normalizedToken = token.replace(/\D/g, '').slice(0, OTP_LENGTH);

    if (!pendingEmail) {
      return { error: 'Start with your email first so we know where to verify the code.' };
    }

    if (!normalizedToken) {
      return { error: 'Enter the verification code from your email.' };
    }

    if (normalizedToken.length !== OTP_LENGTH) {
      return { error: `Enter the ${OTP_LENGTH}-digit verification code from your email.` };
    }

    set({ loading: true });

    const {
      data: { session, user },
      error,
    } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: normalizedToken,
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
