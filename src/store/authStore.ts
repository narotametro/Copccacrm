import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
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
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Error fetching profile on sign in:', profileError);
        // Use auth metadata as fallback
        const fallbackProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          role: 'user',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          phone: null,
          department: null,
          status: 'active'
        };
        set({ user: data.user, profile: fallbackProfile, loading: false });
      } else {
        set({ user: data.user, profile: profile || null, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`,
      },
    });

    if (error) throw error;
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    // Profile will be auto-created by database trigger
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
    // Set a shorter timeout for faster loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timeout, setting loading to false');
      set({ loading: false });
    }, 2000); // Reduced from 5000ms to 2000ms

    try {
      // Check if Supabase is properly configured
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key || url === 'https://placeholder.supabase.co') {
        console.warn('Supabase not configured, skipping auth initialization');
        clearTimeout(timeoutId);
        set({ loading: false });
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        clearTimeout(timeoutId);
        set({ loading: false });
        return;
      }

      if (session?.user) {
        // Set user immediately, fetch profile in background
        set({ user: session.user, loading: false });
        clearTimeout(timeoutId);
        
        // Fetch profile without blocking (only once)
        const fetchProfile = async () => {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (profileError) {
              console.warn('Profile fetch error:', profileError.message, profileError.code);
              // Create a default profile from auth metadata if DB profile doesn't exist
              const defaultProfile: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                role: 'user',
                avatar_url: session.user.user_metadata?.avatar_url || null,
                phone: session.user.user_metadata?.phone || null,
                department: null,
                status: 'active'
              };
              set({ profile: defaultProfile });
            } else {
              set({ profile: profile || null });
            }
          } catch (profileErr) {
            console.warn('Error fetching profile:', profileErr);
            // Use fallback profile from auth metadata
            const fallbackProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              role: 'user',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              phone: null,
              department: null,
              status: 'active'
            };
            set({ profile: fallbackProfile });
          }
        };
        fetchProfile();
      } else {
        clearTimeout(timeoutId);
        set({ loading: false });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'AbortError') {
        // Suppress AbortError, just set loading to false
        set({ loading: false });
      } else {
        console.error('Auth initialization error:', error);
        set({ loading: false });
      }
    }
  },
}));
