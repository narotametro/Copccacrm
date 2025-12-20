import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { SubscriptionModal } from './SubscriptionModal';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { user, userProfile } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [error, setError] = useState(false);

  // TEMPORARY: Disable subscription check - set to false to enable
  const DISABLE_SUBSCRIPTION_CHECK = true;

  useEffect(() => {
    if (DISABLE_SUBSCRIPTION_CHECK) {
      setIsLoading(false);
      return;
    }

    if (user && userProfile) {
      checkSubscriptionWithTimeout();
    } else {
      setIsLoading(false);
    }
  }, [user, userProfile]);

  const checkSubscriptionWithTimeout = async () => {
    // Set a timeout of 5 seconds
    const timeoutId = setTimeout(() => {
      console.warn('Subscription check timed out, allowing access');
      setError(true);
      setIsLoading(false);
    }, 5000);

    try {
      await checkSubscription();
    } catch (err) {
      console.error('Subscription check error:', err);
      setError(true);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      // Only check for admins for now
      if (userProfile?.role !== 'admin') {
        return;
      }

      const emailToCheck = userProfile.email;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/subscription/status?adminEmail=${emailToCheck}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
        
        // Load team members count
        await loadTeamMembersCount();
        
        // If no subscription exists, initialize one (but don't wait)
        if (!data.hasSubscription && userProfile?.role === 'admin') {
          initializeSubscription(); // Fire and forget
        }
      } else {
        console.warn('Subscription status check failed:', response.status);
        setError(true);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Subscription check aborted due to timeout');
      } else {
        console.error('Error checking subscription:', error);
      }
      setError(true);
    }
  };

  const loadTeamMembersCount = async () => {
    if (userProfile?.role !== 'admin') return;

    try {
      const teamId = userProfile?.teamId;
      if (!teamId) {
        setTeamMembers([userProfile]);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/team/members?teamId=${teamId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const members = await response.json();
        setTeamMembers(members);
      } else {
        setTeamMembers([userProfile]);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      setTeamMembers([userProfile]);
    }
  };

  const initializeSubscription = async () => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/subscription/initialize`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminEmail: userProfile?.email,
            adminName: userProfile?.name,
            totalUsers: teamMembers.length || 1,
          }),
        }
      );
    } catch (error) {
      console.error('Error initializing subscription:', error);
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh subscription status
    checkSubscription();
  };

  // If loading, show spinner with max 5 second wait
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
          <p className="text-xs text-gray-400 mt-2">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // If subscription check is disabled or errored, allow access
  if (DISABLE_SUBSCRIPTION_CHECK || error) {
    return <>{children}</>;
  }

  // Check if subscription is required
  const requiresPayment = subscriptionStatus && (
    !subscriptionStatus.hasSubscription ||
    subscriptionStatus.paymentStatus === 'unpaid' ||
    subscriptionStatus.subscriptionStatus === 'expired' ||
    subscriptionStatus.subscriptionStatus === 'pending'
  );

  // Only show modal for admins with payment issues
  const shouldShowModal = requiresPayment && userProfile?.role === 'admin';

  if (shouldShowModal) {
    return (
      <>
        {/* Blurred background with actual app content */}
        <div className="filter blur-md pointer-events-none">
          {children}
        </div>
        
        {/* Subscription modal overlay */}
        <SubscriptionModal
          userEmail={userProfile?.email || ''}
          adminEmail={userProfile?.email || ''}
          totalUsers={teamMembers.length || 1}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </>
    );
  }

  // If team member and admin hasn't paid, show message but don't block
  if (requiresPayment && userProfile?.role !== 'admin') {
    return (
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white py-2 px-4 text-center z-50">
          <p className="text-sm font-semibold">
            ⚠️ Subscription pending - Contact your admin to activate the subscription
          </p>
        </div>
        <div className="pt-10">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
