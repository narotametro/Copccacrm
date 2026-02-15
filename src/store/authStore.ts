import { create } from 'zustand';
// // import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { rateLimiter, RateLimitError } from '@/lib/security/rateLimiter';
import { logLogin, logLogout, getBrowserInfo } from '@/lib/security/auditLogger';
import { generateDeviceFingerprint, storeSessionFingerprint, checkConcurrentSessionLimit } from '@/lib/security/sessionFingerprint';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, companyInfo?: {
    companyName: string;
    industry?: string;
    companySize?: string;
    website?: string;
    phone?: string;
    address?: string;
  }) => Promise<{ autoSignedIn: boolean; requiresEmailConfirmation?: boolean }>;
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
  loading: false, // Start false for instant rendering!

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    }

    const browserInfo = getBrowserInfo();

    // Check rate limit for this email
    if (!rateLimiter.checkLimit(email)) {
      const retryAfter = rateLimiter.getBlockedTimeRemaining(email);
      throw new RateLimitError(
        `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        retryAfter
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Record failed attempt
      rateLimiter.recordFailedAttempt(email);
      
      // Log failed login attempt
      await logLogin(
        '', // No user ID yet
        false,
        browserInfo.ipAddress,
        browserInfo.userAgent,
        error.message
      );
      
      throw error;
    }

    if (data.user) {
      // Reset rate limit on successful login
      rateLimiter.reset(email);

      // Log successful login
      await logLogin(
        data.user.id,
        true,
        browserInfo.ipAddress,
        browserInfo.userAgent
      );

      // Check concurrent session limit
      const sessionLimit = await checkConcurrentSessionLimit(data.user.id, 3);
      if (!sessionLimit.allowed) {
        console.warn(`User has ${sessionLimit.activeCount} active sessions (limit: 3)`);
        // You can choose to block or just warn
      }

      // Generate and store session fingerprint
      const fingerprint = generateDeviceFingerprint();
      const sessionToken = data.session?.access_token || '';
      const expiresAt = data.session?.expires_at
        ? new Date(data.session.expires_at * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default

      await storeSessionFingerprint(
        data.user.id,
        sessionToken,
        fingerprint,
        expiresAt
      );

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        // Don't log AbortErrors - they're expected during navigation/remounts
        if (!(profileError instanceof DOMException && profileError.name === 'AbortError')) {
          console.warn('Error fetching profile on sign in:', profileError);
        }
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
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`,
      },
    });

    if (error) throw error;
  },

  signUp: async (email: string, password: string, fullName: string, companyInfo?: {
    companyName: string;
    phone?: string;
  }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin', // self-signup defaults to admin
          company_name: companyInfo?.companyName || fullName + "'s Company", // Pass company name to trigger
        },
        emailRedirectTo: window.location.origin + '/dashboard', // Redirect to dashboard after email confirmation
      },
    });

    if (error) throw error;

    // If signup successful and we have a user ID, create company with custom name
    if (data.user?.id && companyInfo) {
      // Create company with the user's desired name and all information
      const { data: newCompany } = await supabase
        .from('companies')
        .insert({
          name: companyInfo.companyName,
          phone: companyInfo.phone,
          email: email,
          status: 'active',
          subscription_plan: 'starter',
          subscription_status: 'trial',
          max_users: 10,
          created_by: data.user.id,
        })
        .select()
        .single();

      if (newCompany) {
        // Update user with company_id
        await supabase
          .from('users')
          .update({
            company_id: newCompany.id,
            is_company_owner: true,
          })
          .eq('id', data.user.id);
      }
    }

    // Auto sign in the user immediately after successful signup
    if (data.user) {
      // Try to sign in immediately (works if email confirmation is disabled)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData.user) {
        // Successfully signed in, update the store
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', signInData.user.id)
          .maybeSingle();

        if (profileError) {
          console.warn('Error fetching profile on auto sign in:', profileError);
          // Use auth metadata as fallback
          const fallbackProfile: UserProfile = {
            id: signInData.user.id,
            email: signInData.user.email || '',
            full_name: signInData.user.user_metadata?.full_name || signInData.user.email?.split('@')[0] || 'User',
            role: 'user',
            avatar_url: signInData.user.user_metadata?.avatar_url || null,
            phone: null,
            department: null,
            status: 'active'
          };
          set({ user: signInData.user, profile: fallbackProfile });
        } else {
          set({ user: signInData.user, profile: profile || null });
        }
        // Return a flag indicating successful auto-signin
        return { autoSignedIn: true };
      } else {
        // Auto-signin failed (likely due to email confirmation requirement)
        console.log('Auto-signin failed, email confirmation may be required');
        // Return a flag indicating auto-signin failed
        return { autoSignedIn: false, requiresEmailConfirmation: true };
      }
    }

    return { autoSignedIn: false };
  },

  signOut: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, profile: null });
      return;
    }

    const { user } = useAuthStore.getState();
    const browserInfo = getBrowserInfo();

    // Log logout
    if (user) {
      await logLogout(user.id, browserInfo.ipAddress, browserInfo.userAgent);
    }

    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  resetPassword: async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  initialize: async () => {
    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured) {
        return; // Silent fail, app still works
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // Don't log AbortErrors - they're expected during navigation/remounts
        if (!(sessionError instanceof DOMException && sessionError.name === 'AbortError')) {
          console.error('Session error:', sessionError);
        }
        return;
      }

      if (session?.user) {
        // Set user immediately
        set({ user: session.user });
        
        // Fetch profile in background (non-blocking)
        const fetchProfile = async () => {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (profileError) {
              // Don't log AbortErrors - they're expected during navigation/remounts
              if (profileError.code === 'PGRST301' || (profileError instanceof DOMException && profileError.name === 'AbortError')) {
                // Silently ignore AbortErrors
              } else {
                console.warn('Profile fetch error:', profileError.message, profileError.code);
              }
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
            // Don't log AbortErrors - they're expected during navigation/remounts
            if (!(profileErr instanceof DOMException && profileErr.name === 'AbortError')) {
              console.warn('Error fetching profile:', profileErr);
            }
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
      }
    } catch (error) {
      // Don't log AbortErrors - they're expected during navigation/remounts
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Auth initialization error:', error);
      }
    }
  },
}));
