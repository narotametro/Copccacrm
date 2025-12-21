import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { createClient } from './supabase-client';
import { authAPI, userAPI, setAuthToken, clearAuthToken } from './api';
import { requestCache } from './request-cache';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  teamId: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, phoneOrEmail: string, password: string, role?: UserRole, inviteCode?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isAdmin: boolean;
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'pocket_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear cache when selected user changes to ensure fresh data
  // Track previous value to detect actual changes (not just initial load)
  const prevSelectedUserIdRef = useRef<string | null | undefined>(undefined);
  
  useEffect(() => {
    // Skip on initial mount (prevSelectedUserId is undefined)
    if (prevSelectedUserIdRef.current !== undefined) {
      console.log('🔄 🔄 🔄 SELECTED USER CHANGED 🔄 🔄 🔄');
      console.log('From:', prevSelectedUserIdRef.current || 'ALL MEMBERS');
      console.log('To:', selectedUserId || 'ALL MEMBERS');
      console.log('Clearing request cache for fresh data...');
      requestCache.clear();
      console.log('✅ Cache cleared! All subsequent requests will fetch fresh data.');
    }
    prevSelectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth state changes (handles OAuth callbacks)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.access_token) {
        // Save token
        setAuthToken(session.access_token);

        // Get user profile from backend (will auto-create for OAuth users)
        try {
          const { user: profile } = await authAPI.getProfile();
          
          if (profile) {
            setUser(profile);

            // If normal user, auto-select themselves
            if (profile.role === 'user') {
              setSelectedUserId(profile.id);
            }
          }
        } catch (error) {
          console.error('Failed to get profile after auth state change:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSelectedUserId(null);
        clearAuthToken();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        setLoading(false);
        return;
      }

      if (session?.access_token) {
        // Save token
        setAuthToken(session.access_token);

        // Get user profile from backend
        const { user: profile } = await authAPI.getProfile();
        
        if (profile) {
          setUser(profile);

          // If normal user, auto-select themselves
          if (profile.role === 'user') {
            setSelectedUserId(profile.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phoneOrEmail: string, password: string) => {
    try {
      const supabase = createClient();
      
      console.log('🔐 Attempting login for:', phoneOrEmail);
      
      // Convert phone number to internal email format if it's a phone
      // Format: +1234567890 becomes 1234567890@pocket.internal
      const isPhone = phoneOrEmail.startsWith('+');
      const email = isPhone ? `${phoneOrEmail.replace(/\+/g, '')}@pocket.internal` : phoneOrEmail;
      
      console.log('🔐 Using email for Supabase:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        // Provide more helpful error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid phone number or password. If you don\'t have an account yet, please sign up first.');
        }
        throw new Error(error.message);
      }

      if (!data.session?.access_token) {
        console.error('❌ No access token received from Supabase');
        throw new Error('Authentication failed - no access token received');
      }

      console.log('✅ Auth successful, fetching profile...');
      // Save token
      setAuthToken(data.session.access_token);

      // Get user profile from backend
      const { user: profile } = await authAPI.getProfile();
      
      if (!profile) {
        throw new Error('Failed to fetch user profile');
      }
      
      console.log('✅ Profile fetched:', profile.name, `(${profile.role})`);
      setUser(profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

      // If normal user, auto-select themselves
      if (profile.role === 'user') {
        setSelectedUserId(profile.id);
      }
      
      console.log('✅ Login completed successfully');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSelectedUserId(null);
      clearAuthToken();
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const signup = async (name: string, phoneOrEmail: string, password: string, role: UserRole = 'user', inviteCode?: string) => {
    try {
      // Create user via backend
      console.log('📝 Creating user account for:', name, phoneOrEmail);
      const { userId } = await authAPI.signup(name, phoneOrEmail, password, role, inviteCode);
      console.log('✅ User created successfully, userId:', userId);

      // Now sign in
      console.log('🔐 Signing in new user...');
      await login(phoneOrEmail, password);
      console.log('✅ Signup and login completed successfully');
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      // Re-throw the error as-is to preserve the message from the backend
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const supabase = createClient();
      
      console.log('🔐 Initiating Google sign-in...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('❌ Google sign-in error:', error);
        // Check for common errors
        if (error.message.includes('provider') || error.message.includes('not enabled')) {
          throw new Error('Google sign-in is not configured. Please contact your administrator or follow the setup instructions at: https://supabase.com/docs/guides/auth/social-login/auth-google');
        }
        throw new Error(error.message);
      }

      console.log('✅ Google sign-in initiated successfully');
      // User will be redirected to Google, then back to the app
      // Session will be handled automatically on return
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      throw new Error(error.message || 'Google sign-in failed. Please try again.');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        signup, 
        signInWithGoogle,
        isAdmin,
        selectedUserId,
        setSelectedUserId,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get all users (for admin)
export async function getAllUsers(): Promise<User[]> {
  try {
    const { users } = await userAPI.getAll();
    return users || [];
  } catch (error) {
    console.error('Failed to get all users:', error);
    return [];
  }
}

// Helper to get users by team
export async function getUsersByTeam(teamId: string): Promise<User[]> {
  try {
    const { users } = await userAPI.getAll();
    return (users || []).filter((u: User) => u.teamId === teamId);
  } catch (error) {
    console.error('Failed to get team users:', error);
    return [];
  }
}