import React, { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  User,
  Mail,
  Phone,
  Building,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Crown,
  AlertCircle,
  TrendingUp,
  Target,
  Package,
  DollarSign,
  BarChart3,
  Send,
  Copy,
  Link2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

interface UserType {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
  department: string;
  phone: string;
  status: 'active' | 'inactive';
  permissions: {
    customers: boolean;
    sales: boolean;
    marketing: boolean;
    products: boolean;
    competitors: boolean;
    debt_collection: boolean;
    reports: boolean;
    admin: boolean;
  };
  created_at: string;
  last_login: string;
}

const demoUsers: UserType[] = [
  {
    id: '1',
    full_name: 'Demo User',
    email: 'demo@copcca.com',
    role: 'admin',
    department: 'Sales',
    phone: '+234 801 234 5678',
    status: 'active',
    permissions: { customers: true, sales: true, marketing: true, products: true, competitors: true, debt_collection: true, reports: true, admin: true },
    created_at: '2025-11-01',
    last_login: '2026-01-08 09:15 AM',
  },
  {
    id: '2',
    full_name: 'John Smith',
    email: 'john.smith@copcca.com',
    role: 'user',
    department: 'Sales',
    phone: '+234 802 345 6789',
    status: 'active',
    permissions: { customers: true, sales: true, marketing: false, products: true, competitors: true, debt_collection: false, reports: true, admin: false },
    created_at: '2025-12-10',
    last_login: '2026-01-08 08:30 AM',
  },
  {
    id: '3',
    full_name: 'Sarah Johnson',
    email: 'sarah.j@copcca.com',
    role: 'user',
    department: 'Marketing',
    phone: '+234 803 456 7890',
    status: 'active',
    permissions: { customers: true, sales: false, marketing: true, products: true, competitors: true, debt_collection: false, reports: true, admin: false },
    created_at: '2025-12-15',
    last_login: '2026-01-07 05:45 PM',
  },
  {
    id: '4',
    full_name: 'Michael Chen',
    email: 'michael.c@copcca.com',
    role: 'user',
    department: 'Finance',
    phone: '+234 804 567 8901',
    status: 'inactive',
    permissions: { customers: false, sales: false, marketing: false, products: false, competitors: false, debt_collection: true, reports: true, admin: false },
    created_at: '2025-11-20',
    last_login: '2025-12-28 03:20 PM',
  },
];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>(demoUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [invitationLink, setInvitationLink] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    department: '',
    phone: '',
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserType = {
      id: String(users.length + 1),
      ...formData,
      status: 'active',
      permissions: formData.role === 'admin' ? {
        customers: true, sales: true, marketing: true, products: true, competitors: true, debt_collection: true, reports: true, admin: true,
      } : {
        customers: true, sales: true, marketing: false, products: true, competitors: false, debt_collection: false, reports: true, admin: false,
      },
      created_at: new Date().toISOString().split('T')[0],
      last_login: 'Never',
    };
    setUsers([...users, newUser]);
    setShowAddModal(false);
    
    // Generate invitation link
    const baseUrl = window.location.origin;
    const token = btoa(`${newUser.email}:${Date.now()}`);
    const link = `${baseUrl}/invite?token=${token}&email=${encodeURIComponent(newUser.email)}`;
    setInvitationLink(link);
    setSelectedUser(newUser);
    setShowInvitationModal(true);
    
    setFormData({ full_name: '', email: '', role: 'user', department: '', phone: '' });
    toast.success(`${formData.full_name} added successfully!`);
  };

  const handleCopyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast.success('Invitation link copied to clipboard!');
  };

  const handleSendInvitation = (email: string) => {
    // Generate invitation link
    const baseUrl = window.location.origin;
    const token = btoa(`${email}:${Date.now()}`);
    const link = `${baseUrl}/invite?token=${token}&email=${encodeURIComponent(email)}`;
    setInvitationLink(link);
    setShowInvitationModal(true);
    toast.success(`Invitation link generated for ${email}`);
  };

  const handleSendViaWhatsApp = () => {
    if (!selectedUser) return;
    const message = `Hi ${selectedUser.full_name}! 👋\n\nYou've been invited to join COPCCA CRM as a ${selectedUser.role.toUpperCase()}.\n\n🔗 Click here to complete your registration:\n${invitationLink}\n\n📋 Your Details:\n• Email: ${selectedUser.email}\n• Department: ${selectedUser.department}\n• Role: ${selectedUser.role.toUpperCase()}\n\nThis link will expire in 7 days.\n\nWelcome to the team! 🎉`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const handleSendViaEmail = () => {
    if (!selectedUser) return;
    const subject = `Welcome to COPCCA CRM - Complete Your Registration`;
    const body = `Hi ${selectedUser.full_name},\n\nYou've been invited to join COPCCA CRM!\n\n🎯 Your Role: ${selectedUser.role.toUpperCase()}\n🏢 Department: ${selectedUser.department}\n📧 Email: ${selectedUser.email}\n\n🔗 Click the link below to complete your registration:\n${invitationLink}\n\nThis link will expire in 7 days.\n\nIf you have any questions, please contact your administrator.\n\nBest regards,\nCOPCCA CRM Team`;
    const mailtoUrl = `mailto:${selectedUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    toast.success('Opening email client...');
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
        : user
    ));
    toast.success('User status updated');
  };

  const handleUpdatePermissions = (permission: keyof UserType['permissions']) => {
    if (selectedUser) {
      const updatedUser = {
        ...selectedUser,
        permissions: { ...selectedUser.permissions, [permission]: !selectedUser.permissions[permission] },
      };
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      toast.success('Permissions updated');
    }
  };

  const permissionLabels: Array<{ key: keyof UserType['permissions']; label: string; icon: any }> = [
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'sales', label: 'Sales Pipeline', icon: TrendingUp },
    { key: 'marketing', label: 'Marketing', icon: Target },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'competitors', label: 'Competitors', icon: Shield },
    { key: 'debt_collection', label: 'Debt Collection', icon: DollarSign },
    { key: 'reports', label: 'Reports & AI', icon: BarChart3 },
    { key: 'admin', label: 'Admin Panel', icon: Crown },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="text-primary-600" size={32} />
            Admin Panel - User Management
          </h1>
          <p className="text-slate-600 mt-1">Manage team members, roles, and permissions</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
          Add New Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <Users className="text-blue-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Total Users</p>
          <p className="text-3xl font-bold text-slate-900">{users.length}</p>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CheckCircle className="text-green-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Active Users</p>
          <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <Crown className="text-purple-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Administrators</p>
          <p className="text-3xl font-bold text-purple-600">{adminUsers}</p>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <XCircle className="text-orange-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Inactive Users</p>
          <p className="text-3xl font-bold text-orange-600">{users.length - activeUsers}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-slate-600" size={18} />
            <div className="flex gap-2">
              {['all', 'admin', 'user'].map((role) => (
                <button key={role} onClick={() => setFilterRole(role as typeof filterRole)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterRole === role ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  {role === 'all' ? 'All Roles' : role === 'admin' ? 'Admins' : 'Users'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-3 text-sm font-semibold text-slate-700">User</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Role</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Department</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Contact</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Last Login</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${user.role === 'admin' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{user.full_name}</p>
                        <p className="text-xs text-slate-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                      {user.role === 'admin' ? <Crown size={12} /> : <User size={12} />}
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Building size={14} className="text-slate-500" />
                      {user.department}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone size={14} className="text-slate-500" />
                      {user.phone}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                      {user.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-slate-600">{user.last_login}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setSelectedUser(user); handleSendInvitation(user.email); }} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors text-green-600" title="Send Invitation Link">
                        <Send size={16} />
                      </button>
                      <button onClick={() => { setSelectedUser(user); setShowPermissionsModal(true); }} className="p-1.5 hover:bg-primary-100 rounded-lg transition-colors text-primary-600" title="Manage Permissions">
                        <Shield size={16} />
                      </button>
                      <button onClick={() => handleToggleStatus(user.id)} className={`p-1.5 rounded-lg transition-colors ${user.status === 'active' ? 'hover:bg-orange-100 text-orange-600' : 'hover:bg-green-100 text-green-600'}`} title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600" title="Edit User">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => { if (window.confirm(`Delete ${user.full_name}?`)) { setUsers(users.filter(u => u.id !== user.id)); toast.success('User deleted'); }}} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600" title="Delete User">
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

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Team Member" size="large">
        <form className="space-y-4" onSubmit={handleAddUser}>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <AlertCircle className="inline mr-2" size={16} />
              New members will receive an email with login credentials and onboarding instructions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="John Doe" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
            <Input label="Email Address" type="email" placeholder="john.doe@copcca.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="user">User - Limited Access</option>
                <option value="admin">Admin - Full Access</option>
              </select>
            </div>
            <Input label="Department" placeholder="Sales, Marketing, Finance..." value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
            <Input label="Phone Number" placeholder="+234 801 234 5678" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
          </div>
          {formData.role === 'admin' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-semibold text-purple-900 mb-1">⚠️ Admin Role Selected</p>
              <p className="text-xs text-purple-700">Admins have full access to all modules, can manage users, and view all company data.</p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" icon={Plus}>Add Member & Send Invite</Button>
          </div>
        </form>
      </Modal>

      {/* Permissions Modal */}
      {selectedUser && (
        <Modal isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)} title={`Manage Permissions - ${selectedUser.full_name}`} size="large">
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center font-bold text-white">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedUser.role === 'admin' ? <Crown size={10} /> : <User size={10} />}
                    {selectedUser.role.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Module Access Permissions</h3>
              <p className="text-sm text-slate-600 mb-4">Toggle access to specific CRM modules. Changes are applied immediately.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissionLabels.map(({ key, label, icon: Icon }) => (
                  <div key={key} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedUser.permissions[key] ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'}`} onClick={() => handleUpdatePermissions(key)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={selectedUser.permissions[key] ? 'text-green-600' : 'text-slate-500'} />
                        <span className={`text-sm font-medium ${selectedUser.permissions[key] ? 'text-green-900' : 'text-slate-700'}`}>{label}</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors ${selectedUser.permissions[key] ? 'bg-green-500' : 'bg-slate-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${selectedUser.permissions[key] ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedUser.role === 'user' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <AlertCircle className="inline mr-2" size={16} />
                  Users with limited permissions won't see restricted modules in their navigation menu.
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowPermissionsModal(false)}>Done</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invitation Link Modal */}
      <Modal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        title="📧 Invitation Link Generated"
        size="large"
      >
        <div className="space-y-6">
          {/* Success Message */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-bold text-green-900 mb-1">Member Added Successfully!</h3>
                <p className="text-sm text-green-800">
                  {selectedUser?.full_name} has been added to the system. Share the invitation link below to complete the onboarding.
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {selectedUser && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center font-bold text-white">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedUser.role === 'admin' ? <Crown size={10} /> : <User size={10} />}
                    {selectedUser.role.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <Building size={14} className="text-slate-500" />
                  <span>{selectedUser.department}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone size={14} className="text-slate-500" />
                  <span>{selectedUser.phone}</span>
                </div>
              </div>
            </div>
          )}

          {/* Invitation Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Link2 size={16} className="text-primary-600" />
              Invitation Link Generated
            </label>
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-primary-800 mb-2">
                Choose how you want to send this invitation to <strong>{selectedUser?.full_name}</strong>:
              </p>
              <p className="text-xs text-primary-600">
                ⏱️ This link will expire in 7 days
              </p>
            </div>
          </div>

          {/* Send Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors cursor-pointer" onClick={handleSendViaWhatsApp}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Send via WhatsApp</h4>
                  <p className="text-xs text-slate-600">Open WhatsApp with pre-filled message</p>
                </div>
              </div>
              <Button 
                size="sm" 
                icon={MessageCircle} 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendViaWhatsApp();
                }}
              >
                Send via WhatsApp
              </Button>
            </div>

            <div className="p-4 border-2 border-primary-200 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer" onClick={handleSendViaEmail}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Mail className="text-primary-600" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Send via Email</h4>
                  <p className="text-xs text-slate-600">Open email client with invitation</p>
                </div>
              </div>
              <Button 
                size="sm" 
                icon={Mail} 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendViaEmail();
                }}
              >
                Send via Email
              </Button>
            </div>
          </div>

          {/* Or Copy Manually */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or copy link manually</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="flex-1 px-3 py-2 border-0 bg-white rounded text-xs font-mono text-slate-700"
              />
              <Button size="sm" icon={Copy} onClick={handleCopyInvitationLink}>
                Copy
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Next Steps for New Member:</h4>
            <ol className="space-y-1 text-sm text-blue-800 list-decimal list-inside">
              <li>Click the invitation link</li>
              <li>Create a secure password</li>
              <li>Complete profile setup</li>
              <li>Access assigned modules based on permissions</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowInvitationModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
