import React, { useState, useEffect } from 'react';
import { getSubscriptionStatus } from '../../lib/subscription';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TrialStatusBannerProps {
  onUpgradeClick?: () => void;
  onExportDataClick?: () => void;
}

export const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({
  onUpgradeClick,
  onExportDataClick,
}) => {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof getSubscriptionStatus>>>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const subscriptionStatus = await getSubscriptionStatus();
      setStatus(subscriptionStatus);
    };

    fetchStatus();

    // Refresh status every minute
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!status || !isVisible) return null;

  const { status: subscriptionStatus, daysLeft, isTrial, isInGracePeriod, gracePeriodDaysLeft, canAccessFeatures, message } = status;

  // Don't show banner for active subscriptions
  if (subscriptionStatus === 'active') return null;

  const getBannerStyle = () => {
    if (subscriptionStatus === 'expired' || subscriptionStatus === 'suspended') {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (isInGracePeriod) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    }
    if (daysLeft && daysLeft <= 3) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getIcon = () => {
    if (subscriptionStatus === 'expired' || subscriptionStatus === 'suspended') {
      return '⚠️';
    }
    if (isInGracePeriod) {
      return '⏰';
    }
    return 'ℹ️';
  };

  const getTitle = () => {
    if (subscriptionStatus === 'expired') {
      return 'Trial Expired';
    }
    if (subscriptionStatus === 'suspended') {
      return 'Account Suspended';
    }
    if (isInGracePeriod) {
      return 'Trial Grace Period';
    }
    if (daysLeft && daysLeft <= 0) {
      return 'Trial Ended';
    }
    if (daysLeft && daysLeft <= 3) {
      return 'Trial Ending Soon';
    }
    return 'Trial Active';
  };

  const getMessage = () => {
    if (message) return message;

    if (subscriptionStatus === 'expired') {
      return 'Your trial has expired. Upgrade now to continue using COPCCA CRM.';
    }
    if (subscriptionStatus === 'suspended') {
      return 'Your account has been suspended due to unpaid subscription. Please update payment information.';
    }
    if (isInGracePeriod && gracePeriodDaysLeft !== undefined) {
      return `Your trial is in grace period. You have ${gracePeriodDaysLeft} days left before features are limited.`;
    }
    if (daysLeft && daysLeft <= 0) {
      return 'Your trial has ended. Upgrade to continue using all features.';
    }
    if (daysLeft && daysLeft === 1) {
      return 'Your trial ends tomorrow. Don\'t lose access to your data!';
    }
    if (daysLeft && daysLeft <= 3) {
      return `Your trial ends in ${daysLeft} days. Upgrade now to avoid interruption.`;
    }
    if (daysLeft && daysLeft <= 7) {
      return `Your trial ends in ${daysLeft} days.`;
    }
    return `You have ${daysLeft} days left in your trial.`;
  };

  return (
    <Card className={`mb-4 border-l-4 ${getBannerStyle()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-xl">{getIcon()}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{getTitle()}</h3>
            <p className="text-sm mt-1 opacity-90">{getMessage()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {subscriptionStatus === 'expired' && onExportDataClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportDataClick}
              className="text-xs"
            >
              Export Data
            </Button>
          )}
          {onUpgradeClick && (
            <Button
              variant="default"
              size="sm"
              onClick={onUpgradeClick}
              className="text-xs"
            >
              Upgrade Now
            </Button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="text-current opacity-50 hover:opacity-75 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </Card>
  );
};