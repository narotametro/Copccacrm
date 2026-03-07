import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Users, Trash2, Shield, Mail, Calendar, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  confirmation_sent_at: string | null;
  invited_at: string | null;
  full_name?: string;
  role?: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get all users from authenticated users table with all details
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at, updated_at, last_sign_in_at, email_confirmed_at, confirmation_sent_at, invited_at')
        .order('created_at', { ascending: false });

      if (authError) {
        console.error('Error loading auth users:', authError);
        // Fallback: Get from public.users
        const { data: publicUsers, error: publicError } = await supabase
          .from('users')
          .select('id, email, full_name, role, created_at')
          .order('created_at', { ascending: false });

        if (publicError) throw publicError;
        setUsers(publicUsers as User[]);
      } else {
        // Enrich with profile data
        const enrichedUsers = await Promise.all(
          (authUsers || []).map(async (authUser) => {
            const { data: profile } = await supabase
              .from('users')
              .select('full_name, role')
              .eq('id', authUser.id)
              .single();

            return {
              ...authUser,
              full_name: profile?.full_name,
              role: profile?.role,
            };
          })
        );

        setUsers(enrichedUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    // Prevent deleting teddy@gmail.com
    if (user.email === 'teddy@gmail.com') {
      toast.error('Cannot delete teddy@gmail.com (test account)');
      return;
    }

    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUserId(userToDelete.id);

      // Delete user data from public tables
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);

      if (profileError) console.warn('Profile delete warning:', profileError);

      // Delete auth user (requires service role - show instructions)
      toast.success(
        `User data deleted. To fully remove ${userToDelete.email}, go to Supabase Dashboard → Authentication → Users → Delete`,
        { duration: 8000 }
      );

      // Refresh list
      await loadUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="text-primary-600" />
            User Management
          </h1>
          <p className="text-slate-600 mt-2">
            Manage all registered users • Total: {users.length}
          </p>
        </div>
      </div>

      {/* Users List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Signed Up
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => {
                const isExpanded = expandedUserId === user.id;
                return (
                  <React.Fragment key={user.id}>
                    <tr 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
                          )}
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-slate-500 font-mono">{user.id.slice(0, 13)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          <span className="text-slate-900">{user.email}</span>
                          {user.email === 'teddy@gmail.com' && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              TEST
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'manager'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.role === 'admin' && <Shield size={12} />}
                          {user.role?.toUpperCase() || 'USER'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar size={14} className="text-slate-400" />
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.email_confirmed_at
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {user.email_confirmed_at ? '✓ Confirmed' : '⚠ Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(user);
                          }}
                          variant="outline"
                          size="sm"
                          disabled={deletingUserId === user.id || user.email === 'teddy@gmail.com'}
                          className={
                            user.email === 'teddy@gmail.com'
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                          }
                        >
                          <Trash2 size={16} />
                          {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </td>
                    </tr>
                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-slate-700">User UID:</span>
                              <p className="text-slate-600 font-mono text-xs mt-1">{user.id}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Created at:</span>
                              <p className="text-slate-600 mt-1">{formatDate(user.created_at)}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Updated at:</span>
                              <p className="text-slate-600 mt-1">{user.updated_at ? formatDate(user.updated_at) : '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Invited at:</span>
                              <p className="text-slate-600 mt-1">{user.invited_at ? formatDate(user.invited_at) : '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Confirmation sent at:</span>
                              <p className="text-slate-600 mt-1">{user.confirmation_sent_at ? formatDate(user.confirmation_sent_at) : '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Confirmed at:</span>
                              <p className="text-slate-600 mt-1">{user.email_confirmed_at ? formatDate(user.email_confirmed_at) : '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Last signed in:</span>
                              <p className="text-slate-600 mt-1">{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-bold">Confirm Delete</h2>
            </div>
            <p className="text-slate-700 mb-4">
              Are you sure you want to delete user:
              <br />
              <strong>{userToDelete.email}</strong>?
            </p>
            <p className="text-sm text-slate-600 mb-6 bg-yellow-50 border border-yellow-200 rounded p-3">
              ⚠️ This will delete their profile data. To fully remove the authentication account, you must
              also delete them from Supabase Dashboard → Authentication → Users.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={deletingUserId !== null}
              >
                {deletingUserId ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
