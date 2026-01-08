import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initialize: () => Promise<void>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user';
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
  status: 'active' | 'inactive';
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({ user: data.user, profile });
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) throw error;
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role: 'user',
        status: 'active',
      } as any);
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Check if user profile exists
        let { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // If no profile exists (OAuth user), create one
        if (!profile) {
          const fullName = session.user.user_metadata?.full_name || 
                          session.user.email?.split('@')[0] || 
                          'User';
          
          const { data: newProfile } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              email: session.user.email!,
              full_name: fullName,
              role: 'user',
              status: 'active',
              avatar_url: session.user.user_metadata?.avatar_url || null,
            } as any)
            .select()
            .single();
          
          profile = newProfile;
        }

        set({ user: session.user, profile, loading: false });
      } else {
        set({ loading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          // Check if user profile exists
          let { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // If no profile exists (OAuth user), create one
          if (!profile) {
            const fullName = session.user.user_metadata?.full_name || 
                            session.user.email?.split('@')[0] || 
                            'User';
            
            const { data: newProfile } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                full_name: fullName,
                role: 'user',
                status: 'active',
                avatar_url: session.user.user_metadata?.avatar_url || null,
              } as any)
              .select()
              .single();
            
            profile = newProfile;
          }

          set({ user: session.user, profile });
        } else {
          set({ user: null, profile: null });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false });
    }
  },
}));
