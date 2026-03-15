import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Replace these with your Supabase project keys
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY &&
                     SUPABASE_URL !== 'your_supabase_url_here' &&
                     SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here';

// Create Supabase client or error-throwing proxy if not configured
export const supabase: SupabaseClient = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Keep users logged in - prevent auto-logout
        autoRefreshToken: true, // Automatically refresh expired tokens
        persistSession: true, // Persist session to localStorage
        detectSessionInUrl: true, // Handle OAuth redirects
        // Storage uses localStorage by default (perfect for persistent sessions)
        storage: {
          getItem: (key) => {
            if (typeof window !== 'undefined') {
              return window.localStorage.getItem(key);
            }
            return null;
          },
          setItem: (key, value) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value);
            }
          },
          removeItem: (key) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key);
            }
          },
        },
      },
    })
  : new Proxy({}, {
      get: () => {
        throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. Get these from https://supabase.com → Your Project → Settings → API');
      }
    }) as SupabaseClient;

// Export configuration status for components to check
export const isSupabaseConfigured = isConfigured;

