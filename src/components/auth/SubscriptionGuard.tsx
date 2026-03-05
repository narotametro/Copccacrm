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
      // Get user's profile to check ownership and company info
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('is_company_owner, company_id, invited_by')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
        setHasSubscription(false);
        setChecking(false);
        return;
      }

      // INVITED USERS: Automatically inherit company owner's subscription
      if (userProfile?.invited_by && userProfile?.company_id) {
        // Find company owner's subscription
        const { data: ownerData, error: ownerError } = await supabase
          .from('users')
          .select(`
            id,
            user_subscriptions!inner(id, status)
          `)
          .eq('company_id', userProfile.company_id)
          .eq('is_company_owner', true)
          .in('user_subscriptions.status', ['trial', 'active'])
          .maybeSingle();

        if (ownerError && ownerError.code !== 'PGRST116') {
          console.error('Error checking company owner subscription:', ownerError);
        }

        // Invited user has access if company owner has active subscription
        setHasSubscription(!!ownerData);
      } 
      // COMPANY OWNERS: Check their own subscription
      else if (userProfile?.is_company_owner) {
        console.log('🔍 Checking subscription for company owner:', user.id);
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking subscription:', error);
        }

        console.log('📊 Subscription data:', data);
        setHasSubscription(!!data);
      } 
      // NOT INVITED, NOT OWNER: Check subscription anyway (fallback)
      else {
        console.log('⚠️ User not marked as owner or invited, checking subscription anyway');
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking subscription:', error);
        }

        console.log('📊 Fallback subscription check:', data);
        // If subscription exists, allow access regardless of flags
        setHasSubscription(!!data);
      }
    } catch (error) {
      console.error('Error in checkSubscription:', error);
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
