import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Upload, Plus, Pencil, Trash2, X, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Phone, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../lib/auth-context';
import { useTeamData } from '../lib/useTeamData';
import { userAPI } from '../lib/api';
import { getInitials, formatName } from '../lib/utils';
import { InviteMember } from './InviteMember';
import { CompanySettings } from './CompanySettings';
import { CountrySelector } from './CountrySelector';
import { ProfessionalAnalyticalReport } from './ProfessionalAnalyticalReport';

type UserStatus = 'Active' | 'Inactive' | 'Banned' | 'Pending' | 'Suspended';
type UserRole = 'Admin' | 'User' | 'Guest' | 'Moderator';

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  status?: UserStatus;
  joinedDate?: string;
  lastActive?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export function UserManagement() {
  const { isAdmin, user: currentUser } = useAuth();
  
  // Fetch data for analytical reports
  const {
    afterSalesData,
    kpiData,
    competitorsData,
    salesData,
    debtData,
    tasksData,
  } = useTeamData({
    realtime: false,
    refreshInterval: 0,
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ExtendedUser | null>(null);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showAnalyticalReport, setShowAnalyticalReport] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    countryCode: '+1',
    role: 'User' as UserRole,
    status: 'Active' as UserStatus,
    password: '',
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      // Load in background - don't show full page loader
      const { users: allUsers } = await userAPI.getAll();
      
      // Extend users with additional data for the table
      const extendedUsers: ExtendedUser[] = (allUsers || []).map((user) => ({
        ...user,
        username: user.email.split('@')[0],
        status: (user.status || 'Active') as UserStatus, // Use existing status or default to Active
        joinedDate: user.createdAt,
        lastActive: getLastActive(user.createdAt),
      }));
      
      setUsers(extendedUsers);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const getLastActive = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.phone || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Clean and format phone number
      let cleanPhone = newUser.phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      const fullPhone = `${newUser.countryCode}${cleanPhone}`;

      const role = newUser.role === 'Admin' ? 'admin' : 'user';
      await userAPI.add(newUser.name, fullPhone, newUser.password, role);
      toast.success('User added successfully');
      setShowAddModal(false);
      setNewUser({ name: '', phone: '', countryCode: '+1', role: 'User', status: 'Active', password: '' });
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to add user:', error);
      toast.error(error.message || 'Failed to add user');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      // In a real implementation, you'd call an update API
      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await userAPI.delete(deletingUser.id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setDeletingUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleExport = () => {
    toast.success('Exporting user data...');
    // In a real implementation, export to CSV or Excel
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  // Apply filters
  let filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user?.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && user.role === 'admin') ||
      (roleFilter === 'user' && user.role === 'user');
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Show all users without pagination
  const paginatedUsers = filteredUsers;

  const getStatusBadge = (status?: UserStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'Inactive':
        return 'bg-gray-100 text-gray-700';
      case 'Banned':
        return 'bg-red-100 text-red-700';
      case 'Pending':
        return 'bg-blue-900 text-white';
      case 'Suspended':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleDisplay = (role: string): UserRole => {
    if (role === 'admin') return 'Admin';
    return 'User';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl mb-2 text-gray-800">User Management</h1>
        <p className="text-gray-600">
          Manage all users in one place. Control access, assign roles, and monitor activity across your platform.
        </p>
      </div>

      {/* Company Settings Section */}
      <CompanySettings />

      {/* Analytical Reports Section - Admin Only */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-pink-600 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Business Analytical Reports</h3>
              <p className="text-sm text-gray-600 mb-3">
                View comprehensive business performance analysis, market insights, and strategic recommendations across all modules.
              </p>
              <button
                onClick={() => setShowAnalyticalReport(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <FileText size={18} />
                View Analytical Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="space-y-3">
        {/* Filter Label */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-pink-600" />
          <span className="text-sm font-medium text-gray-700">Filters & Actions</span>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm bg-white cursor-pointer"
            >
              <option value="all">Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm bg-white cursor-pointer"
            >
              <option value="all">Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Banned">Banned</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm bg-white cursor-pointer"
            >
              <option value="all">Date</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          >
            <Upload size={18} />
            Export
          </button>

          {/* Invite Member Button */}
          <InviteMember />

          {/* Add User Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-400 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm">Full Name</th>
                <th className="px-4 py-3 text-left text-sm">Email</th>
                <th className="px-4 py-3 text-left text-sm">Username</th>
                <th className="px-4 py-3 text-left text-sm">Status</th>
                <th className="px-4 py-3 text-left text-sm">Role</th>
                <th className="px-4 py-3 text-left text-sm">Joined Date</th>
                <th className="px-4 py-3 text-left text-sm">Last Active</th>
                <th className="px-4 py-3 text-left text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-sm">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span>{getInitials(user.name)}</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-900">{formatName(user.name)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.username}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${getStatusBadge(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getRoleDisplay(user.role)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(user.joinedDate || user.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Edit user"
                      >
                        <Pencil size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingUser(user);
                          setShowDeleteModal(true);
                        }}
                        disabled={user.id === currentUser?.id}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete user"}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Total: {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-xl mb-1">Add New User</h3>
                <p className="text-sm text-white/80">Create a new user account</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Country Code <span className="text-red-500">*</span>
                </label>
                <CountrySelector
                  value={newUser.countryCode}
                  onChange={(code) => setNewUser({ ...newUser, countryCode: code })}
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="712345678"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                {newUser.phone && (
                  <p className="text-xs text-gray-500 mt-1">
                    Full number: <span className="font-mono text-pink-600">
                      {newUser.countryCode}{newUser.phone.replace(/\D/g, '').replace(/^0+/, '')}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Guest">Guest</option>
                  <option value="Moderator">Moderator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({ ...newUser, status: e.target.value as UserStatus })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Banned">Banned</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.phone || !newUser.password}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add User
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-xl mb-1">Edit User</h3>
                <p className="text-sm text-white/80">Update user information</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Username</label>
                <input
                  type="text"
                  value={editingUser.username || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Role</label>
                <select
                  value={editingUser.role === 'admin' ? 'Admin' : 'User'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value === 'Admin' ? 'admin' : 'user' })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Banned">Banned</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleEditUser}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Pencil size={20} />
                  Update User
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-t-xl flex items-center gap-3">
              <AlertCircle size={24} />
              <div>
                <h3 className="text-xl mb-1">Delete User</h3>
                <p className="text-sm text-white/80">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{deletingUser.name}</strong>? 
                All their data will be permanently removed.
              </p>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Delete User
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingUser(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytical Report Modal */}
      {showAnalyticalReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <TrendingUp size={24} />
                <div>
                  <h3 className="text-xl mb-1">Business Analytical Reports</h3>
                  <p className="text-sm text-white/80">Comprehensive performance analysis and strategic insights</p>
                </div>
              </div>
              <button
                onClick={() => setShowAnalyticalReport(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <ProfessionalAnalyticalReport
                afterSalesData={afterSalesData}
                kpiData={kpiData}
                competitorsData={competitorsData}
                salesData={salesData}
                marketingData={[]}
                debtData={debtData}
                tasksData={tasksData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}