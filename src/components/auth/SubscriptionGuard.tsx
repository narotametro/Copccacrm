import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * SubscriptionGuard - Ensures user has selected a plan before accessing app
 * Redirects to /select-plan if no subscription exists
 * INSTANT: Uses cached subscription status from authStore (no loading spinner!)
 * Subscription is checked immediately in authStore on login/init, not here
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const hasActiveSubscription = useAuthStore((state) => state.hasActiveSubscription);
  const location = useLocation();

  // NO useEffect needed - subscription is checked in authStore immediately after login/init
  // This component just reads the cached value (instant, no async checks)

  // INSTANT: Use cached subscription status (no loading, no blink!)
  // If null (not yet checked), allow access and check runs in background
  // If false (checked and none found), redirect to plan selection
  if (hasActiveSubscription === false) {
    return <Navigate to="/select-plan" state={{ from: location }} replace />;
  }

  // Has subscription, render children
  return <>{children}</>;
};
