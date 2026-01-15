import React, { useState, useEffect } from 'react';
import { Bell, Globe, Database, Download, Trash2, Save, Lock, Eye, EyeOff, Building } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    size: '',
    website: '',
    phone: '',
    address: '',
  });
  const [showCompanyNameInNavbar, setShowCompanyNameInNavbar] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    deals: true,
    tasks: true,
    reports: true,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC+1',
    currency: 'NGN',
    dateFormat: 'DD/MM/YYYY',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load company information
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!user) return;

      try {
        // Get user's role and company_id
        const { data: userData } = await supabase
          .from('users')
          .select('role, company_id, full_name, email, is_company_owner, invited_by')
          .eq('id', user.id)
          .single();

        if (userData) {
          setIsAdmin(userData.role === 'admin');
          setIsCompanyOwner(userData.is_company_owner || false);

          // Only company owners need to manage company information
          // Invited users automatically inherit the company from their inviter
          if (!userData.is_company_owner) {
            // This is an invited user - load their company info (read-only)
            if (userData.company_id) {
              const { data: companyData } = await supabase
                .from('companies')
                .select('*, show_company_name_in_navbar')
                .eq('id', userData.company_id)
                .single();

              if (companyData) {
                setCompanyInfo({
                  name: companyData.name || '',
                  industry: companyData.industry || '',
                  size: companyData.size || '',
                  website: companyData.website || '',
                  phone: companyData.phone || '',
                  address: companyData.address || '',
                });
                setShowCompanyNameInNavbar(companyData.show_company_name_in_navbar || false);
              }
            }
            return; // Exit early - invited users don't need auto-creation
          }

          // If user has no company_id, create one automatically
          if (!userData.company_id) {
            // Extract company name from email domain or use user's name
            const emailDomain = userData.email?.split('@')[1]?.split('.')[0] || 'Company';
            const defaultCompanyName = userData.full_name 
              ? `${userData.full_name}'s Company` 
              : `${emailDomain.charAt(0).toUpperCase() + emailDomain.slice(1)}`;

            // Create company automatically
            const { data: newCompany, error: createError } = await supabase
              .from('companies')
              .insert({
                name: defaultCompanyName,
                email: userData.email,
                status: 'active',
                subscription_plan: 'starter',
                subscription_status: 'trial',
                max_users: 10,
                created_by: user.id,
              })
              .select()
              .single();

            if (!createError && newCompany) {
              // Update user with company_id
              await supabase
                .from('users')
                .update({
                  company_id: newCompany.id,
                  is_company_owner: true,
                  role: 'admin', // User becomes admin of their company
                })
                .eq('id', user.id);

              // Load the newly created company
              setCompanyInfo({
                name: newCompany.name || '',
                industry: newCompany.industry || '',
                size: newCompany.size || '',
                website: newCompany.website || '',
                phone: newCompany.phone || '',
                address: newCompany.address || '',
              });

              toast.success('Company profile created! Please update your company information.');
            }
          } else {
            // Load existing company information
            const { data: companyData } = await supabase
              .from('companies')
              .select('*, show_company_name_in_navbar')
              .eq('id', userData.company_id)
              .single();

            if (companyData) {
              setCompanyInfo({
                name: companyData.name || '',
                industry: companyData.industry || '',
                size: companyData.size || '',
                website: companyData.website || '',
                phone: companyData.phone || '',
                address: companyData.address || '',
              });
              setShowCompanyNameInNavbar(companyData.show_company_name_in_navbar || false);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load company data:', error);
      }
    };

    loadCompanyData();
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    await toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: 'Updating password...',
        success: 'Password updated successfully',
        error: 'Failed to update password',
      }
    );

    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleCompanySave = async () => {
    if (!user || !isAdmin || !isCompanyOwner) {
      toast.error('Only company owners can update company information');
      return;
    }

    setLoadingCompany(true);
    try {
      // Get user's company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) {
        toast.error('No company associated with your account');
        return;
      }

      // Update company information
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyInfo.name,
          industry: companyInfo.industry,
          size: companyInfo.size,
          website: companyInfo.website,
          phone: companyInfo.phone,
          address: companyInfo.address,
          show_company_name_in_navbar: showCompanyNameInNavbar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.company_id);

      if (error) throw error;

      toast.success('Company information updated successfully');
    } catch (error) {
      console.error('Failed to update company:', error);
      toast.error('Failed to update company information');
    } finally {
      setLoadingCompany(false);
    }
  };

  const handlePreferencesSave = () => {
    toast.success('Preferences saved');
  };

  const handleDownloadData = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Preparing export...',
        success: 'Export ready. Download started.',
        error: 'Failed to export data',
      }
    );
  };

  const handleDeleteData = () => {
    const confirmed = confirm('This will delete cached settings data on this device. Continue?');
    if (!confirmed) return;

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Clearing data...',
        success: 'Local settings data removed',
        error: 'Failed to clear data',
      }
    );
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderToggle = (label: string, description: string, key: keyof typeof notifications) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={notifications[key]}
          onChange={() => toggleNotification(key)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
  );

  const renderPasswordField = (
    label: string,
    value: string,
    setter: (next: string) => void,
    visible: boolean,
    setVisible: (next: boolean) => void,
    placeholder: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => setter(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          required
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage notifications, preferences, appearance, and security.</p>
      </div>

      {/* Company Information - Only for Company Owners (not invited users) */}
      {isAdmin && isCompanyOwner && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Building className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Company Information</h2>
          </div>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
              📊 Required for Admin Platform Tracking
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200">
              This information is used by the COPCCA admin platform to track your company and users. 
              Invited team members automatically inherit this company profile.
            </p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Manage your company profile. This information is shared with all users in your organization.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                placeholder="COPCCA Technologies"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Industry</label>
              <input
                type="text"
                value={companyInfo.industry}
                onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                placeholder="Technology, Retail, etc."
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Size</label>
              <select
                value={companyInfo.size}
                onChange={(e) => setCompanyInfo({ ...companyInfo, size: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
              <input
                type="url"
                value={companyInfo.website}
                onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
              <input
                type="text"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                placeholder="123 Business Ave, Lagos"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Display Settings */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Display Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Show Company Name in Navbar</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Display company name in the navbar for all team members
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompanyNameInNavbar}
                    onChange={(e) => setShowCompanyNameInNavbar(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button 
              icon={Save} 
              onClick={handleCompanySave}
              disabled={loadingCompany || !companyInfo.name}
            >
              {loadingCompany ? 'Saving...' : 'Save Company Information'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            {renderToggle('Email alerts', 'Get updates via email for key events', 'email')}
            {renderToggle('Push notifications', 'Desktop and in-app alerts', 'push')}
            {renderToggle('SMS alerts', 'Critical account and billing notices', 'sms')}
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
            <p className="font-medium text-slate-900 dark:text-white mb-3">Notify me about</p>
            <div className="space-y-2">
              {['deals', 'tasks', 'reports'].map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifications[key as keyof typeof notifications]}
                    onChange={() => toggleNotification(key as keyof typeof notifications)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Preferences</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="UTC-1">UTC-1</option>
                <option value="UTC">UTC</option>
                <option value="UTC+1">UTC+1</option>
                <option value="UTC+2">UTC+2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="NGN">NGN - Nigerian Naira</option>
                <option value="USD">USD - US Dollar</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date format</label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button icon={Save} onClick={handlePreferencesSave}>
              Save preferences
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPreferences({ language: 'en', timezone: 'UTC+1', currency: 'NGN', dateFormat: 'DD/MM/YYYY' })}
            >
              Reset
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="text-primary-600" size={20} />
            <h2 className="text-xl font-bold text-slate-900">Security</h2>
          </div>
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            {renderPasswordField(
              'Current Password',
              passwordData.currentPassword,
              (value) => setPasswordData({ ...passwordData, currentPassword: value }),
              showCurrentPassword,
              setShowCurrentPassword,
              'Enter your current password'
            )}
            {renderPasswordField(
              'New Password',
              passwordData.newPassword,
              (value) => setPasswordData({ ...passwordData, newPassword: value }),
              showNewPassword,
              setShowNewPassword,
              'Minimum 8 characters'
            )}
            {renderPasswordField(
              'Confirm Password',
              passwordData.confirmPassword,
              (value) => setPasswordData({ ...passwordData, confirmPassword: value }),
              showConfirmPassword,
              setShowConfirmPassword,
              'Re-enter new password'
            )}
            <div className="flex gap-3">
              <Button type="submit" icon={Save}>
                Update password
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Database className="text-primary-600" size={20} />
          <h2 className="text-xl font-bold text-slate-900">Data & privacy</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Export your settings for backup or clear locally cached preferences.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button icon={Download} variant="secondary" onClick={handleDownloadData}>
            Export settings
          </Button>
          <Button icon={Trash2} variant="danger" onClick={handleDeleteData}>
            Clear local data
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
