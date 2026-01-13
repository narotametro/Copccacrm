import React, { useState } from 'react';
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

interface Subscription {
  id: string;
  companyName: string;
  adminEmail: string;
  adminName: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'expired' | 'trial' | 'suspended';
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
}

export const PlatformAdmin: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'expired' | 'suspended'>('all');

  // Demo subscription data
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: '1',
      companyName: 'TechCorp Nigeria Ltd',
      adminEmail: 'admin@techcorp.ng',
      adminName: 'chukwuma okafor',
      plan: 'enterprise',
      status: 'active',
      userCount: 45,
      maxUsers: 100,
      monthlyFee: 250000,
      startDate: '2025-06-15',
      renewalDate: '2026-02-15',
      lastPayment: '2026-01-15',
      totalRevenue: 1750000,
      showPaymentPopup: false,
      users: [
        { id: 'u1', name: 'chukwuma okafor', email: 'admin@techcorp.ng', role: 'admin', status: 'active', lastActive: '2 hours ago' },
        { id: 'u2', name: 'james okoro', email: 'james@techcorp.ng', role: 'user', status: 'active', lastActive: '5 hours ago' },
      ],
    },
    {
      id: '2',
      companyName: 'Global Trade Solutions',
      adminEmail: 'admin@gts.com',
      adminName: 'amina mohammed',
      plan: 'professional',
      status: 'active',
      userCount: 18,
      maxUsers: 25,
      monthlyFee: 120000,
      startDate: '2025-09-01',
      renewalDate: '2026-02-01',
      lastPayment: '2026-01-01',
      totalRevenue: 600000,
      showPaymentPopup: false,
      users: [
        { id: 'u4', name: 'amina mohammed', email: 'admin@gts.com', role: 'admin', status: 'active', lastActive: '1 hour ago' },
        { id: 'u5', name: 'paul eze', email: 'paul@gts.com', role: 'user', status: 'active', lastActive: '30 mins ago' },
      ],
    },
    {
      id: '3',
      companyName: 'StartHub Africa',
      adminEmail: 'ceo@starthub.africa',
      adminName: 'john adebayo',
      plan: 'starter',
      status: 'trial',
      userCount: 5,
      maxUsers: 10,
      monthlyFee: 45000,
      startDate: '2026-01-05',
      renewalDate: '2026-01-12',
      lastPayment: 'N/A',
      totalRevenue: 0,
      trialDaysLeft: 1,
      showPaymentPopup: false,
      users: [
        { id: 'u6', name: 'john adebayo', email: 'ceo@starthub.africa', role: 'admin', status: 'active', lastActive: '10 mins ago' },
      ],
    },
    {
      id: '4',
      companyName: 'Legacy Industries',
      adminEmail: 'admin@legacy.co',
      adminName: 'SARAH THOMPSON',
      plan: 'professional',
      status: 'expired',
      userCount: 12,
      maxUsers: 25,
      monthlyFee: 120000,
      startDate: '2025-03-01',
      renewalDate: '2025-12-01',
      lastPayment: '2025-11-01',
      totalRevenue: 1080000,
      showPaymentPopup: true,
      users: [
        { id: 'u7', name: 'sarah thompson', email: 'admin@legacy.co', role: 'admin', status: 'active', lastActive: '1 day ago' },
        { id: 'u8', name: 'mike johnson', email: 'mike@legacy.co', role: 'user', status: 'active', lastActive: '2 days ago' },
      ],
    },
  ]);

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

  const handleStatusChange = (id: string, newStatus: Subscription['status']) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === id ? { ...sub, status: newStatus } : sub
    ));
    toast.success('Subscription status updated');
  };

  const handleTogglePaymentPopup = (id: string) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === id ? { ...sub, showPaymentPopup: !sub.showPaymentPopup } : sub
    ));
    const sub = subscriptions.find(s => s.id === id);
    if (sub) {
      toast.success(sub.showPaymentPopup ? 'Payment popup removed' : 'Payment popup added');
    }
  };

  const handleToggleUserStatus = (subscriptionId: string, userId: string) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === subscriptionId
        ? {
            ...sub,
            users: sub.users.map(user =>
              user.id === userId
                ? { ...user, status: user.status === 'active' ? 'disabled' : 'active' }
                : user
            ),
          }
        : sub
    ));
    toast.success('User status updated');
  };

  const handleDeleteUser = (subscriptionId: string, userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
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
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'text-purple-700 bg-purple-100 border-purple-300';
      case 'professional': return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'starter': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-slate-700 bg-slate-100 border-slate-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100 border-green-300';
      case 'trial': return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'expired': return 'text-red-700 bg-red-100 border-red-300';
      case 'suspended': return 'text-orange-700 bg-orange-100 border-orange-300';
      default: return 'text-slate-700 bg-slate-100 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="text-purple-600" size={32} />
            COPCCA CRM Platform Admin
          </h1>
          <p className="text-slate-600 mt-1">Manage subscriptions, users, and revenue</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>Export Report</Button>
          <Button icon={CreditCard} onClick={() => setShowAddModal(true)}>New Subscription</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <Users className="text-blue-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Total Companies</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalCompanies}</p>
          <p className="text-xs text-green-600 mt-1">↑ +{stats.trialAccounts} on trial</p>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CheckCircle className="text-green-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Active Subscriptions</p>
          <p className="text-3xl font-bold text-green-600">{stats.activeSubscriptions}</p>
          <p className="text-xs text-slate-600 mt-1">{((stats.activeSubscriptions / stats.totalCompanies) * 100).toFixed(0)}% of total</p>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <Activity className="text-purple-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Active Users</p>
          <p className="text-3xl font-bold text-purple-600">{stats.activeUsers}</p>
          <p className="text-xs text-slate-600 mt-1">of {stats.totalUsers} total users</p>
        </Card>
        <Card className="border-l-4 border-emerald-500">
          <Banknote className="text-emerald-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Monthly Revenue</p>
          <p className="text-3xl font-bold text-emerald-600">₦{(stats.monthlyRevenue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-slate-600 mt-1">Annual: ₦{(stats.monthlyRevenue * 12 / 1000000).toFixed(1)}M</p>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Trial Accounts</p>
              <p className="text-2xl font-bold text-blue-900">{stats.trialAccounts}</p>
            </div>
            <Clock className="text-blue-600" size={32} />
          </div>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Expired Accounts</p>
              <p className="text-2xl font-bold text-red-900">{stats.expiredAccounts}</p>
            </div>
            <XCircle className="text-red-600" size={32} />
          </div>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Suspended Accounts</p>
              <p className="text-2xl font-bold text-orange-900">{stats.suspendedAccounts}</p>
            </div>
            <AlertTriangle className="text-orange-600" size={32} />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by company, email, or admin name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'trial', 'expired', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as typeof filterStatus)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Company</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Plan</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Users</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Monthly Fee</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Renewal Date</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div>
                      <p className="font-semibold text-slate-900">{sub.companyName}</p>
                      <p className="text-xs text-slate-600">{formatEmail(sub.adminEmail)}</p>
                      <p className="text-xs text-slate-500">{formatName(sub.adminName)}</p>
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
                      {sub.status.toUpperCase()}
                    </span>
                    {sub.status === 'trial' && sub.trialDaysLeft !== undefined && (
                      <p className="text-xs text-orange-600 font-semibold mt-1">
                        {sub.trialDaysLeft} {sub.trialDaysLeft === 1 ? 'day' : 'days'} left
                      </p>
                    )}
                    {sub.showPaymentPopup && (
                      <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <Bell size={10} /> Popup Active
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-slate-900">{sub.userCount}/{sub.maxUsers}</div>
                      <div className="w-20 bg-slate-200 rounded-full h-2">\n                        <div
                          className={`h-2 rounded-full ${
                            (sub.userCount / sub.maxUsers) > 0.8 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(sub.userCount / sub.maxUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-slate-900">₦{(sub.monthlyFee / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-slate-500">₦{(sub.totalRevenue / 1000).toFixed(0)}K total</p>
                  </td>
                  <td className="p-3">
                    <p className="text-sm text-slate-700">{new Date(sub.renewalDate).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">{Math.ceil((new Date(sub.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</p>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowDetailsModal(true);
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                        title="View Details"
                      >
                        <BarChart3 size={16} />
                      </button>
                      {sub.status === 'trial' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'active')}
                          className="p-1.5 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                          title="Activate"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {sub.status === 'expired' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'active')}
                          className="p-1.5 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                          title="Renew"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                      {sub.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'suspended')}
                          className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors text-orange-600"
                          title="Suspend"
                        >
                          <AlertTriangle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleTogglePaymentPopup(sub.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          sub.showPaymentPopup
                            ? 'hover:bg-green-100 text-green-600'
                            : 'hover:bg-red-100 text-red-600'
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
                        className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors text-purple-600"
                        title="Manage Users"
                      >
                        <Users size={16} />
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => {
                  const plan = e.target.value as Subscription['plan'];
                  const fees = { starter: 45000, professional: 120000, enterprise: 250000 };
                  const users = { starter: 10, professional: 25, enterprise: 100 };
                  setFormData({ ...formData, plan, monthlyFee: fees[plan], maxUsers: users[plan] });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
              <Card className="bg-slate-50">
                <p className="text-sm text-slate-600">Admin Name</p>
                <p className="text-lg font-semibold text-slate-900">{formatName(selectedSubscription.adminName)}</p>
              </Card>
              <Card className="bg-slate-50">
                <p className="text-sm text-slate-600">Admin Email</p>
                <p className="text-lg font-semibold text-slate-900">{formatEmail(selectedSubscription.adminEmail)}</p>
              </Card>
              <Card className="bg-slate-50">
                <p className="text-sm text-slate-600">Start Date</p>
                <p className="text-lg font-semibold text-slate-900">{new Date(selectedSubscription.startDate).toLocaleDateString()}</p>
              </Card>
              <Card className="bg-slate-50">
                <p className="text-sm text-slate-600">Last Payment</p>
                <p className="text-lg font-semibold text-slate-900">{selectedSubscription.lastPayment}</p>
              </Card>
              <Card className="bg-slate-50">
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-lg font-semibold text-emerald-600">₦{(selectedSubscription.totalRevenue / 1000).toFixed(0)}K</p>
              </Card>
              <Card className="bg-slate-50">
                <p className="text-sm text-slate-600">Next Renewal</p>
                <p className="text-lg font-semibold text-slate-900">{new Date(selectedSubscription.renewalDate).toLocaleDateString()}</p>
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
                <div className="text-center py-8 text-slate-500">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No users found for this company</p>
                </div>
              ) : (
                selectedSubscription.users.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          user.status === 'active' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-slate-400'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{formatName(user.name)}</p>
                          <p className="text-xs text-slate-600">{formatEmail(user.email)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role.toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {user.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-500">• Last active: {user.lastActive}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleUserStatus(selectedSubscription.id, user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'active'
                              ? 'hover:bg-orange-100 text-orange-600'
                              : 'hover:bg-green-100 text-green-600'
                          }`}
                          title={user.status === 'active' ? 'Disable User' : 'Enable User'}
                        >
                          {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(selectedSubscription.id, user.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
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

            <div className="pt-4 border-t border-slate-200">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
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
