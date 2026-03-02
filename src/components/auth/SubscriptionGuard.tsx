import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Loader } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * SubscriptionGuard - Ensures user has selected a plan OR inherits from inviter
 * Company owners must select a plan
 * Invited users automatically inherit their inviter's plan
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSubscriptionAccess();
  }, [user]);

  const checkSubscriptionAccess = async () => {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      // Use the get_user_subscription function which checks both own and inherited subscriptions
      const { data, error } = await supabase
        .rpc('get_user_subscription', { user_uuid: user.id });

      if (error) {
        console.error('Error checking subscription:', error);
        setHasAccess(false);
      } else {
        // User has access if they have own subscription OR inherited from inviter
        setHasAccess(data && data.length > 0);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
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

  // If no access (no own subscription and not invited), redirect to plan selection
  if (hasAccess === false) {
    return <Navigate to="/select-plan" state={{ from: location }} replace />;
  }

  // Has subscription, render children
  return <>{children}</>;
};
