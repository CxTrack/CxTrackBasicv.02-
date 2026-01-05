import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getCurrentUser, getUserProfile } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../types/database.types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: false,
      initialized: false,

      initialize: async () => {
        try {
          const user = await getCurrentUser();
          if (user) {
            const profile = await getUserProfile(user.id);
            set({ user, profile, initialized: true });
          } else {
            set({ user: null, profile: null, initialized: true });
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          set({ user: null, profile: null, initialized: true });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            const profile = await getUserProfile(data.user.id);
            set({ user: data.user, profile, loading: false });
          }
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            // Create user profile
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email,
                full_name: fullName,
              });

            if (profileError) throw profileError;

            const profile = await getUserProfile(data.user.id);
            set({ user: data.user, profile, loading: false });
          }
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, profile: null });
        } catch (error) {
          console.error('Sign out error:', error);
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
      },

      updateProfile: async (data: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
          .from('user_profiles')
          .update(data)
          .eq('id', user.id);

        if (error) throw error;

        const updatedProfile = await getUserProfile(user.id);
        set({ profile: updatedProfile });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
      }),
    }
  )
);
