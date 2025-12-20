import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Search, 
  Calendar,
  Mail,
  Shield,
  Crown,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Clock
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface UserSubscription {
  id: string;
  adminEmail: string;
  adminName: string;
  totalUsers: number;
  subscriptionStatus: 'active' | 'expired' | 'pending';
  paymentStatus: 'paid' | 'unpaid';
  subscriptionStart: string;
  subscriptionEnd: string;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  paymentMethod: string;
}

export function AdminManagementDashboard() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'pending'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'unpaid'>('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/admin/subscriptions`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      } else {
        toast.error('Failed to load subscriptions');
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Error loading subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscriptionStatus = async (adminEmail: string, status: 'active' | 'expired') => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/admin/subscription/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminEmail, status }),
        }
      );

      if (response.ok) {
        toast.success(`Subscription ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
        loadSubscriptions();
      } else {
        toast.error('Failed to update subscription status');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Error updating subscription');
    }
  };

  const updatePaymentStatus = async (adminEmail: string, status: 'paid' | 'unpaid') => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/admin/payment/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminEmail, status }),
        }
      );

      if (response.ok) {
        toast.success(`Payment status updated to ${status}`);
        loadSubscriptions();
      } else {
        toast.error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Error updating payment status');
    }
  };

  // Filter and search logic
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.adminName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatusFilter = filterStatus === 'all' || sub.subscriptionStatus === filterStatus;
    const matchesPaymentFilter = filterPayment === 'all' || sub.paymentStatus === filterPayment;

    return matchesSearch && matchesStatusFilter && matchesPaymentFilter;
  });

  // Statistics
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(s => s.subscriptionStatus === 'active').length;
  const expiredSubscriptions = subscriptions.filter(s => s.subscriptionStatus === 'expired').length;
  const paidSubscriptions = subscriptions.filter(s => s.paymentStatus === 'paid').length;
  const unpaidSubscriptions = subscriptions.filter(s => s.paymentStatus === 'unpaid').length;
  const totalRevenue = subscriptions
    .filter(s => s.paymentStatus === 'paid')
    .reduce((sum, s) => sum + s.lastPaymentAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-700 text-white p-8 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">COPCCA CRM Admin Dashboard</h1>
              <p className="text-white/90">Subscription & User Management System</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} />
                <span className="text-xs font-semibold">Total Admins</span>
              </div>
              <p className="text-2xl font-bold">{totalSubscriptions}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} />
                <span className="text-xs font-semibold">Active</span>
              </div>
              <p className="text-2xl font-bold text-green-300">{activeSubscriptions}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={18} />
                <span className="text-xs font-semibold">Expired</span>
              </div>
              <p className="text-2xl font-bold text-red-300">{expiredSubscriptions}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck size={18} />
                <span className="text-xs font-semibold">Paid</span>
              </div>
              <p className="text-2xl font-bold text-green-300">{paidSubscriptions}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} />
                <span className="text-xs font-semibold">Unpaid</span>
              </div>
              <p className="text-2xl font-bold text-yellow-300">{unpaidSubscriptions}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} />
                <span className="text-xs font-semibold">Total Revenue</span>
              </div>
              <p className="text-xl font-bold">TSH {(totalRevenue / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Admins
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subscription Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Admin Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Users
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Subscription
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" />
                        Loading subscriptions...
                      </div>
                    </td>
                  </tr>
                ) : filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            sub.subscriptionStatus === 'active' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Crown size={20} className={
                              sub.subscriptionStatus === 'active' ? 'text-green-600' : 'text-gray-400'
                            } />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{sub.adminName}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail size={12} />
                              {sub.adminEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <span className="font-semibold text-gray-900">{sub.totalUsers}</span>
                          <span className="text-xs text-gray-500">users</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          sub.subscriptionStatus === 'active'
                            ? 'bg-green-100 text-green-700'
                            : sub.subscriptionStatus === 'expired'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sub.subscriptionStatus === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {sub.subscriptionStatus.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            sub.paymentStatus === 'paid'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            <DollarSign size={12} />
                            {sub.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                          </span>
                          {sub.paymentStatus === 'paid' && (
                            <p className="text-xs text-gray-600">
                              TSH {sub.lastPaymentAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs text-gray-600">
                          <p className="flex items-center gap-1">
                            <Calendar size={12} />
                            Start: {new Date(sub.subscriptionStart).toLocaleDateString()}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock size={12} />
                            End: {new Date(sub.subscriptionEnd).toLocaleDateString()}
                          </p>
                          {sub.lastPaymentDate && (
                            <p className="flex items-center gap-1">
                              <TrendingUp size={12} />
                              Paid: {new Date(sub.lastPaymentDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {sub.subscriptionStatus === 'active' ? (
                            <button
                              onClick={() => updateSubscriptionStatus(sub.adminEmail, 'expired')}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => updateSubscriptionStatus(sub.adminEmail, 'active')}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          
                          {sub.paymentStatus === 'paid' ? (
                            <button
                              onClick={() => updatePaymentStatus(sub.adminEmail, 'unpaid')}
                              className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-200 transition-colors"
                            >
                              Mark Unpaid
                            </button>
                          ) : (
                            <button
                              onClick={() => updatePaymentStatus(sub.adminEmail, 'paid')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                TSH {((totalRevenue / 12) / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Average Users per Admin</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalSubscriptions > 0 ? (subscriptions.reduce((sum, s) => sum + s.totalUsers, 0) / totalSubscriptions).toFixed(1) : 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Users in System</p>
              <p className="text-2xl font-bold text-purple-600">
                {subscriptions.reduce((sum, s) => sum + s.totalUsers, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
