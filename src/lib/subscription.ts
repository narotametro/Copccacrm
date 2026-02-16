import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  features: string[];
  max_users?: number;
  max_products?: number;
  max_invoices_monthly?: number;
  max_pos_locations?: number;
  max_inventory_locations?: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trial_end_date: string | null;
  current_period_end: string | null;
  plan: SubscriptionPlan;
}

export interface PaymentRecord {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_id: string | null;
  invoice_url: string | null;
  created_at: string;
  description?: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  feature_type: 'users' | 'products' | 'invoices' | 'pos_locations' | 'storage';
  count: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

/**
 * Get the current user's subscription with plan details
 */
export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        trial_end_date,
        current_period_end,
        subscription_plans (
          id,
          name,
          display_name,
          features,
          max_users,
          max_products,
          max_invoices_monthly,
          max_pos_locations,
          max_inventory_locations
        )
      `)
      .eq('user_id', user.id)
      .or('status.eq.trial,status.eq.active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    // Type assertion since Supabase returns nested objects correctly
    const subscriptionData = data as any;
    const planData = Array.isArray(subscriptionData.subscription_plans) 
      ? subscriptionData.subscription_plans[0] 
      : subscriptionData.subscription_plans;

    return {
      id: subscriptionData.id,
      user_id: subscriptionData.user_id,
      plan_id: subscriptionData.plan_id,
      status: subscriptionData.status,
      trial_end_date: subscriptionData.trial_end_date,
      current_period_end: subscriptionData.current_period_end,
      plan: planData as SubscriptionPlan,
    };
  } catch (error) {
    // Don't log AbortErrors - they're expected during navigation/remounts
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.error('Error fetching user subscription:', error);
    }
    return null;
  }
}

/**
 * Automatically convert expired trial to past_due status (requires payment)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function convertExpiredTrialToPastDue(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user has an expired trial
    const { data: expiredTrial, error } = await supabase
      .from('user_subscriptions')
      .select('id, plan_id')
      .eq('user_id', user.id)
      .eq('status', 'trial')
      .lt('trial_end_date', new Date().toISOString())
      .single();

    if (error || !expiredTrial) return false;

    // Convert to past_due status (requires payment to activate)
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', expiredTrial.id);

    if (updateError) {
      console.error('Error converting trial to past_due:', updateError);
      return false;
    }

    console.log('Successfully converted expired trial to past_due status');
    return true;
  } catch (error) {
    console.error('Error in trial conversion:', error);
    return false;
  }
}

/**
 * Activate subscription when payment is received
 */
export async function activateSubscriptionWithPayment(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Find past_due subscription
    const { data: pastDueSub, error } = await supabase
      .from('user_subscriptions')
      .select('id, plan_id')
      .eq('user_id', user.id)
      .eq('status', 'past_due')
      .single();

    if (error || !pastDueSub) return false;

    // Activate subscription starting from today
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from payment
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pastDueSub.id);

    if (updateError) {
      console.error('Error activating subscription:', updateError);
      return false;
    }

    console.log('Successfully activated subscription with payment');
    return true;
  } catch (error) {
    console.error('Error activating subscription:', error);
    return false;
  }
}

/**
 * Check if user has access to a specific feature (enhanced with trial expiration logic)
 */
export async function hasFeatureAccess(feature: string): Promise<boolean> {
  try {
    // Use the enhanced database function for feature access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('has_feature_access', {
        p_user_id: user.id,
        p_feature: feature
      });

    if (error) {
      // Don't log AbortErrors - they're expected during navigation/remounts
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error checking feature access:', error);
      }
      // Fallback to basic logic if RPC fails
      return await hasFeatureAccessBasic(feature);
    }

    return data || false;
  } catch (error) {
    // Don't log AbortErrors - they're expected during navigation/remounts
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.error('Error checking feature access:', error);
    }
    return false;
  }
}

/**
 * Basic feature access check (fallback)
 */
async function hasFeatureAccessBasic(feature: string): Promise<boolean> {
  try {
    const subscription = await getUserSubscription();
    if (!subscription) return false;

    // Check subscription status
    if (subscription.status === 'active') {
      const periodEnd = new Date(subscription.current_period_end || '');
      if (periodEnd < new Date()) {
        return false; // Subscription expired
      }
    } else if (subscription.status === 'past_due') {
      return false; // Payment required
    } else if (subscription.status === 'expired') {
      return false; // Trial expired
    } else if (subscription.status !== 'trial') {
      return false; // Not active, trial, or past_due
    }

    // Check if feature is in the plan's features array
    // PRO plan has "all_features" which grants access to everything
    if (subscription.plan.features?.includes('all_features')) {
      return true;
    }
    return subscription.plan.features?.includes(feature) || false;
  } catch (error) {
    console.error('Error checking basic feature access:', error);
    return false;
  }
}

/**
 * Check if user has access to a specific module/page
 */
export async function hasModuleAccess(module: string): Promise<boolean> {
  const moduleFeatureMap: Record<string, string> = {
    'sales-hub': 'pos_system',
    'marketing': 'marketing_campaigns',
    'analytics': 'kpi_dashboard',
    'admin': 'admin_panel',
    'multi-user': 'multi_user',
    'api': 'api_access',
    'custom-reports': 'reports_advanced',
    'debt-collection': 'debt_collection',
    'sales-pipeline': 'sales_pipeline',
    'customer-health': 'customer_health',
    'advanced-pos': 'pos_system',
    'products-management': 'products_management',
    'white-label': 'white_label',
    'custom-integrations': 'custom_integrations',
    'advanced-security': 'advanced_security',
    'dedicated-support': 'dedicated_support',
    'custom-training': 'custom_training',
    'sla-guarantees': 'sla_guarantees',
    'invoices': 'invoices',
    'products': 'products_management',
    'kpi-tracking': 'kpi_dashboard',
    'pipeline': 'sales_pipeline',
    'sales': 'sales_pipeline',
    'after-sales': 'customer_health',
    'competitors': 'marketing_campaigns',
    'reports': 'reports_advanced',
  };

  const feature = moduleFeatureMap[module];
  if (!feature) return true; // If no mapping, allow access (basic features like dashboard, customers, invoices)

  return hasFeatureAccess(feature);
}

/**
 * Get subscription status for UI display (enhanced with trial status)
 */
export async function getSubscriptionStatus(): Promise<{
  status: string;
  planName: string;
  daysLeft?: number;
  isTrial: boolean;
  isInGracePeriod?: boolean;
  gracePeriodDaysLeft?: number;
  canAccessFeatures: boolean;
  message?: string;
} | null> {
  try {
    const subscription = await getUserSubscription();
    if (!subscription) return null;

    const trialStatus = await getTrialStatus();

    const isTrial = subscription.status === 'trial';
    let daysLeft: number | undefined;
    let isInGracePeriod: boolean | undefined;
    let gracePeriodDaysLeft: number | undefined;
    let canAccessFeatures = true;
    let message: string | undefined;

    if (trialStatus) {
      daysLeft = trialStatus.daysLeft;
      isInGracePeriod = trialStatus.isInGracePeriod;
      gracePeriodDaysLeft = trialStatus.gracePeriodDaysLeft;
      canAccessFeatures = trialStatus.canAccessFeatures;
      message = trialStatus.message;
    } else if (isTrial && subscription.trial_end_date) {
      // Fallback to basic calculation
      const endDate = new Date(subscription.trial_end_date);
      const now = new Date();
      daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      status: subscription.status,
      planName: subscription.plan.display_name,
      daysLeft,
      isTrial,
      isInGracePeriod,
      gracePeriodDaysLeft,
      canAccessFeatures,
      message,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}

/**
 * Get trial status for a user
 */
export async function getTrialStatus(): Promise<{
  isTrial: boolean;
  daysLeft: number;
  isInGracePeriod: boolean;
  gracePeriodDaysLeft: number;
  canAccessFeatures: boolean;
  message: string;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_trial_status');

    if (error) {
      // Don't log AbortErrors - they're expected during navigation/remounts
      if (error.message?.includes('AbortError') || error.message?.includes('aborted') || 
          (error instanceof DOMException && error.name === 'AbortError')) {
        return null;
      }
      console.error('Error getting trial status:', error);
      return null;
    }

    return {
      isTrial: data.isTrial,
      daysLeft: data.daysLeft,
      isInGracePeriod: data.isInGracePeriod,
      gracePeriodDaysLeft: data.gracePeriodDaysLeft,
      canAccessFeatures: data.canAccessFeatures,
      message: data.isTrial ? `${data.daysLeft} days left in trial` : 'Active subscription'
    };
  } catch (error: any) {
    // Don't log AbortErrors - they're expected during navigation/remounts
    if (error?.message?.includes('AbortError') || error?.message?.includes('aborted') || 
        (error instanceof DOMException && error.name === 'AbortError')) {
      return null;
    }
    console.error('Error getting trial status:', error);
    return null;
  }
}

/**
 * Check if user can perform an action based on limits
 */
export async function checkUsageLimit(limitType: 'users' | 'products' | 'invoices' | 'locations'): Promise<{
  current: number;
  limit: number;
  canAdd: boolean;
}> {
  try {
    const subscription = await getUserSubscription();
    if (!subscription) {
      return { current: 0, limit: 0, canAdd: false };
    }

    let current = 0;
    let limit = 0;

    // Get limit from plan (default to generous limits if not set)
    const plan = subscription.plan;
    switch (limitType) {
      case 'users':
        limit = plan.max_users || 10;
        break;
      case 'products':
        limit = plan.max_products || 1000;
        break;
      case 'invoices':
        limit = plan.max_invoices_monthly || 500;
        break;
      case 'locations':
        limit = plan.max_pos_locations || 5;
        break;
    }

    // -1 means unlimited
    if (limit === -1) {
      limit = 999999; // High number for UI display
    }

    // Get current usage from database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { current: 0, limit, canAdd: true };

    switch (limitType) {
      case 'users': {
        // Count users in the same company
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.user_metadata?.company_id);
        current = userCount || 0;
        break;
      }
      case 'products': {
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
        current = productCount || 0;
        break;
      }
      case 'invoices': {
        // Count invoices for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: invoiceCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .gte('created_at', startOfMonth.toISOString());
        current = invoiceCount || 0;
        break;
      }
      case 'locations': {
        // TODO: Implement POS location tracking
        current = 0;
        break;
      }
    }

    return {
      current,
      limit,
      canAdd: current < limit,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { current: 0, limit: 999, canAdd: true };
  }
}

/**
 * Record usage for tracking and billing
 */
export async function recordUsage(
  featureType: 'users' | 'products' | 'invoices' | 'pos_locations' | 'storage',
  count: number = 1
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const periodStart = new Date();
    periodStart.setDate(1); // Start of current month
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase
      .from('feature_usage')
      .upsert({
        user_id: user.id,
        feature_type: featureType,
        count: count,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,feature_type,period_start'
      });
  } catch (error) {
    console.error('Error recording usage:', error);
  }
}

/**
 * Get billing history for user
 */
export async function getBillingHistory(): Promise<PaymentRecord[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get subscription ID first
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!subscription) return [];

    const { data, error } = await supabase
      .from('subscription_payments')
      .select(`
        id,
        subscription_id,
        amount,
        currency,
        status,
        payment_method,
        transaction_id,
        invoice_url,
        created_at
      `)
      .eq('subscription_id', subscription.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
}

/**
 * Get current usage statistics
 */
export async function getCurrentUsage(): Promise<Record<string, { current: number; limit: number; percentage: number }>> {
  const usage: Record<string, { current: number; limit: number; percentage: number }> = {};

  const limitTypes: Array<'users' | 'products' | 'invoices' | 'locations'> = ['users', 'products', 'invoices', 'locations'];

  for (const type of limitTypes) {
    const limitData = await checkUsageLimit(type);
    usage[type] = {
      current: limitData.current,
      limit: limitData.limit,
      percentage: limitData.limit > 0 ? (limitData.current / limitData.limit) * 100 : 0,
    };
  }

  return usage;
}

/**
 * Get trial analytics for admin dashboard
 */
export async function getTrialAnalytics(): Promise<{
  totalTrials: number;
  activeTrials: number;
  expiredTrials: number;
  convertedTrials: number;
  conversionRate: number;
  averageTrialLength: number;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_trial_analytics');

    if (error) {
      console.error('Error getting trial analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting trial analytics:', error);
    return null;
  }
}

/**
 * Process trial expirations (should be called by a scheduled job)
 */
export async function processTrialExpirations(): Promise<{
  processed: number;
  expired: number;
  suspended: number;
}> {
  try {
    const { data, error } = await supabase
      .rpc('process_trial_expirations');

    if (error) {
      console.error('Error processing trial expirations:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error processing trial expirations:', error);
    throw error;
  }
}

/**
 * Update trial statuses (should be called by a scheduled job)
 */
export async function updateTrialStatuses(): Promise<{
  updated: number;
  expired: number;
  suspended: number;
}> {
  try {
    const { data, error } = await supabase
      .rpc('update_trial_statuses');

    if (error) {
      console.error('Error updating trial statuses:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating trial statuses:', error);
    throw error;
  }
}

/**
 * Export user data before account suspension
 */
export async function exportUserData(): Promise<{
  users: Array<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  companies: Array<{
    id: string;
    name: string;
    industry: string | null;
    size: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  customers: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>;
  invoices: Array<{
    id: string;
    customer_id: string;
    total_amount: number;
    status: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>;
  exportDate: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get all user data
    const [usersData, companiesData, customersData, productsData, invoicesData] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id),
      supabase.from('companies').select('*').eq('created_by', user.id),
      supabase.from('customers').select('*').eq('created_by', user.id),
      supabase.from('products').select('*').eq('created_by', user.id),
      supabase.from('invoices').select('*').eq('created_by', user.id),
    ]);

    return {
      users: usersData.data || [],
      companies: companiesData.data || [],
      customers: customersData.data || [],
      products: productsData.data || [],
      invoices: invoicesData.data || [],
      exportDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
}

/**
 * Send trial expiration notification email
 */
export async function sendTrialExpirationEmail(
  userId: string,
  daysLeft: number,
  isGracePeriod: boolean = false
): Promise<boolean> {
  try {
    // Get user email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error getting user data for email:', userError);
      return false;
    }

    const subject = isGracePeriod
      ? `Your COPCCA CRM Trial Expires in ${daysLeft} Days`
      : daysLeft <= 0
        ? 'Your COPCCA CRM Trial Has Expired'
        : `Trial Ending Soon - ${daysLeft} Days Left`;

    const message = isGracePeriod
      ? `Hi ${userData.full_name},\n\nYour COPCCA CRM trial is in its grace period and will expire in ${daysLeft} days. To continue using all features, please upgrade your account.\n\nVisit your account settings to upgrade and avoid service interruption.\n\nBest regards,\nCOPCCA CRM Team`
      : daysLeft <= 0
        ? `Hi ${userData.full_name},\n\nYour COPCCA CRM trial has expired. Some features may be limited. Please upgrade your account to continue using all features.\n\nVisit your account settings to upgrade.\n\nBest regards,\nCOPCCA CRM Team`
        : `Hi ${userData.full_name},\n\nYour COPCCA CRM trial will expire in ${daysLeft} days. Don't lose access to your data - upgrade now to continue using all features.\n\nVisit your account settings to upgrade.\n\nBest regards,\nCOPCCA CRM Team`;

    // In a real implementation, you would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll log the email that would be sent
    console.log('Trial expiration email would be sent:', {
      to: userData.email,
      subject,
      message,
    });

    // TODO: Integrate with actual email service
    // await sendEmail(userData.email, subject, message);

    return true;
  } catch (error) {
    console.error('Error sending trial expiration email:', error);
    return false;
  }
}

/**
 * Upgrade or downgrade subscription plan
 */
export async function changeSubscriptionPlan(newPlanId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the plan name from plan ID
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', newPlanId)
      .single();

    if (planError) throw planError;

    // Call the database function to handle the upgrade properly
    const { data: result, error: upgradeError } = await supabase
      .rpc('upgrade_user_subscription', {
        p_user_id: user.id,
        p_new_plan_name: planData.name,
        p_billing_cycle: 'monthly'
      });

    if (upgradeError) throw upgradeError;

    if (!result?.success) {
      throw new Error(result?.error || 'Failed to upgrade subscription');
    }

    console.log('Subscription upgraded:', result);

    // Record the plan change
    await recordUsage('users', 0); // Trigger usage update
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    throw error;
  }
}

/**
 * Record cash payment and activate subscription
 */
export async function recordCashPayment(
  subscriptionId: string,
  amount: number,
  customerName: string,
  customerPhone?: string,
  paymentLocation: string = 'office',
  receiptNumber?: string,
  notes?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Record cash payment using database function
    const { data, error } = await supabase
      .rpc('record_cash_payment', {
        p_subscription_id: subscriptionId,
        p_amount: amount,
        p_currency: 'TZS',
        p_payment_date: new Date().toISOString(),
        p_collector_id: user.id,
        p_notes: notes || 'Cash payment recorded'
      });

    if (error) throw error;

    // Record additional cash payment details
    const { error: cashError } = await supabase
      .from('cash_payments')
      .insert({
        subscription_id: subscriptionId,
        amount: amount,
        currency: 'TZS',
        payment_location: paymentLocation,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        receipt_number: receiptNumber || null,
        notes: notes,
        collected_by: user.id,
        status: 'verified', // Auto-verify for direct recording
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      });

    if (cashError) {
      console.error('Error recording cash payment details:', cashError);
      // Don't throw here as the main payment was recorded
    }

    return true;
  } catch (error) {
    console.error('Error recording cash payment:', error);
    throw error;
  }
}

/**
 * Get cash payments for admin dashboard
 */
export async function getCashPayments(
  status?: 'pending' | 'verified' | 'rejected',
  limit: number = 50
): Promise<Array<{
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  collected_by: string;
  payment_location: string;
  customer_name: string;
  customer_phone: string | null;
  receipt_number: string | null;
  status: 'pending' | 'verified' | 'rejected';
  users_collector?: { full_name: string };
  user_subscriptions?: {
    subscription_plans: { display_name: string };
    users: { full_name: string; email: string };
  };
}>> {
  try {
    let query = supabase
      .from('cash_payments')
      .select(`
        *,
        users_collector:collected_by (
          full_name
        ),
        user_subscriptions (
          subscription_plans (
            display_name
          ),
          users (
            full_name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching cash payments:', error);
    return [];
  }
}

/**
 * Get cash payment summary
 */
export async function getCashPaymentSummary(
  startDate?: string,
  endDate?: string
): Promise<{
  total_payments: number;
  total_amount: number;
  verified_payments: number;
  pending_payments: number;
  rejected_payments: number;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_cash_payments_summary', {
        p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate || new Date().toISOString(),
      });

    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching cash payment summary:', error);
    return null;
  }
}

/**
 * Verify or reject cash payment
 */
export async function verifyCashPayment(
  paymentId: string,
  status: 'verified' | 'rejected'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .rpc('verify_cash_payment', {
        p_payment_id: paymentId,
        p_verifier_id: user.id,
        p_status: status,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error verifying cash payment:', error);
    throw error;
  }
}

/**
 * Activate subscription with cash payment (alternative method)
 */
export async function activateSubscriptionWithCash(
  userId: string,
  amount?: number
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('activate_subscription_with_payment', {
        p_user_id: userId,
        p_payment_method: 'cash',
        p_transaction_id: `CASH-${Date.now()}`,
        p_amount: amount,
      });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error activating subscription with cash:', error);
    throw error;
  }
}