import React, { useState } from 'react';
import { Mail, Phone, Building, Shield, Camera, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { formatName, formatRole, formatEmail } from '@/lib/textFormat';

export const Profile: React.FC = () => {
  // const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  // Use demo profile if no real profile
  const demoProfile = {
    id: 'demo',
    email: 'demo@copcca.com',
    full_name: 'Demo User',
    role: 'admin' as const,
    avatar_url: null,
    phone: '+234 801 234 5678',
    department: 'Sales',
    status: 'active' as const,
  };
  const displayProfile = profile || demoProfile;

  const [formData, setFormData] = useState({
    full_name: displayProfile.full_name,
    email: displayProfile.email,
    phone: displayProfile.phone || '',
    department: displayProfile.department || '',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = () => {
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">👤 My Profile</h1>
        <p className="text-slate-600 mt-1">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center font-bold text-white text-5xl mx-auto mb-4">
                {displayProfile.full_name.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg border-2 border-slate-200 hover:bg-slate-50 transition-colors">
                <Camera size={16} className="text-slate-600" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{formatName(displayProfile.full_name)}</h2>
            <p className="text-slate-600 text-sm mb-2">{formatEmail(displayProfile.email)}</p>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-300 rounded-full">
              <Shield size={14} className="text-primary-600" />
              <span className="text-sm font-bold text-primary-700">{formatRole(displayProfile.role)}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Building size={16} className="text-slate-500" />
              <span className="text-slate-700">{displayProfile.department || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-slate-500" />
              <span className="text-slate-700">{displayProfile.phone || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-slate-500" />
              <span className="text-slate-700 truncate">{formatEmail(displayProfile.email)}</span>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Personal Information</h3>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@copcca.com"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+234 801 234 5678"
            />
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Sales, Marketing, Finance..."
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600">
                {displayProfile.role.toUpperCase()} (Contact admin to change)
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button icon={Save} onClick={handleSave}>
              Save Changes
            </Button>
            <Button variant="secondary">
              Cancel
            </Button>
          </div>
        </Card>
      </div>

      {/* Security Section */}
      <Card>
        <h3 className="text-xl font-bold text-slate-900 mb-4">🔒 Security</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Change Password</label>
            <Button onClick={() => setShowPasswordModal(true)}>Change Password</Button>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Two-Factor Authentication</p>
            <Button variant="secondary" size="sm" onClick={() => setShow2FAModal(true)}>
              Enable 2FA
            </Button>
          </div>
        </div>
      </Card>

      {/* Activity Log */}
      <Card>
        <h3 className="text-xl font-bold text-slate-900 mb-4">📊 Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Logged in from Windows PC</p>
              <p className="text-xs text-slate-600">Today at 9:30 AM • IP: 192.168.1.100</p>
            </div>
            <span className="text-xs text-green-600 font-bold">Current</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Updated customer record</p>
              <p className="text-xs text-slate-600">Yesterday at 4:15 PM</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Created new deal</p>
              <p className="text-xs text-slate-600">Jan 6 at 2:30 PM</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
          }
          if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
          }
          toast.success('Password updated successfully!');
          setShowPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}>
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Password</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} title="Enable Two-Factor Authentication">
        <div className="space-y-4">
          <p className="text-slate-600">
            Enhance your account security by enabling two-factor authentication. You'll need to enter a code from your authenticator app each time you sign in.
          </p>
          <div className="bg-slate-100 p-4 rounded-lg">
            <h4 className="font-bold text-slate-900 mb-2">Setup Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
              <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Scan the QR code below with your app</li>
              <li>Enter the 6-digit code to verify</li>
            </ol>
          </div>
          <div className="flex justify-center bg-white p-8 rounded-lg border-2 border-dashed border-slate-300">
            <div className="w-48 h-48 bg-slate-200 rounded flex items-center justify-center text-slate-500">
              QR Code Placeholder
            </div>
          </div>
          <Input
            label="Verification Code"
            placeholder="000000"
            maxLength={6}
            pattern="[0-9]{6}"
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShow2FAModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('2FA enabled successfully!');
              setShow2FAModal(false);
            }}>
              Enable 2FA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
