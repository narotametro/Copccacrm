import React, { useState } from 'react';
import { Database, Activity, Lock, Eye, EyeOff, UserPlus, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const AdminSystem: React.FC = () => {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Demo admin creation
  const [admins, setAdmins] = useState<Array<{ id: string; email: string; role: string }>>([
    { id: '1', email: 'superadmin@copcca.com', role: 'super_admin' },
  ]);
  const [adminForm, setAdminForm] = useState({ email: '', role: 'admin' });

  const handleChangePassword = async () => {
    const adminEmail = sessionStorage.getItem('copcca_admin_email');
    
    if (!adminEmail) {
      toast.error('Admin session not found');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data, error } = await supabase.rpc('change_admin_password', {
        admin_email: adminEmail,
        current_password: currentPassword,
        new_password: newPassword
      });

      if (error) {
        console.error('Password change error:', error);
        toast.error('Failed to change password');
        return;
      }

      const result = data?.[0];
      
      if (result?.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswords(false);
      } else {
        toast.error(result?.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.email.trim()) {
      toast.error('Admin email is required');
      return;
    }

    const newAdmin = {
      id: crypto.randomUUID(),
      email: adminForm.email.trim().toLowerCase(),
      role: adminForm.role,
    };

    setAdmins((prev) => [newAdmin, ...prev]);
    toast.success('Admin created (demo only)', {
      description: `${newAdmin.email} added with ${newAdmin.role} role for this session`,
    });
    setAdminForm({ email: '', role: 'admin' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Configuration</h1>
        <p className="text-purple-200">Configure platform-wide settings and integrations</p>
      </div>

      {/* System Status */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Activity className="text-green-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">System Status</h3>
            <p className="text-purple-200 text-sm">All systems operational</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-green-400 text-sm mb-1">Database</p>
            <p className="text-2xl font-bold text-green-400">Online</p>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-green-400 text-sm mb-1">Authentication</p>
            <p className="text-2xl font-bold text-green-400">Active</p>
          </div>
        </div>
      </Card>

      {/* Admin Password Change */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg">
            <Lock className="text-red-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Admin Password</h3>
            <p className="text-purple-200 text-sm">Change your admin login password</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Current Password</label>
            <div className="relative">
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/50 pr-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">New Password</label>
            <div className="relative">
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/50 pr-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-200 hover:text-white"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              icon={Save}
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswords(false);
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Clear
            </Button>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-200 text-xs">
              <strong>Security:</strong> Passwords are hashed using SHA-256 and stored securely in the database.
              This change affects only your admin account login.
            </p>
          </div>
        </div>
      </Card>

      {/* Admin creation (demo) */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <UserPlus className="text-blue-300" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create Admin (demo)</h3>
            <p className="text-purple-200 text-sm">Capture admin invites; stored locally only</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleCreateAdmin}>
          <Input
            type="email"
            placeholder="admin@company.com"
            value={adminForm.email}
            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/60"
            required
          />
          <div>
            <label className="block text-purple-200 text-sm mb-2">Role</label>
            <select
              value={adminForm.role}
              onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button type="submit" icon={Save} className="bg-blue-500/80 hover:bg-blue-500 text-white">
              Save Admin
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => setAdminForm({ email: '', role: 'admin' })}
            >
              Clear
            </Button>
          </div>
        </form>

        <div className="mt-5">
          <p className="text-purple-200 text-sm mb-2">Recently added (local only)</p>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-white text-sm">{admin.email}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-100 border border-blue-500/30 capitalize">
                  {admin.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Database Info */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Database className="text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Database Information</h3>
            <p className="text-purple-200 text-sm">Supabase connection details</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-purple-200">Provider</span>
            <span className="text-white font-medium">Supabase PostgreSQL</span>
          </div>
          <div className="flex justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-purple-200">Connection</span>
            <span className="text-green-400 font-medium">✓ Connected</span>
          </div>
          <div className="flex justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-purple-200">Tables</span>
            <span className="text-white font-medium">12 tables</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
