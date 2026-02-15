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
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { formatName, formatEmail } from '@/lib/textFormat';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/types/database';

type UserRow = Database['public']['Tables']['users']['Row'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];

interface Subscription {
  id: string;
  companyName: string;
  adminEmail: string;
  adminName: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'expired' | 'trial' | 'suspended' | 'past_due';
  userCount: number;
  maxUsers: number;
  monthlyFee: number;
  startDate: string;
  renewalDate: string;
  lastPayment: string;
  totalRevenue: number;
  trialDaysLeft?: number;
  showPaymentPopup: boolean;
  users: CompanyUser[];
}

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'disabled';
  lastActive: string;
}

interface PlatformStats {
  totalCompanies: number;
  activeSubscriptions: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  trialAccounts: number;
  expiredAccounts: number;
  suspendedAccounts: number;
  pastDueAccounts: number;
}

export const PlatformAdmin: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'expired' | 'suspended' | 'past_due'>('all');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      // Removed setLoading(true) - show UI immediately
      
      // PARALLEL API CALLS - fetch profiles and companies simultaneously
      const [profilesResult, companiesResult] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('companies').select('*')
      ]);

      const { data: profiles, error: profilesError } = profilesResult;
      const { data: companies } = companiesResult;

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        toast.error('Could not fetch users');
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        toast.info('No users found in database');
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      // Group users by email domain to simulate companies
      const usersByDomain: { [key: string]: UserRow[] } = {};
      
      profiles.forEach((user: UserRow) => {
        const emailDomain = user.email?.split('@')[1] || 'unknown';
        if (!usersByDomain[emailDomain]) {
          usersByDomain[emailDomain] = [];
        }
        usersByDomain[emailDomain].push(user);
      });

      // Convert to subscription format
      const subs: Subscription[] = Object.entries(usersByDomain).map(([domain, users]) => {
        const adminUser = users.find(u => u.role === 'admin') || users[0];
        const company = companies?.find((c: CompanyRow) => c.email?.includes(domain));
        
        const createdDate = new Date(adminUser.created_at);
        const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const isTrial = daysSinceCreation <= 7;
        
        let plan: 'starter' | 'professional' | 'enterprise' = 'starter';
        let maxUsers = 10;
        let monthlyFee = 45000;
        
        if (users.length > 25) {
          plan = 'enterprise';
          maxUsers = 100;
          monthlyFee = 250000;
        } else if (users.length > 10) {
          plan = 'professional';
          maxUsers = 25;
          monthlyFee = 120000;
        }

        return {
          id: adminUser.id,
          companyName: company?.name || `${domain.split('.')[0].toUpperCase()} Company`,
          adminEmail: adminUser.email || '',
          adminName: adminUser.full_name || adminUser.email?.split('@')[0] || 'Unknown',
          plan,
          status: isTrial ? 'trial' : 'active',
          userCount: users.length,
          maxUsers,
          monthlyFee,
          startDate: createdDate.toISOString().split('T')[0],
          renewalDate: new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          lastPayment: isTrial ? 'N/A' : createdDate.toISOString().split('T')[0],
          totalRevenue: isTrial ? 0 : monthlyFee * Math.ceil(daysSinceCreation / 30),
          trialDaysLeft: isTrial ? Math.max(0, 7 - daysSinceCreation) : undefined,
          showPaymentPopup: false,
          users: users.map(u => ({
            id: u.id,
            name: u.full_name || u.email?.split('@')[0] || 'Unknown',
            email: u.email || '',
            role: u.role || 'user',
            status: u.status === 'active' ? 'active' : 'disabled',
            lastActive: new Date(u.updated_at || u.created_at).toLocaleDateString()
          }))
        };
      });

      setSubscriptions(subs);
      toast.success(`Loaded ${subs.length} ${subs.length === 1 ? 'company' : 'companies'} from database`);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load real data');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    companyName: '',
    adminEmail: '',
    adminName: '',
    plan: 'starter' as Subscription['plan'],
    maxUsers: 10,
    monthlyFee: 45000,
  });

  // Calculate stats
  const stats: PlatformStats = {
    totalCompanies: subscriptions.length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    totalUsers: subscriptions.reduce((sum, s) => sum + s.userCount, 0),
    activeUsers: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.userCount, 0),
    monthlyRevenue: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyFee, 0),
    trialAccounts: subscriptions.filter(s => s.status === 'trial').length,
    expiredAccounts: subscriptions.filter(s => s.status === 'expired').length,
    suspendedAccounts: subscriptions.filter(s => s.status === 'suspended').length,
    pastDueAccounts: subscriptions.filter(s => s.status === 'past_due').length,
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.adminName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub: Subscription = {
      id: Date.now().toString(),
      ...formData,
      status: 'trial',
      userCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastPayment: 'N/A',
      totalRevenue: 0,
      trialDaysLeft: 7,
      showPaymentPopup: false,
      users: [],
    };
    setSubscriptions([...subscriptions, newSub]);
    setShowAddModal(false);
    setFormData({ companyName: '', adminEmail: '', adminName: '', plan: 'starter', maxUsers: 10, monthlyFee: 45000 });
    toast.success(`${newSub.companyName} added with 7-day free trial!`);
  };

  const handleStatusChange = async (id: string, newStatus: Subscription['status']) => {
    try {
      // Update local state immediately for responsive UI
      setSubscriptions(subscriptions.map(sub =>
        sub.id === id ? { ...sub, status: newStatus } : sub
      ));
      
      // Update in database
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus === 'suspended' ? 'inactive' : 'active' })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update in database');
        // Revert local state
        fetchRealData();
      } else {
        toast.success(`Subscription status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
      fetchRealData();
    }
  };

  const handleTogglePaymentPopup = (id: string) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === id ? { ...sub, showPaymentPopup: !sub.showPaymentPopup } : sub
    ));
    const sub = subscriptions.find(s => s.id === id);
    if (sub) {
      toast.success(sub.showPaymentPopup ? 'Payment popup will be removed' : 'Payment popup will be shown');
    }
  };

  const handleDeleteSubscription = async (id: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${companyName}? This will disable all users from this company.`)) return;
    
    try {
      // Disable all users from this subscription
      const sub = subscriptions.find(s => s.id === id);
      if (!sub) return;

      const userIds = sub.users.map(u => u.id);
      
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .in('id', userIds);
      
      if (error) {
        console.error('Error deleting subscription:', error);
        toast.error('Failed to delete subscription');
      } else {
        // Remove from local state
        setSubscriptions(subscriptions.filter(s => s.id !== id));
        toast.success('Subscription deleted - all users disabled');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const handleToggleUserStatus = async (subscriptionId: string, userId: string) => {
    try {
      const sub = subscriptions.find(s => s.id === subscriptionId);
      const user = sub?.users.find(u => u.id === userId);
      
      if (!user) return;

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      
      // Update in database
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user status:', error);
        toast.error('Failed to update user status');
      } else {
        // Update local state
        setSubscriptions(subscriptions.map(sub =>
          sub.id === subscriptionId
            ? {
                ...sub,
                users: sub.users.map(user =>
                  user.id === userId
                    ? { ...user, status: newStatus === 'active' ? 'active' : 'disabled' }
                    : user
                ),
              }
            : sub
        ));
        toast.success(`User ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (subscriptionId: string, userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This will permanently remove them.')) return;
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      } else {
        // Update local state
        setSubscriptions(subscriptions.map(sub =>
          sub.id === subscriptionId
            ? {
                ...sub,
                users: sub.users.filter(user => user.id !== userId),
                userCount: sub.userCount - 1,
              }
            : sub
        ));
        toast.success('User deleted successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete user');
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'text-purple-300 bg-purple-500/20 border-purple-400/30';
      case 'professional': return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
      case 'starter': return 'text-green-300 bg-green-500/20 border-green-400/30';
      default: return 'text-white/70 bg-white/10 border-white/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-300 bg-green-500/20 border-green-400/30';
      case 'trial': return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
      case 'expired': return 'text-red-300 bg-red-500/20 border-red-400/30';
      case 'suspended': return 'text-orange-300 bg-orange-500/20 border-orange-400/30';
      case 'past_due': return 'text-yellow-300 bg-yellow-500/20 border-yellow-400/30';
      default: return 'text-white/70 bg-white/10 border-white/20';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-white" size={32} />
            Subscription Management
          </h1>
          <p className="text-white mt-1">Manage subscriptions, users, and revenue</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            icon={Download}
            onClick={() => {
              toast.success('Export functionality coming soon!');
              console.log('Exporting report...');
            }}
          >
            Export Report
          </Button>
          <Button icon={CreditCard} onClick={() => setShowAddModal(true)}>New Subscription</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          // Show skeleton loading cards
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-l-4 border-slate-700 bg-white/5 backdrop-blur-sm animate-pulse">
              <div className="h-6 w-6 bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
              <div className="h-8 bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-20"></div>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-l-4 border-blue-500 bg-white/5 backdrop-blur-sm">
          <Users className="text-blue-400 mb-2" size={24} />
          <p className="text-sm text-white/70">Total Companies</p>
          <p className="text-3xl font-bold text-white">{stats.totalCompanies}</p>
          <p className="text-xs text-green-400 mt-1">↑ +{stats.trialAccounts} on trial</p>
        </Card>
        <Card className="border-l-4 border-green-500 bg-white/5 backdrop-blur-sm">
          <CheckCircle className="text-green-400 mb-2" size={24} />
          <p className="text-sm text-white/70">Active Subscriptions</p>
          <p className="text-3xl font-bold text-white">{stats.activeSubscriptions}</p>
          <p className="text-xs text-white/70 mt-1">{stats.totalCompanies > 0 ? ((stats.activeSubscriptions / stats.totalCompanies) * 100).toFixed(0) : 0}% of total</p>
        </Card>
        <Card className="border-l-4 border-purple-500 bg-white/5 backdrop-blur-sm">
          <Activity className="text-purple-400 mb-2" size={24} />
          <p className="text-sm text-white/70">Active Users</p>
          <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
          <p className="text-xs text-white/70 mt-1">of {stats.totalUsers} total users</p>
        </Card>
        <Card className="border-l-4 border-emerald-500 bg-white/5 backdrop-blur-sm">
          <Banknote className="text-emerald-400 mb-2" size={24} />
          <p className="text-sm text-white/70">Monthly Revenue</p>
          <p className="text-2xl font-bold text-white break-words">₦{(stats.monthlyRevenue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-white/70 mt-1 break-words">Avg: ₦{(stats.monthlyRevenue / stats.activeSubscriptions / 1000).toFixed(0)}K</p>
        </Card>
          </>
        )}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-sm border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70 font-medium">Trial Accounts</p>
              <p className="text-2xl font-bold text-white">{stats.trialAccounts}</p>
            </div>
            <Clock className="text-blue-400" size={32} />
          </div>
        </Card>
        <Card className="bg-white/5 backdrop-blur-sm border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70 font-medium">Expired Accounts</p>
              <p className="text-2xl font-bold text-white">{stats.expiredAccounts}</p>
            </div>
            <XCircle className="text-red-400" size={32} />
          </div>
        </Card>
        <Card className="bg-white/5 backdrop-blur-sm border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70 font-medium">Suspended Accounts</p>
              <p className="text-2xl font-bold text-white">{stats.suspendedAccounts}</p>
            </div>
            <AlertTriangle className="text-orange-400" size={32} />
          </div>
        </Card>
        <Card className="bg-white/5 backdrop-blur-sm border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70 font-medium">Past Due Accounts</p>
              <p className="text-2xl font-bold text-white">{stats.pastDueAccounts}</p>
            </div>
            <CreditCard className="text-yellow-400" size={32} />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by company, email, or admin name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'trial', 'expired', 'suspended', 'past_due'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as typeof filterStatus)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {status === 'past_due' ? 'Past Due' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-white/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3 text-sm font-semibold text-white">Company</th>
                <th className="text-left p-3 text-sm font-semibold text-white">Plan</th>
                <th className="text-left p-3 text-sm font-semibold text-white">Status</th>
                <th className="text-left p-3 text-sm font-semibold text-white">Users</th>
                <th className="text-left p-3 text-sm font-semibold text-white">Monthly Fee</th>
                <th className="text-left p-3 text-sm font-semibold text-white">Renewal Date</th>
                <th className="text-right p-3 text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="p-3">
                    <div>
                      <p className="font-semibold text-white">{sub.companyName}</p>
                      <p className="text-xs text-white/70">{formatEmail(sub.adminEmail)}</p>
                      <p className="text-xs text-white/60">{formatName(sub.adminName)}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${getPlanColor(sub.plan)}`}>
                      {sub.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(sub.status)}`}>
                      {sub.status === 'active' && <CheckCircle size={12} />}
                      {sub.status === 'trial' && <Clock size={12} />}
                      {sub.status === 'expired' && <XCircle size={12} />}
                      {sub.status === 'suspended' && <AlertTriangle size={12} />}
                      {sub.status === 'past_due' && <CreditCard size={12} />}
                      {sub.status === 'past_due' ? 'PAST DUE' : sub.status.toUpperCase()}
                    </span>
                    {sub.status === 'trial' && sub.trialDaysLeft !== undefined && (
                      <p className="text-xs text-orange-300 font-semibold mt-1">
                        {sub.trialDaysLeft} {sub.trialDaysLeft === 1 ? 'day' : 'days'} left
                      </p>
                    )}
                    {sub.showPaymentPopup && (
                      <p className="text-xs text-red-300 font-semibold mt-1 flex items-center gap-1">
                        <Bell size={10} /> Popup Active
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-white">{sub.userCount}/{sub.maxUsers}</div>
                      <div className="w-20 bg-white/20 rounded-full h-2">\n                        <div
                          className={`h-2 rounded-full ${
                            (sub.userCount / sub.maxUsers) > 0.8 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(sub.userCount / sub.maxUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-white">₦{(sub.monthlyFee / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-white/60">₦{(sub.totalRevenue / 1000).toFixed(0)}K total</p>
                  </td>
                  <td className="p-3">
                    <p className="text-sm text-white">{new Date(sub.renewalDate).toLocaleDateString()}</p>
                    <p className="text-xs text-white/60">{Math.ceil((new Date(sub.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</p>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowDetailsModal(true);
                        }}
                        className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-300"
                        title="View Details"
                      >
                        <BarChart3 size={16} />
                      </button>
                      {sub.status === 'trial' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'active')}
                          className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors text-green-300"
                          title="Activate"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {sub.status === 'expired' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'active')}
                          className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors text-green-300"
                          title="Renew"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(sub.id, sub.status === 'suspended' ? 'active' : 'suspended')}
                        className="p-1.5 hover:bg-orange-500/20 rounded-lg transition-colors text-orange-300"
                        title={sub.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                      >
                        {sub.status === 'suspended' ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      <button
                        onClick={() => handleTogglePaymentPopup(sub.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          sub.showPaymentPopup
                            ? 'hover:bg-green-500/20 text-green-300'
                            : 'hover:bg-red-500/20 text-red-300'
                        }`}
                        title={sub.showPaymentPopup ? 'Remove Payment Popup' : 'Add Payment Popup'}
                      >
                        {sub.showPaymentPopup ? <BellOff size={16} /> : <Bell size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowUsersModal(true);
                        }}
                        className="p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors text-purple-300"
                        title="Manage Users"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(sub.id, sub.companyName)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-300"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Subscription Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Subscription" size="lg">
        <form className="space-y-4" onSubmit={handleAddSubscription}>
          <Input
            label="Company Name"
            placeholder="TechCorp Nigeria Ltd"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Admin Name"
              placeholder="John Doe"
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              required
            />
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@company.com"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => {
                  const plan = e.target.value as Subscription['plan'];
                  const fees = { starter: 45000, professional: 120000, enterprise: 250000 };
                  const users = { starter: 10, professional: 25, enterprise: 100 };
                  setFormData({ ...formData, plan, monthlyFee: fees[plan], maxUsers: users[plan] });
                }}
                className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="starter">Starter - ₦45K/mo</option>
                <option value="professional">Professional - ₦120K/mo</option>
                <option value="enterprise">Enterprise - ₦250K/mo</option>
              </select>
            </div>
            <Input
              label="Max Users"
              type="number"
              value={formData.maxUsers}
              onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Monthly Fee (₦)"
              type="number"
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" icon={CreditCard}>Create Subscription</Button>
          </div>
        </form>
      </Modal>

      {/* Subscription Details Modal */}
      {selectedSubscription && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedSubscription.companyName} - Details`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/5 backdrop-blur-sm">
                <p className="text-sm text-white/70">Admin Name</p>
                <p className="text-lg font-semibold text-white">{formatName(selectedSubscription.adminName)}</p>
              </Card>
              <Card className="bg-white/5 backdrop-blur-sm">
                <p className="text-sm text-white/70">Admin Email</p>
                <p className="text-lg font-semibold text-white">{formatEmail(selectedSubscription.adminEmail)}</p>
              </Card>
              <Card className="bg-white/5 backdrop-blur-sm">
                <p className="text-sm text-white/70">Start Date</p>
                <p className="text-lg font-semibold text-white">{new Date(selectedSubscription.startDate).toLocaleDateString()}</p>
              </Card>
              <Card className="bg-white/5 backdrop-blur-sm">
                <p className="text-sm text-white/70">Last Payment</p>
                <p className="text-lg font-semibold text-white">{selectedSubscription.lastPayment}</p>
              </Card>
              <Card className="bg-white/5 backdrop-blur-sm">
                <p className="text-sm text-white/70">Total Revenue</p>
                <p className="text-lg font-semibold text-emerald-300">₦{(selectedSubscription.totalRevenue / 1000).toFixed(0)}K</p>
              </Card>
              <Card className="bg-white/5 backdrop-blur-sm">
                <p className="text-sm text-white/70">Next Renewal</p>
                <p className="text-lg font-semibold text-white">{new Date(selectedSubscription.renewalDate).toLocaleDateString()}</p>
              </Card>
            </div>
          </div>
        </Modal>
      )}

      {/* User Management Modal */}
      {selectedSubscription && (
        <Modal
          isOpen={showUsersModal}
          onClose={() => setShowUsersModal(false)}
          title={`Manage Users - ${selectedSubscription.companyName}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <Users className="inline mr-2" size={16} />
                Total Users: {selectedSubscription.users.length} / {selectedSubscription.maxUsers}
              </p>
            </div>

            <div className="space-y-2">
              {selectedSubscription.users.length === 0 ? (
                <div className="text-center py-8 text-white/70">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No users found for this company</p>
                </div>
              ) : (
                selectedSubscription.users.map((user) => (
                  <Card key={user.id} className="p-4 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          user.status === 'active' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-white/20'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{formatName(user.name)}</p>
                          <p className="text-xs text-white/70">{formatEmail(user.email)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {user.role.toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              user.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {user.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-white/60">• Last active: {user.lastActive}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleUserStatus(selectedSubscription.id, user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'active'
                              ? 'hover:bg-orange-500/20 text-orange-300'
                              : 'hover:bg-green-500/20 text-green-300'
                          }`}
                          title={user.status === 'active' ? 'Disable User' : 'Enable User'}
                        >
                          {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(selectedSubscription.id, user.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-300"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/20">
              <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg">
                <p className="text-sm text-amber-200">
                  <AlertTriangle className="inline mr-2" size={16} />
                  <strong>Note:</strong> Disabled users cannot access the system. Admin users cannot be deleted.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
