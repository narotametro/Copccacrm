import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Crown,
  Check,
  ArrowUp,
  ArrowDown,
  Zap,
  Users,
  TrendingUp,
  // Shield,
  // Star,
  // Calendar,
  // Banknote,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { Modal } from '@/components/ui/Modal';
import { getUserSubscription, changeSubscriptionPlan, getCurrentUsage } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: any;
  color: string;
  stripePriceId?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'start',
    name: 'start',
    displayName: 'START',
    price: 'TZS 25,000',
    period: 'per month',
    description: 'Perfect for micro-businesses',
    icon: Users,
    color: 'green',
    features: [
      'Dashboard with basic KPIs',
      'Customer management (view & basic editing)',
      'Basic invoicing & payment tracking',
      'Simple inventory tracking',
      'Personal task management',
      'Basic sales reports',
      'Email support',
    ],
  },
  {
    id: 'grow',
    name: 'grow',
    displayName: 'GROW',
    price: 'TZS 80,000',
    period: 'per month',
    description: 'Grow your business with POS',
    icon: TrendingUp,
    color: 'blue',
    popular: true,
    features: [
      'Everything in START',
      'Advanced POS System (Sales Hub)',
      'Sales pipeline management',
      'Product management with inventory',
      'Marketing campaigns & strategy',
      'Customer health scoring',
      'KPI dashboard & tracking',
      'Advanced reports & analytics',
      'Multi-user collaboration (up to 3 users)',
      'Priority email support',
    ],
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'PRO',
    price: 'TZS 120,000',
    period: 'per month',
    description: 'Scale with business intelligence',
    icon: Zap,
    color: 'purple',
    features: [
      'Everything in GROW',
      'Advanced customer intelligence',
      'Automated debt collection workflows',
      'Customer performance analytics',
      'Product profitability analysis',
      'Custom report builder',
      'Multi-location inventory control',
      'Advanced competitor tracking',
      'Marketing budget optimization tools',
      'API access for integrations',
      'Phone support',
    ],
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'ENTERPRISE',
    price: 'Custom',
    period: 'pricing',
    description: 'Complete business platform',
    icon: Crown,
    color: 'orange',
    features: [
      'Everything in PRO',
      'Custom integrations & workflows',
      'White-label options',
      'Advanced security & compliance',
      'Dedicated account manager',
      'Custom training sessions',
      '24/7 priority support',
      'SLA guarantees',
      'Data export & advanced compliance tools',
    ],
  },
];

export const SubscriptionManagement: React.FC = () => {
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<Record<string, { current: number; limit: number; percentage: number }>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      // Removed setLoading(true) - show UI immediately
      const [subscription, currentUsage] = await Promise.all([
        getUserSubscription(),
        getCurrentUsage(),
      ]);

      setCurrentSubscription(subscription);
      setUsage(currentUsage);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newPlanId: string) => {
    try {
      setUpgrading(true);

      // Get the plan details from database
      const { data: planData, error } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', newPlanId)
        .single();

      if (error) throw error;

      await changeSubscriptionPlan(planData.id);

      toast.success('Subscription plan updated successfully!');
      setShowUpgradeModal(false);
      await fetchSubscriptionData(); // Refresh data

    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to update subscription plan');
    } finally {
      setUpgrading(false);
    }
  };

  const getCurrentPlanIndex = () => {
    if (!currentSubscription) return -1;
    return pricingPlans.findIndex(plan => plan.name === currentSubscription.plan.name);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getUpgradeOptions = () => {
    const currentIndex = getCurrentPlanIndex();
    if (currentIndex === -1) return pricingPlans;
    return pricingPlans.slice(currentIndex + 1);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDowngradeOptions = () => {
    const currentIndex = getCurrentPlanIndex();
    if (currentIndex <= 0) return [];
    return pricingPlans.slice(0, currentIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentPlanIndex = getCurrentPlanIndex();
  const currentPlan = currentPlanIndex >= 0 ? pricingPlans[currentPlanIndex] : null;

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Current Plan</h3>
            <p className="text-slate-600 mt-1">
              {currentSubscription?.status === 'past_due'
                ? 'Payment required to continue'
                : currentSubscription?.status === 'trial'
                ? (() => {
                    const trialEnd = new Date(currentSubscription.trial_end_date);
                    const today = new Date();
                    const daysRemaining = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining in free trial`;
                  })()
                : 'Active subscription'
              }
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <p className="text-2xl font-bold text-slate-900">
                {currentPlan?.displayName || 'Free'}
              </p>
              {currentSubscription?.status === 'trial' && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                  Trial
                </span>
              )}
            </div>
            <p className="text-slate-600">
              {currentPlan?.price || 'Free'}
            </p>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(usage).map(([key, data]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 capitalize">{key}</span>
                <span className={`text-sm font-medium ${
                  data.percentage > 90 ? 'text-red-600' :
                  data.percentage > 70 ? 'text-yellow-600' : 'text-slate-900'
                }`}>
                  {data.current}/{data.limit}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    data.percentage > 90 ? 'bg-red-500' :
                    data.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(data.percentage, 100)}%` }}
                />
              </div>
              {data.percentage > 80 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Near limit
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-2"
          >
            <ArrowUp className="w-4 h-4" />
            Change Plan
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/billing', '_self')}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            View Billing
          </Button>
        </div>
      </Card>

      {/* Plan Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingPlans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan?.name === plan.name;
            const isUpgrade = index > currentPlanIndex;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const isDowngrade = index < currentPlanIndex;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-4 transition-all ${
                  plan.popular ? 'border-blue-500 shadow-lg' :
                  isCurrentPlan ? 'border-green-500 bg-green-50' :
                  'border-slate-200 hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-3">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-${plan.color}-100 mb-2`}>
                    <Icon className={`text-${plan.color}-600`} size={20} />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{plan.displayName}</h4>
                  <p className="text-slate-600 text-xs mb-1">{plan.description}</p>
                  <div className="text-lg font-bold text-slate-900">{plan.price}</div>
                  <div className="text-slate-600 text-xs">{plan.period}</div>
                </div>

                <ul className="space-y-1 mb-4">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-center text-xs text-slate-600">
                      <Check className="text-green-500 mr-1 flex-shrink-0" size={12} />
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-slate-500">
                      +{plan.features.length - 3} more features
                    </li>
                  )}
                </ul>

                {isCurrentPlan ? (
                  <Button disabled className="w-full" size="sm">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      handlePlanChange(plan.name);
                    }}
                    disabled={upgrading}
                    className={`w-full ${isUpgrade ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    variant={isUpgrade ? 'default' : 'outline'}
                    size="sm"
                  >
                    {upgrading && selectedPlan === plan.id ? (
                      'Updating...'
                    ) : isUpgrade ? (
                      <>
                        <ArrowUp className="w-3 h-3 mr-1" />
                        Upgrade
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-3 h-3 mr-1" />
                        Downgrade
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Trial Warning */}
      {currentSubscription?.status === 'trial' && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Trial Period Active</p>
              <p className="text-sm text-yellow-700">
                Your trial ends on {new Date(currentSubscription.trial_end_date).toLocaleDateString()}.
                Upgrade now to avoid service interruption.
              </p>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="ml-auto bg-yellow-600 hover:bg-yellow-700"
            >
              Upgrade Now
            </Button>
          </div>
        </Card>
      )}

      {/* Payment Required Warning */}
      {currentSubscription?.status === 'past_due' && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Payment Required</p>
              <p className="text-sm text-red-700">
                Your trial has ended. Please make a payment to continue using the service.
                Your account will be reactivated immediately upon payment.
              </p>
            </div>
            <Button
              onClick={() => window.open('/billing', '_self')}
              className="ml-auto bg-red-600 hover:bg-red-700"
            >
              Pay Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};