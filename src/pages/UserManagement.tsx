import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
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
  Clock,
  Crown,
  AlertCircle,
  TrendingUp,
  Target,
  Package,
  BarChart3,
  Send,
  Copy,
  Link2,
  MessageCircle,
  Banknote,
  Globe,
  Briefcase,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { formatName, formatRole, formatEmail } from '@/lib/textFormat';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/lib/types/database';

interface UserType {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
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

const demoUsers: UserType[] = [];

type DbUser = Database['public']['Tables']['users']['Row'];
type DbInvite = Database['public']['Tables']['invitation_links']['Row'];
type DbPermission = Database['public']['Tables']['user_permissions']['Row'];

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
);

const defaultPermissionsForRole = (role: UserType['role']): UserType['permissions'] => {
  if (role === 'admin') {
    return { customers: true, sales: true, marketing: true, products: true, competitors: true, debt_collection: true, reports: true, admin: true };
  }
  return { customers: true, sales: true, marketing: role === 'manager', products: true, competitors: role === 'manager', debt_collection: false, reports: true, admin: false };
};

const mapPermissionsFromRows = (rows: DbPermission[], userId: string, role: UserType['role']): UserType['permissions'] => {
  const base = { ...defaultPermissionsForRole(role) };
  rows
    .filter((row) => row.user_id === userId)
    .forEach((row) => {
      const key = row.module_name as keyof UserType['permissions'];
      if (key in base) {
        base[key] = row.can_view;
      }
    });
  return base;
};

export const UserManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserType[]>(demoUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'manager' | 'user'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [invitationLink, setInvitationLink] = useState('');
  const [invites, setInvites] = useState<DbInvite[]>([]);
  const [companyInfo, setCompanyInfo] = useState<(Database['public']['Tables']['companies']['Row'] & { user_count: number }) | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user' as 'admin' | 'manager' | 'user',
    department: '',
    phone: '',
  });

  useEffect(() => {
    const loadUsers = async () => {
      if (!isSupabaseConfigured || !user) {
        setUsers(demoUsers);
        return;
      }

      try {
        // First, get current user's company info
        const { data: currentUserData } = await supabase
          .from('users')
          .select('company_id, is_company_owner')
          .eq('id', user.id)
          .single();
        
        const userCompanyId = currentUserData?.company_id;

        // Fetch only users from the same company
        // This ensures:
        // 1. Other independent sign-ups (different company_id) are excluded
        // 2. Only invited users within the same company are shown
        // 3. The current admin sees themselves + their invited team members
        const query = supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        // CRITICAL: Filter by company_id to show ONLY same-company users
        // This prevents admins from seeing users from other companies
        if (userCompanyId) {
          query.eq('company_id', userCompanyId);
        } else {
          // If no company_id, only show the current user (edge case)
          query.eq('id', user.id);
        }

        const { data: dbUsers, error: usersError } = await query;

        if (usersError || !dbUsers) {
          console.warn('Falling back to demo users:', usersError?.message);
          setUsers(demoUsers);
          return;
        }

        const userIds = dbUsers.map((u: DbUser) => u.id);
        const { data: dbPermissions } = await supabase
          .from('user_permissions')
          .select('*')
          .in('user_id', userIds);

        const mappedUsers: UserType[] = dbUsers.map((row: DbUser) => {
          const role = (row.role as UserType['role']) ?? 'user';
          return {
            id: row.id,
            full_name: row.full_name,
            email: row.email,
            role,
            department: row.department || '—',
            phone: row.phone || '—',
            status: (row.status as UserType['status']) || 'active',
            permissions: mapPermissionsFromRows(dbPermissions || [], row.id, role),
            created_at: row.created_at?.split('T')[0] || '—',
            last_login: '—',
          };
        });

        setUsers(mappedUsers);

        const { data: dbInvites, error: inviteError } = await supabase
          .from('invitation_links')
          .select('*')
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (!inviteError && dbInvites) {
          setInvites(dbInvites);
          
          // Add pending invitations to the users list
          const pendingUsers: UserType[] = dbInvites.map((invite: DbInvite) => ({
            id: invite.id,
            full_name: invite.email.split('@')[0] || 'Pending User', // Use email prefix as name placeholder
            email: invite.email,
            role: invite.role as UserType['role'],
            department: 'Pending',
            phone: '—',
            status: 'pending' as UserType['status'],
            permissions: defaultPermissionsForRole(invite.role as UserType['role']),
            created_at: invite.created_at?.split('T')[0] || '—',
            last_login: 'Pending',
          }));
          
          setUsers([...mappedUsers, ...pendingUsers]);
        } else {
          setUsers(mappedUsers);
        }
      } catch (error) {
        console.warn('User load failed, using demo users', error);
        setUsers(demoUsers);
      }
    };

    const loadCompanyInfo = async () => {
      if (!isSupabaseConfigured || !user) return;

      try {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (currentUserData?.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('*, created_by')
            .eq('id', currentUserData.company_id)
            .single();

          if (company) {
            // Get user count
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id);

            setCompanyInfo({ ...company, user_count: count || 0 });
          }
        }
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        // Cleanup if needed
      }
    };

    loadUsers();
    loadCompanyInfo();
  }, [user]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Fallback to demo mode when Supabase is not configured
    if (!isSupabaseConfigured || !user) {
      try {
        const newUser: UserType = {
          id: String(users.length + 1),
          ...formData,
          status: 'active',
          permissions: defaultPermissionsForRole(formData.role),
          created_at: new Date().toISOString().split('T')[0],
          last_login: 'Never',
        };

        toast.success(`${formatName(formData.full_name)} added successfully!`);
        setUsers([...users, newUser]);
        setShowAddModal(false);

        const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const token = btoa(`${newUser.email}:${Date.now()}`);
        const link = `${baseUrl}/invite?token=${token}&email=${encodeURIComponent(newUser.email)}`;
        setInvitationLink(link);
        setSelectedUser(newUser);
        setShowInvitationModal(true);

        setFormData({ full_name: '', email: '', role: 'user', department: '', phone: '' });
      } catch (error) {
        console.error('Failed to add user:', error);
      }
      return;
    }

    const token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      toast.loading('Creating invitation...');
      
      const { data: invite, error } = await supabase
        .from('invitation_links')
        .insert({
          token,
          email: formData.email.toLowerCase(),
          role: formData.role,
          created_by: user.id,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error || !invite) {
        console.error('Invitation creation failed', error);
        toast.dismiss();
        toast.error('Failed to create invitation');
        return;
      }
      
      toast.dismiss();
      toast.success('Invitation link generated');

      const link = `${import.meta.env.VITE_APP_URL || window.location.origin}/invite?token=${token}&email=${encodeURIComponent(invite.email)}`;
      setInvitationLink(link);
      setSelectedUser({
        id: invite.id,
        full_name: formData.full_name,
        email: invite.email,
        role: invite.role as UserType['role'],
        department: formData.department,
        phone: formData.phone,
        status: 'pending' as UserType['status'],
        permissions: defaultPermissionsForRole(invite.role as UserType['role']),
        created_at: new Date().toISOString().split('T')[0],
        last_login: 'Never',
      });
      setShowInvitationModal(true);
      setShowAddModal(false);
      setInvites([invite, ...invites]);
      setFormData({ full_name: '', email: '', role: 'user', department: '', phone: '' });
    } catch (error) {
      console.error('Failed to add user via Supabase:', error);
      toast.error('Could not create invitation');
    }
  };

  const handleCopyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      toast.success('Invitation link copied!', {
        description: 'Share it with the new user'
      });
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleSendInvitation = async (email: string, role: UserType['role'] = 'user') => {
    if (!isSupabaseConfigured || !user) {
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const token = btoa(`${email}:${Date.now()}`);
      const link = `${baseUrl}/invite?token=${token}&email=${encodeURIComponent(email)}`;
      setInvitationLink(link);
      setShowInvitationModal(true);
      toast.success('Invitation link generated', {
        description: `Ready to send to ${email}`
      });
      return;
    }

    const token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const invitePromise = supabase
        .from('invitation_links')
        .insert({
          token,
          email: email.toLowerCase(),
          role,
          created_by: user?.id,
          expires_at: expiresAt,
        })
        .select()
        .single();

      const toastId = toast.loading('Generating invitation...');
      const { data: invite, error } = await invitePromise;

      if (error || !invite) {
        toast.dismiss(toastId);
        toast.error('Failed to generate invitation');
        return;
      }
      toast.dismiss(toastId);
      toast.success('Invitation ready');

      setInvites([invite, ...invites.filter((i) => i.email !== invite.email || i.token !== invite.token)]);
      const link = `${import.meta.env.VITE_APP_URL || window.location.origin}/invite?token=${token}&email=${encodeURIComponent(invite.email)}`;
      setInvitationLink(link);
      setShowInvitationModal(true);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Could not create invitation');
    }
  };

  const handleSendViaWhatsApp = () => {
    if (!selectedUser) return;
    const message = `Hi ${formatName(selectedUser.full_name)}!\n\nYou've been invited to join COPCCA CRM as a ${formatRole(selectedUser.role)}.\n\nClick here to complete your registration:\n${invitationLink}\n\nYour Details:\n• Email: ${formatEmail(selectedUser.email)}\n• Department: ${selectedUser.department}\n• Role: ${formatRole(selectedUser.role)}\n\nThis link will expire in 7 days.\n\nWelcome to the team!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const handleSendViaEmail = () => {
    if (!selectedUser) return;
    const subject = `Welcome to COPCCA CRM - Complete Your Registration`;
    const body = `Hi ${formatName(selectedUser.full_name)},\n\nYou've been invited to join COPCCA CRM!\n\nYour Role: ${formatRole(selectedUser.role)}\nDepartment: ${selectedUser.department}\nEmail: ${formatEmail(selectedUser.email)}\n\nClick the link below to complete your registration:\n${invitationLink}\n\nThis link will expire in 7 days.\n\nIf you have any questions, please contact your administrator.\n\nBest regards,\nCOPCCA CRM Team`;
    const mailtoUrl = `mailto:${selectedUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    toast.success('Opening email client...');
  };

  const handleToggleStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target || target.status === 'pending') return; // Don't allow toggling pending users
    const nextStatus: UserType['status'] = target.status === 'active' ? 'inactive' : 'active';

    if (!isSupabaseConfigured || !user) {
      try {
        toast.success('User status updated successfully');
        setUsers(users.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)));
      } catch (error) {
        console.error('Failed to toggle status:', error);
      }
      return;
    }

    try {
      const updatePromise = supabase
        .from('users')
        .update({ status: nextStatus })
        .eq('id', userId);

      const toastId = toast.loading('Updating user status...');
      const { error } = await updatePromise;

      if (error) {
        toast.dismiss(toastId);
        toast.error('Failed to update status');
      } else {
        toast.dismiss(toastId);
        toast.success('User status updated successfully');
        setUsers(users.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)));
      }
    } catch (error) {
      console.error('Failed to toggle status via Supabase:', error);
    }
  };

  const handleUpdatePermissions = async (permission: keyof UserType['permissions']) => {
    if (selectedUser) {
      try {
        const updatedUser = {
          ...selectedUser,
          permissions: { ...selectedUser.permissions, [permission]: !selectedUser.permissions[permission] },
        };
        if (!isSupabaseConfigured || !user) {
          toast.success('Permissions updated successfully');
          setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
          setSelectedUser(updatedUser);
          return;
        }
        const upsertPromise = supabase
          .from('user_permissions')
          .upsert({
            user_id: selectedUser.id,
            module_name: permission,
            can_view: updatedUser.permissions[permission],
            can_edit: false,
            can_delete: false,
          });

        const toastId = toast.loading('Updating permissions...');
        const { error } = await upsertPromise;

        if (error) {
          toast.dismiss(toastId);
          toast.error('Failed to update permissions');
        } else {
          toast.dismiss(toastId);
          toast.success('Permissions updated successfully');
          setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
          setSelectedUser(updatedUser);
        }
      } catch (error) {
        console.error('Failed to update permissions:', error);
      }
    }
  };

  const permissionLabels: Array<{ key: keyof UserType['permissions']; label: string; icon: LucideIcon }> = [
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'sales', label: 'Sales Pipeline', icon: TrendingUp },
    { key: 'marketing', label: 'Marketing', icon: Target },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'competitors', label: 'Competitors', icon: Shield },
    { key: 'debt_collection', label: 'Debt Collection', icon: Banknote },
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
          {invites.length > 0 && (
            <p className="text-xs text-emerald-600">Pending invitations: {invites.length}</p>
          )}
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

      {/* Business Information Section */}
      {companyInfo && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Briefcase className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Business Information</h3>
                <p className="text-sm text-slate-600">Manage your business profile and subscription</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Building className="text-blue-600" size={18} />
                <p className="text-xs font-medium text-slate-500 uppercase">Company Name</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{companyInfo.name}</p>
            </div>

            {companyInfo.industry && (
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="text-blue-600" size={18} />
                  <p className="text-xs font-medium text-slate-500 uppercase">Industry</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{companyInfo.industry}</p>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="text-blue-600" size={18} />
                <p className="text-xs font-medium text-slate-500 uppercase">Users</p>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {companyInfo.user_count}/{companyInfo.max_users || 10}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="text-blue-600" size={18} />
                <p className="text-xs font-medium text-slate-500 uppercase">Subscription Plan</p>
              </div>
              <p className="text-lg font-bold text-slate-900 capitalize">
                {companyInfo.subscription_plan || 'Starter'}
              </p>
            </div>

            {companyInfo.website && (
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="text-blue-600" size={18} />
                  <p className="text-xs font-medium text-slate-500 uppercase">Website</p>
                </div>
                <a 
                  href={companyInfo.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate block"
                >
                  {companyInfo.website}
                </a>
              </div>
            )}

            {companyInfo.phone && (
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="text-blue-600" size={18} />
                  <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                </div>
                <p className="text-sm text-slate-900">{companyInfo.phone}</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-slate-600">
              <strong>Note:</strong> To update business information, go to Settings → Business Information
            </p>
          </div>
        </Card>
      )}

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
              {['all', 'admin', 'manager', 'user'].map((role) => (
                <button key={role} onClick={() => setFilterRole(role as typeof filterRole)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterRole === role ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  {role === 'all' ? 'All Roles' : role === 'admin' ? 'Admins' : role === 'manager' ? 'Managers' : 'Users'}
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
                        <p className="font-semibold text-slate-900">{formatName(user.full_name)}</p>
                        <p className="text-xs text-slate-600">{formatEmail(user.email)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                      {user.role === 'admin' ? <Crown size={12} /> : <User size={12} />}
                      {formatRole(user.role)}
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
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : user.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                      {user.status === 'active' ? <CheckCircle size={12} /> : user.status === 'pending' ? <Clock size={12} /> : <XCircle size={12} />}
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-slate-600">{user.last_login}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setSelectedUser(user); handleSendInvitation(user.email, user.role); }} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors text-green-600" title="Send Invitation Link">
                        <Send size={16} />
                      </button>
                      <button onClick={() => { setSelectedUser(user); setShowPermissionsModal(true); }} className="p-1.5 hover:bg-primary-100 rounded-lg transition-colors text-primary-600" title="Manage Permissions">
                        <Shield size={16} />
                      </button>
                      <button onClick={() => handleToggleStatus(user.id)} disabled={user.status === 'pending'} className={`p-1.5 rounded-lg transition-colors ${user.status === 'pending' ? 'opacity-50 cursor-not-allowed' : user.status === 'active' ? 'hover:bg-orange-100 text-orange-600' : 'hover:bg-green-100 text-green-600'}`} title={user.status === 'pending' ? 'Pending users cannot be toggled' : user.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600" title="Edit User">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => { if (window.confirm(`Delete ${formatName(user.full_name)}?`)) { setUsers(users.filter(u => u.id !== user.id)); toast.success('User deleted'); }}} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600" title="Delete User">
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
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Team Member" size="lg">
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
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'user' })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="user">User - Limited Access</option>
                <option value="manager">Manager - Elevated Access</option>
                <option value="admin">Admin - Full Access</option>
              </select>
            </div>
            <Input label="Department" placeholder="Sales, Marketing, Finance..." value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
            <Input label="Phone Number" placeholder="+234 801 234 5678" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
          </div>
          {formData.role === 'admin' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-semibold text-purple-900 mb-1">Admin Role Selected</p>
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
        <Modal isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)} title={`Manage Permissions - ${selectedUser.full_name}`} size="lg">
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
        title="Invitation Link Generated"
        size="lg"
      >
        <div className="space-y-6">
          {/* Success Message */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-bold text-green-900 mb-1">Invitation Created Successfully!</h3>
                <p className="text-sm text-green-800">
                  {selectedUser?.full_name} has been added to the pending list. Share the invitation link below for them to complete registration, or provide them with login credentials directly.
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
                This link will expire in 7 days
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
              <span className="px-2 bg-white text-slate-500">Or copy invitation link manually</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invitationLink}
                  readOnly
                  className="flex-1 px-3 py-2 border-0 bg-white rounded text-xs font-mono text-slate-700"
                />
                <Button size="sm" icon={Copy} onClick={handleCopyInvitationLink}>
                  Copy Link
                </Button>
              </div>
              <a
                href={invitationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-center rounded text-sm font-medium transition-colors"
              >
                🔗 Open Invitation Link
              </a>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
            <ol className="space-y-1 text-sm text-blue-800 list-decimal list-inside">
              <li>The user appears in the team list with "Pending" status</li>
              <li>Share the invitation link for them to set up their account</li>
              <li>Or provide them with the invitation link directly for registration</li>
              <li>Once they complete registration, their status will change to "Active"</li>
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
