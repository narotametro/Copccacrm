import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Use placeholder values if env vars aren't set yet
const url = supabaseUrl && supabaseUrl !== 'your_supabase_url_here' 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';
const key = supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here'
  ? supabaseAnonKey
  : 'placeholder-key';

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
