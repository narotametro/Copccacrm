import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * SubscriptionGuard - Ensures user has selected a plan before accessing app
 * Redirects to /select-plan if no subscription exists
 * INSTANT: Uses cached subscription status from authStore (no loading spinner!)
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const hasActiveSubscription = useAuthStore((state) => state.hasActiveSubscription);
  const checkSubscription = useAuthStore((state) => state.checkSubscription);
  const location = useLocation();

  // Refresh subscription check when component mounts (non-blocking)
  useEffect(() => {
    if (user && hasActiveSubscription === null) {
      checkSubscription(); // Background check if not yet cached
    }
  }, [user, hasActiveSubscription, checkSubscription]);

  // INSTANT: Use cached subscription status (no loading, no blink!)
  // If null (not yet checked), allow access and check runs in background
  // If false (checked and none found), redirect to plan selection
  if (hasActiveSubscription === false) {
    return <Navigate to="/select-plan" state={{ from: location }} replace />;
  }

  // Has subscription, render children
  return <>{children}</>;
};
