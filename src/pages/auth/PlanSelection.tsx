import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Users, TrendingUp, Check, Loader, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_users: number;
  max_products: number;
  max_invoices_monthly: number;
  icon: any;
  color: string;
  popular?: boolean;
}

export const PlanSelection: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadPlans();
    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    if (!user) return;

    try {
      // Check if user has own subscription OR inherits from inviter
      const { data } = await supabase
        .rpc('get_user_subscription', { user_uuid: user.id });

      // If user has subscription (own or inherited), redirect to dashboard
      if (data && data.length > 0) {
        const subscriptionInfo = data[0];
        
        if (subscriptionInfo.is_inherited) {
          toast.success(`Welcome! You're using your team's ${subscriptionInfo.plan_display_name} plan`);
        }
        
        navigate('/app/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;

      if (data) {
        const plansWithIcons = data.map((plan: any) => ({
          ...plan,
          icon: plan.name === 'start' ? Users : plan.name === 'grow' ? TrendingUp : Crown,
          color: plan.name === 'start' ? 'green' : plan.name === 'grow' ? 'blue' : 'purple',
          popular: plan.name === 'grow',
        }));
        setPlans(plansWithIcons);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async () => {
    if (!selectedPlan || !user) {
      toast.error('Please select a plan');
      return;
    }

    setSubscribing(true);

    try {
      // Create subscription for user
      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan,
          status: 'active',
          billing_cycle: 'monthly',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      toast.success('Plan activated successfully!');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/app/dashboard', { replace: true });
      }, 1000);
    } catch (error: any) {
      console.error('Error activating plan:', error);
      toast.error(error.message || 'Failed to activate plan');
    } finally {
      setSubscribing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getFeatureList = (plan: Plan) => {
    const featureDescriptions: Record<string, string> = {
      'dashboard': 'Dashboard & Analytics',
      'customers_basic': 'Customer 360 Management',
      'pos_system': 'Sales Hub & POS',
      'invoicing_basic': 'Invoicing System',
      'products-management': 'Product Management',
      'customer_health': 'After Sales & Customer Health',
      'sales_pipeline': 'Sales Pipeline Management',
      'analytics': 'KPI Tracking & Analytics',
      'reports_advanced': 'Advanced Reports',
      'marketing': 'Marketing Campaigns',
      'marketing_campaigns': 'Competitor Analysis',
      'debt_collection': 'Debt Collection',
      'all_features': 'All Features Included',
    };

    if (plan.features.includes('all_features')) {
      return ['All Features Included', 'Unlimited Users', 'Unlimited Products', 'Priority Support', 'Advanced Analytics'];
    }

    return plan.features.map(f => featureDescriptions[f] || f);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-300">
            Select the perfect plan for your business. You can change it anytime.
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-300 font-medium">
              ⚠️ You must select a plan to continue
            </p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'ring-4 ring-primary-500 shadow-2xl scale-105'
                    : 'hover:shadow-xl hover:scale-102'
                } ${plan.popular ? 'border-2 border-primary-500' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-${plan.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${plan.color}-600`} />
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Plan Name & Description */}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.display_name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900">
                        {formatPrice(plan.price_monthly)}
                      </span>
                      <span className="text-slate-600">/month</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      or {formatPrice(plan.price_yearly)}/year
                    </p>
                  </div>

                  {/* Limits */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">
                      {plan.max_users === -1 ? 'Unlimited' : `Up to ${plan.max_users}`} users • 
                      {plan.max_products === -1 ? ' Unlimited' : ` ${plan.max_products}`} products
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {getFeatureList(plan).slice(0, 5).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button
            onClick={handleSelectPlan}
            disabled={!selectedPlan || subscribing}
            className="px-12 py-4 text-lg font-bold bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subscribing ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Activating Plan...
              </>
            ) : (
              <>
                Continue with Selected Plan
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          {selectedPlan && (
            <p className="text-slate-300 mt-4">
              You selected: <span className="font-bold">{plans.find(p => p.id === selectedPlan)?.display_name}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
