import React, { useState, useEffect } from 'react';
import { Lock, Crown, AlertTriangle } from 'lucide-react';
import { hasFeatureAccess, hasModuleAccess } from '@/lib/subscription';
import { Button } from '@/components/ui/Button';

interface FeatureGateProps {
  feature?: string;
  module?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

/**
 * FeatureGate component that conditionally renders children based on subscription access
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  module,
  children,
  fallback,
  showUpgrade = true,
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        let access = false;
        if (feature) {
          access = await hasFeatureAccess(feature);
        } else if (module) {
          access = await hasModuleAccess(module);
        } else {
          access = true; // If no feature/module specified, allow access
        }
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature, module]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-300">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
        <Lock className="text-slate-600" size={24} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Premium Feature</h3>
      <p className="text-slate-600 mb-6 max-w-md">
        This feature is available with a higher subscription plan. Upgrade your plan to unlock this functionality.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => window.open('/app/settings?tab=billing', '_self')}
          className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700"
        >
          <Crown className="mr-2" size={16} />
          Upgrade Plan
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open('/pricing', '_blank')}
        >
          View Plans
        </Button>
      </div>
    </div>
  );
};

/**
 * Hook to check feature access
 */
export const useFeatureAccess = (feature: string) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await hasFeatureAccess(feature);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  return { hasAccess, loading };
};

/**
 * Hook to check module access
 */
export const useModuleAccess = (module: string) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await hasModuleAccess(module);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking module access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [module]);

  return { hasAccess, loading };
};

/**
 * Enhanced Trial banner component with detailed trial status
 */
export const TrialBanner: React.FC = () => {
  const [trialStatus, setTrialStatus] = useState<Awaited<ReturnType<typeof import('@/lib/subscription').getTrialStatus>>>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<Awaited<ReturnType<typeof import('@/lib/subscription').getSubscriptionStatus>>>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { getTrialStatus, getSubscriptionStatus } = await import('@/lib/subscription');
        const [trial, subscription] = await Promise.all([
          getTrialStatus(),
          getSubscriptionStatus(),
        ]);
        setTrialStatus(trial);
        setSubscriptionStatus(subscription);
      } catch (error) {
        console.error('Error fetching trial status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Refresh every minute
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || dismissed || !trialStatus || !subscriptionStatus) {
    return null;
  }

  const { isTrial, daysLeft, isInGracePeriod, gracePeriodDaysLeft, message } = trialStatus;
  const { planName } = subscriptionStatus;

  // Don't show for active subscriptions
  if (subscriptionStatus.status === 'active' && !isTrial) {
    return null;
  }

  const getBannerStyle = () => {
    if (status === 'suspended' || status === 'expired') {
      return 'bg-red-50 text-red-800 border-red-200';
    }
    if (isInGracePeriod) {
      return 'bg-orange-50 text-orange-800 border-orange-200';
    }
    if (daysLeft <= 3) {
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    }
    return 'bg-blue-50 text-blue-800 border-blue-200';
  };

  const getIcon = () => {
    if (status === 'suspended' || status === 'expired') {
      return <AlertTriangle size={16} className="text-red-600" />;
    }
    if (isInGracePeriod) {
      return <AlertTriangle size={16} className="text-orange-600" />;
    }
    return <Crown size={16} className="text-blue-600" />;
  };

  const getTitle = () => {
    if (status === 'suspended') return 'Account Suspended';
    if (status === 'expired') return 'Trial Expired';
    if (isInGracePeriod) return 'Trial Grace Period';
    if (daysLeft <= 0) return 'Trial Ended';
    if (daysLeft === 1) return 'Trial Ends Tomorrow';
    if (daysLeft <= 3) return `Trial Expires in ${daysLeft} Days`;
    return `Trial Active - ${daysLeft} Days Left`;
  };

  const getMessage = () => {
    if (message) return message;
    if (status === 'suspended') return 'Your account has been suspended. Please update payment information.';
    if (status === 'expired') return 'Your trial has expired. Upgrade now to continue using COPCCA CRM.';
    if (isInGracePeriod && gracePeriodDaysLeft !== undefined) {
      return `Grace period: ${gracePeriodDaysLeft} days left. Upgrade to maintain full access.`;
    }
    if (daysLeft <= 0) return 'Your trial has ended. Upgrade to continue using all features.';
    if (daysLeft === 1) return 'Don\'t lose access to your data. Upgrade before your trial ends!';
    if (daysLeft <= 3) return `Only ${daysLeft} days left. Upgrade now to avoid interruption.`;
    return `${daysLeft} days remaining in your ${planName} trial.`;
  };

  return (
    <div className={`px-4 py-3 border-b ${getBannerStyle()}`}>
      <div className="flex items-center justify-center gap-3">
        {getIcon()}
        <div className="flex-1 text-center">
          <span className="font-medium text-sm">{getTitle()}</span>
          <span className="ml-2 text-sm opacity-90">{getMessage()}</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('/app/settings?tab=billing', '_self')}
            className="text-xs"
          >
            Upgrade
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
};