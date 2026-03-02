import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  features: string[];
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'annual';
  trial_start_date: string | null;
  trial_end_date: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: SubscriptionPlan;
  is_inherited?: boolean;
}

export function useSubscription() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchSubscription();

    // Set up real-time listener for subscription changes
    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Subscription changed, refetching...', payload);
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function fetchSubscription() {
    try {
      setError(null);

      // Use get_user_subscription to check for own or inherited subscription
      const { data: subscriptionData, error: rpcError } = await supabase
        .rpc('get_user_subscription', { user_uuid: user!.id });

      if (rpcError) {
        throw rpcError;
      }

      if (!subscriptionData || subscriptionData.length === 0) {
        setSubscription(null);
        return;
      }

      const subInfo = subscriptionData[0];

      // Fetch full subscription details including plan
      const { data, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('id', subInfo.subscription_id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Add is_inherited flag
      setSubscription({
        ...data,
        is_inherited: subInfo.is_inherited,
      } as UserSubscription);
    } catch (err) {
      // Only log unexpected errors
      if (!(err instanceof Error && err.message?.includes('does not exist'))) {
        console.error('Error fetching subscription:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
      setSubscription(null);
    }
  }

  function hasFeature(featureName: string): boolean {
    if (!subscription) return false;
    
    const plan = subscription.plan;
    
    // PRO plan has all_features flag
    if (plan.features.includes('all_features')) {
      return true;
    }
    
    // Check if specific feature is in plan
    return plan.features.includes(featureName);
  }

  function getPlanName(): string {
    if (!subscription) return 'Free';
    const planName = subscription.plan.display_name || subscription.plan.name.toUpperCase();
    return subscription.is_inherited ? `${planName} (Team)` : planName;
  }

  function isOnTrial(): boolean {
    if (!subscription) return false;
    return subscription.status === 'trial';
  }

  function getTrialDaysRemaining(): number {
    if (!subscription || subscription.status !== 'trial' || !subscription.trial_end_date) {
      return 0;
    }
    
    const endDate = new Date(subscription.trial_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  return {
    subscription,
    loading: false, // Always false for instant rendering
    error,
    hasFeature,
    getPlanName,
    isOnTrial,
    getTrialDaysRemaining,
    refetch: fetchSubscription,
  };
}
