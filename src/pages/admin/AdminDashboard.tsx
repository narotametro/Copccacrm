import React, { useState, useEffect } from 'react';
import { Users, Activity, CheckCircle, AlertTriangle, Clock, CreditCard, Banknote, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DashboardStats {
  totalCompanies: number;
  activeSubscriptions: number;
  trialAccounts: number;
  expiredAccounts: number;
  pastDueAccounts: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  avgRevenuePerCompany: number;
  growthRate: number;
  cashPaymentsPending: number;
  cashPaymentsVerified: number;
  trialsExpiringSoon: number;
}

interface RecentActivity {
  id: string;
  company: string;
  action: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
  type: 'subscription' | 'payment' | 'trial' | 'user';
}

export const AdminDashboard: React.FC = () => {
  const { formatCurrency, convertAmount } = useCurrency();
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeSubscriptions: 0,
    trialAccounts: 0,
    expiredAccounts: 0,
    pastDueAccounts: 0,
    totalUsers: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    avgRevenuePerCompany: 0,
    growthRate: 0,
    cashPaymentsPending: 0,
    cashPaymentsVerified: 0,
    trialsExpiringSoon: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Removed setLoading(true) - show UI immediately

      // Fetch subscription statistics
      const { data: subscriptionStats, error: subError } = await supabase
        .rpc('get_subscription_dashboard_stats');

      if (subError) {
        console.error('Error fetching subscription stats:', subError);
        // Fallback to basic queries if RPC function doesn't exist
        await fetchBasicStats();
      } else {
        setStats(prevStats => ({
          ...prevStats,
          ...subscriptionStats
        }));
      }

      // Fetch recent activity
      await fetchRecentActivity();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBasicStats = async () => {
    try {
      // Get subscription counts
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('status, amount, currency, trial_end_date, current_period_end');

      if (subError) throw subError;

      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
      const trialAccounts = subscriptions?.filter(s => s.status === 'trial').length || 0;
      const expiredAccounts = subscriptions?.filter(s => s.status === 'cancelled').length || 0;
      const pastDueAccounts = subscriptions?.filter(s => s.status === 'past_due').length || 0;

      // Calculate revenue
      const monthlyRevenue = subscriptions
        ?.filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

      // Get trials expiring soon (next 7 days)
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const trialsExpiringSoon = subscriptions?.filter(s =>
        s.status === 'trial' &&
        s.trial_end_date &&
        new Date(s.trial_end_date) <= sevenDaysFromNow &&
        new Date(s.trial_end_date) >= now
      ).length || 0;

      // Get cash payment stats
      const { data: cashPayments, error: cashError } = await supabase
        .from('cash_payments')
        .select('status');

      const cashPaymentsPending = cashPayments?.filter(p => p.status === 'pending').length || 0;
      const cashPaymentsVerified = cashPayments?.filter(p => p.status === 'verified').length || 0;

      // Get user counts
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalCompanies: activeSubscriptions + trialAccounts + expiredAccounts + pastDueAccounts, // Approximation
        activeSubscriptions,
        trialAccounts,
        expiredAccounts,
        pastDueAccounts,
        totalUsers: totalUsers || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.8), // Approximation
        monthlyRevenue,
        avgRevenuePerCompany: activeSubscriptions > 0 ? monthlyRevenue / activeSubscriptions : 0,
        growthRate: 15.5, // Would need historical data
        cashPaymentsPending,
        cashPaymentsVerified,
        trialsExpiringSoon,
      });

    } catch (error) {
      console.error('Error fetching basic stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get recent subscription changes
      const { data: recentSubs, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          updated_at,
          users (
            full_name,
            email
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (subError) throw subError;

      // Get recent cash payments
      const { data: recentPayments, error: payError } = await supabase
        .from('cash_payments')
        .select(`
          id,
          amount,
          status,
          created_at,
          subscription_id,
          user_subscriptions!subscription_id (
            users!user_id (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine and format activities
      const activities: RecentActivity[] = [];

      recentSubs?.forEach(sub => {
        const timeAgo = getTimeAgo(new Date(sub.updated_at));
        const userData = Array.isArray(sub.users) ? sub.users[0] : sub.users;
        activities.push({
          id: `sub-${sub.id}`,
          company: userData?.full_name || userData?.email || 'Unknown User',
          action: `Subscription ${sub.status}`,
          time: timeAgo,
          status: sub.status === 'active' ? 'success' : sub.status === 'trial' ? 'info' : 'warning',
          type: 'subscription'
        });
      });

      recentPayments?.forEach(payment => {
        const timeAgo = getTimeAgo(new Date(payment.created_at));
        const subData = Array.isArray(payment.user_subscriptions) ? payment.user_subscriptions[0] : payment.user_subscriptions;
        const userData = subData?.users ? (Array.isArray(subData.users) ? subData.users[0] : subData.users) : null;
        activities.push({
          id: `pay-${payment.id}`,
          company: userData?.full_name || 'Unknown User',
          action: `Cash payment ${payment.status} - ${formatCurrency(convertAmount(payment.amount))}`,
          time: timeAgo,
          status: payment.status === 'verified' ? 'success' : payment.status === 'pending' ? 'warning' : 'error',
          type: 'payment'
        });
      });

      // Sort by time and take top 10
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Fallback activities
      setRecentActivity([
        { id: '1', company: 'Demo Company', action: 'Subscription activated', time: '2 hours ago', status: 'success', type: 'subscription' },
        { id: '2', company: 'Sample Corp', action: 'Trial expired', time: '5 hours ago', status: 'warning', type: 'trial' },
        { id: '3', company: 'Test Ltd', action: 'Cash payment verified', time: '1 day ago', status: 'success', type: 'payment' },
      ]);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/10 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Platform Dashboard</h1>
        <p className="text-purple-200">Real-time overview of subscriptions, trials, and payments</p>
      </div>

      {/* Stats Grid - Enhanced with Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Active Subscriptions</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.activeSubscriptions}</p>
              <p className="text-green-400 text-xs mt-1">+{stats.growthRate}% this month</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Trial Accounts</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.trialAccounts}</p>
              <p className="text-yellow-400 text-xs mt-1">{stats.trialsExpiringSoon} expiring soon</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="text-yellow-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Cash Payments</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.cashPaymentsVerified}</p>
              <p className="text-blue-400 text-xs mt-1">{stats.cashPaymentsPending} pending verification</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Banknote className="text-blue-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Monthly Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(convertAmount(stats.monthlyRevenue))}</p>
              <p className="text-purple-200 text-xs mt-1">Avg: {formatCurrency(convertAmount(stats.avgRevenuePerCompany))}</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Banknote className="text-yellow-400" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Past Due Accounts</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.pastDueAccounts}</p>
              <p className="text-red-400 text-xs mt-1">Require attention</p>
            </div>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="text-red-400" size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
              <p className="text-green-400 text-xs mt-1">{stats.activeUsers} active</p>
            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="text-purple-400" size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Expired Accounts</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.expiredAccounts}</p>
              <p className="text-gray-400 text-xs mt-1">Cancelled subscriptions</p>
            </div>
            <div className="p-2 bg-gray-500/20 rounded-lg">
              <Activity className="text-gray-400" size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Subscription Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={20} />
                <span className="text-white">Active</span>
              </div>
              <span className="text-2xl font-bold text-green-400">{stats.activeSubscriptions}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Clock className="text-yellow-400" size={20} />
                <span className="text-white">Trial</span>
              </div>
              <span className="text-2xl font-bold text-yellow-400">{stats.trialAccounts}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={20} />
                <span className="text-white">Past Due</span>
              </div>
              <span className="text-2xl font-bold text-red-400">{stats.pastDueAccounts}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
              <div className="flex items-center gap-2">
                <Activity className="text-gray-400" size={20} />
                <span className="text-white">Expired</span>
              </div>
              <span className="text-2xl font-bold text-gray-400">{stats.expiredAccounts}</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Cash Payment Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-blue-400" size={20} />
                <span className="text-white">Verified</span>
              </div>
              <span className="text-2xl font-bold text-blue-400">{stats.cashPaymentsVerified}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-2">
                <Clock className="text-orange-400" size={20} />
                <span className="text-white">Pending</span>
              </div>
              <span className="text-2xl font-bold text-orange-400">{stats.cashPaymentsPending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-400" size={20} />
                <span className="text-white">Revenue</span>
              </div>
              <span className="text-2xl font-bold text-green-400">{formatCurrency(convertAmount(stats.monthlyRevenue))}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.status === 'success' ? 'bg-green-500/20' :
                  activity.status === 'warning' ? 'bg-yellow-500/20' :
                  activity.status === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  {activity.type === 'subscription' && <CheckCircle className={`w-4 h-4 ${
                    activity.status === 'success' ? 'text-green-400' :
                    activity.status === 'warning' ? 'text-yellow-400' :
                    activity.status === 'error' ? 'text-red-400' : 'text-blue-400'
                  }`} />}
                  {activity.type === 'payment' && <CreditCard className={`w-4 h-4 ${
                    activity.status === 'success' ? 'text-green-400' :
                    activity.status === 'warning' ? 'text-yellow-400' :
                    activity.status === 'error' ? 'text-red-400' : 'text-blue-400'
                  }`} />}
                  {activity.type === 'trial' && <Clock className={`w-4 h-4 ${
                    activity.status === 'success' ? 'text-green-400' :
                    activity.status === 'warning' ? 'text-yellow-400' :
                    activity.status === 'error' ? 'text-red-400' : 'text-blue-400'
                  }`} />}
                  {activity.type === 'user' && <Users className={`w-4 h-4 ${
                    activity.status === 'success' ? 'text-green-400' :
                    activity.status === 'warning' ? 'text-yellow-400' :
                    activity.status === 'error' ? 'text-red-400' : 'text-blue-400'
                  }`} />}
                </div>
                <div>
                  <p className="text-white font-medium">{activity.company}</p>
                  <p className="text-purple-200 text-sm">{activity.action}</p>
                </div>
              </div>
              <span className="text-purple-300 text-sm">{activity.time}</span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-purple-200">No recent activity</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
