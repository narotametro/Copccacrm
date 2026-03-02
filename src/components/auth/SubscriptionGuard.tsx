import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Loader } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * SubscriptionGuard - Ensures user has selected a plan before accessing app
 * Redirects to /select-plan if no subscription exists
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error);
      }

      setHasSubscription(!!data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasSubscription(false);
    } finally {
      setChecking(false);
    }
  };

  // Show loading while checking
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no subscription, redirect to plan selection
  if (hasSubscription === false) {
    return <Navigate to="/select-plan" state={{ from: location }} replace />;
  }

  // Has subscription, render children
  return <>{children}</>;
};
