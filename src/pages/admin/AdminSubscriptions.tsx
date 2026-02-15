import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Shield,
  Banknote,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
  Bell,
  BellOff,
  Trash2,
  Lock,
  Unlock,
  TrendingUp,
  Calendar,
  Banknote,
  UserCheck,
  Settings,
  Edit,
  ArrowUp,
  ArrowDown,
  Receipt,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { formatName, formatEmail } from '@/lib/textFormat';
import { supabase } from '@/lib/supabase';
import { getUserSubscription, getSubscriptionStatus } from '@/lib/subscription';
import { CashPaymentManager } from '@/components/ui/CashPaymentManager';

interface SubscriptionData {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trial_start_date: string | null;
  trial_end_date: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  payment_method: string | null;
  last_payment_date: string | null;
  next_payment_date: string | null;
  amount: number | null;
  currency: string;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  plan: {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number;
    currency: string;
    max_users: number;
    max_products: number;
    max_invoices_monthly: number;
    max_pos_locations: number;
    features: string[];
    is_active: boolean;
    trial_days: number;
  };
  user: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
    phone: string;
    created_at: string;
  };
}

interface PaymentRecord {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_id: string | null;
  invoice_url: string | null;
  created_at: string;
}

interface UsageStats {
  users: number;
  products: number;
  invoices_this_month: number;
  pos_locations: number;
}

export const AdminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [usageStats, setUsageStats] = useState<Record<string, UsageStats>>({});
  const [showTrialAnalytics, setShowTrialAnalytics] = useState(false);
  const [trialAnalytics, setTrialAnalytics] = useState<any[]>([]);
  const [isProcessingTrials, setIsProcessingTrials] = useState(false);
  const [activeTab, setActiveTab] = useState('subscriptions');

  useEffect(() => {
    fetchSubscriptions();
    fetchPayments();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*),
          users (
            id,
            email,
            full_name,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(sub => ({
        ...sub,
        user: {
          id: sub.users?.id || '',
          email: sub.users?.email || '',
          full_name: sub.users?.full_name || sub.users?.email?.split('@')[0] || 'Unknown',
          company_name: sub.users?.raw_user_meta_data?.companyName || '',
          phone: sub.users?.raw_user_meta_data?.phone || '',
          created_at: sub.users?.created_at || sub.created_at,
        }
      })) || [];

      setSubscriptions(formattedData);

      // Fetch usage stats for each subscription
      const usagePromises = formattedData.map(async (sub) => {
        const stats = await getUsageStats(sub.user_id);
        return { userId: sub.user_id, stats };
      });

      const usageResults = await Promise.all(usagePromises);
      const usageMap: Record<string, UsageStats> = {};
      usageResults.forEach(({ userId, stats }) => {
        usageMap[userId] = stats;
      });
      setUsageStats(usageMap);

    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const getUsageStats = async (userId: string): Promise<UsageStats> => {
    try {
      // Get user count (simplified - in real app, you'd track this properly)
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId);

      // Get product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId);

      // Get invoices this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: invoiceCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .gte('created_at', startOfMonth.toISOString());

      return {
        users: userCount || 0,
        products: productCount || 0,
        invoices_this_month: invoiceCount || 0,
        pos_locations: 0, // TODO: Implement POS location tracking
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return { users: 0, products: 0, invoices_this_month: 0, pos_locations: 0 };
    }
  };

  const handleProcessTrialExpirations = async () => {
    setIsProcessingTrials(true);
    try {
      const { data, error } = await supabase.rpc('process_trial_expirations');

      if (error) throw error;

      toast.success('Trial expiration processing completed!');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error processing trial expirations:', error);
      toast.error('Failed to process trial expirations');
    } finally {
      setIsProcessingTrials(false);
    }
  };

  const handleLoadTrialAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trial_analytics', { days_back: 30 });

      if (error) throw error;

      setTrialAnalytics(data || []);
      setShowTrialAnalytics(true);
    } catch (error) {
      console.error('Error loading trial analytics:', error);
      toast.error('Failed to load trial analytics');
    }
  };

  const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Subscription status updated');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update subscription status');
    }
  };

  const handlePlanChange = async (subscriptionId: string, newPlanId: string) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: newPlanId,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Subscription plan updated');
      fetchSubscriptions();
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update subscription plan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'past_due': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'trial': return <Clock className="w-4 h-4" />;
      case 'past_due': return <CreditCard className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.plan.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trial: subscriptions.filter(s => s.status === 'trial').length,
    pastDue: subscriptions.filter(s => s.status === 'past_due').length,
    expired: subscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled').length,
    totalRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Management</h1>
          <p className="text-slate-600 mt-1">Manage user subscriptions, payments, and billing</p>
        </div>
        <Button onClick={() => fetchSubscriptions()} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('cash')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cash'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Cash Payments
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'subscriptions' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active</p>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Trial</p>
              <p className="text-2xl font-bold text-slate-900">{stats.trial}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Expired</p>
              <p className="text-2xl font-bold text-slate-900">{stats.expired}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Past Due</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pastDue}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-slate-900">TZS {stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Trial Management Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Trial Management</h3>
            <p className="text-slate-600 text-sm">Monitor and manage trial expirations</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleLoadTrialAnalytics}
              variant="outline"
              size="sm"
              icon={BarChart3}
            >
              View Analytics
            </Button>
            <Button
              onClick={handleProcessTrialExpirations}
              disabled={isProcessingTrials}
              variant="outline"
              size="sm"
              icon={isProcessingTrials ? RefreshCw : AlertTriangle}
            >
              {isProcessingTrials ? 'Processing...' : 'Process Expirations'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by email, name, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-700">User</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Plan</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Trial Ends</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Usage</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((subscription) => {
                const usage = usageStats[subscription.user_id] || { users: 0, products: 0, invoices_this_month: 0, pos_locations: 0 };
                const isNearLimit = usage.users >= subscription.plan.max_users * 0.8 ||
                                   usage.products >= subscription.plan.max_products * 0.8 ||
                                   usage.invoices_this_month >= subscription.plan.max_invoices_monthly * 0.8;

                return (
                  <tr key={subscription.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{subscription.user.full_name}</p>
                        <p className="text-sm text-slate-600">{subscription.user.email}</p>
                        {subscription.user.company_name && (
                          <p className="text-xs text-slate-500">{subscription.user.company_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{subscription.plan.display_name}</p>
                        <p className="text-sm text-slate-600">{subscription.plan.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        {getStatusIcon(subscription.status)}
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-900">
                        TZS {subscription.amount?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-slate-600">{subscription.currency}</p>
                    </td>
                    <td className="py-4 px-4">
                      {subscription.trial_end_date ? (
                        <p className="text-sm text-slate-900">
                          {new Date(subscription.trial_end_date).toLocaleDateString()}
                        </p>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className={usage.users >= subscription.plan.max_users ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            Users: {usage.users}/{subscription.plan.max_users}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className={usage.products >= subscription.plan.max_products ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            Products: {usage.products}/{subscription.plan.max_products}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className={usage.invoices_this_month >= subscription.plan.max_invoices_monthly ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            Invoices: {usage.invoices_this_month}/{subscription.plan.max_invoices_monthly}
                          </span>
                        </p>
                        {isNearLimit && (
                          <div className="flex items-center gap-1 text-yellow-600 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            Near limit
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowUpgradeModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Subscription Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Subscription Details"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-slate-900">User Information</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedSubscription.user.full_name}</p>
                <p className="text-sm text-slate-600">{selectedSubscription.user.email}</p>
                <p className="text-sm text-slate-600">{selectedSubscription.user.company_name}</p>
                <p className="text-sm text-slate-600">{selectedSubscription.user.phone}</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Plan Details</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedSubscription.plan.display_name}</p>
                <p className="text-sm text-slate-600">TZS {selectedSubscription.amount?.toLocaleString() || '0'} {selectedSubscription.currency}</p>
                <p className="text-sm text-slate-600">Status: {selectedSubscription.status}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-2">Plan Limits</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Max Users: {selectedSubscription.plan.max_users}</div>
                <div>Max Products: {selectedSubscription.plan.max_products}</div>
                <div>Max Monthly Invoices: {selectedSubscription.plan.max_invoices_monthly}</div>
                <div>Max POS Locations: {selectedSubscription.plan.max_pos_locations}</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-2">Features</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSubscription.plan.features?.map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => handleStatusChange(selectedSubscription.id, selectedSubscription.status === 'active' ? 'cancelled' : 'active')}
                variant={selectedSubscription.status === 'active' ? 'destructive' : 'default'}
              >
                {selectedSubscription.status === 'active' ? 'Cancel Subscription' : 'Reactivate'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Plan Upgrade Modal */}
      {showUpgradeModal && selectedSubscription && (
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Change Subscription Plan"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              Change the subscription plan for {selectedSubscription.user.full_name}
            </p>

            <div className="space-y-3">
              {['start', 'grow', 'pro', 'enterprise'].map((planName) => (
                <div
                  key={planName}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSubscription.plan.name === planName
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => {
                    // In a real app, you'd fetch the plan ID from the database
                    const planIds: Record<string, string> = {
                      'start': 'start-plan-id',
                      'grow': 'grow-plan-id',
                      'pro': 'pro-plan-id',
                      'enterprise': 'enterprise-plan-id'
                    };
                    handlePlanChange(selectedSubscription.id, planIds[planName]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">{planName.charAt(0).toUpperCase() + planName.slice(1)} Plan</h4>
                      <p className="text-sm text-slate-600">Plan description here</p>
                    </div>
                    {selectedSubscription.plan.name === planName && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => setShowUpgradeModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
        </>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {payment.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        TZS {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {payment.payment_method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'cash' && (
        <CashPaymentManager />
      )}

      {/* Trial Analytics Modal */}
      {showTrialAnalytics && (
        <Modal
          isOpen={showTrialAnalytics}
          onClose={() => setShowTrialAnalytics(false)}
          title="Trial Analytics (Last 30 Days)"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trialAnalytics.map((metric, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    {metric.metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <p className="text-3xl font-bold text-primary-600">{metric.value}</p>
                  <p className="text-sm text-slate-600">{metric.percentage}%</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => setShowTrialAnalytics(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
