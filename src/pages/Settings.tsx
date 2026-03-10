import React, { useState, useEffect } from 'react';
import { Bell, Save, Lock, Eye, EyeOff, Building, CreditCard, Crown, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { BillingHistory } from '@/components/ui/BillingHistory';
import { SubscriptionManagement } from '@/components/ui/SubscriptionManagement';
import { SMSSettings } from '@/components/settings/SMSSettings';
import { getUserSubscription } from '@/lib/subscription';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'subscription' | 'locations' | 'sms'>('general');
  const [currentSubscriptionPlan, setCurrentSubscriptionPlan] = useState<string>('start');
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    phone: '',
    email: '',
    tin: '',
    address: '',
    city: '',
    country: '',
    subscription_plan: 'start'
  });
  const [paymentInfo, setPaymentInfo] = useState({
    m_pesa: {
      paybill: '',
      account: '',
    },
    bank_transfer: {
      account: '',
      bank: '',
    },
    cash_payment: {
      accepted_at: '',
      hours: '',
    },
  });
  const [showCompanyNameInNavbar, setShowCompanyNameInNavbar] = useState(false);
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

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [locations, setLocations] = useState<Array<{
    id: string;
    name: string;
    type: 'pos' | 'inventory';
    address?: string;
    city?: string;
    status: 'active' | 'inactive';
  }>>([]);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load user's actual subscription plan
  useEffect(() => {
    const loadUserSubscription = async () => {
      const subscription = await getUserSubscription();
      if (subscription) {
        setCurrentSubscriptionPlan(subscription.plan.name);
      }
    };
    
    if (user) {
      loadUserSubscription();
    }
  }, [user]);

  // Load company information
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
                .select('*')
                .eq('id', userData.company_id)
                .single();

              if (companyData) {
                setCompanyInfo({
                  name: companyData.name || '',
                  phone: companyData.phone || '',
                  email: companyData.email || '',
                  tin: companyData.tin || '',
                  address: companyData.address || '',
                  city: companyData.city || '',
                  country: companyData.country || '',
                  subscription_plan: companyData.subscription_plan || 'start'
                });
              setShowCompanyNameInNavbar(companyData.show_company_name_in_navbar ?? true);
                setPaymentInfo(companyData.payment_info || {
                  m_pesa: { paybill: '', account: '' },
                  bank_transfer: { account: '', bank: '' },
                  cash_payment: { accepted_at: '', hours: '' },
                });
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
                phone: newCompany.phone || '',
                email: newCompany.email || '',
                tin: newCompany.tin || '',
                address: newCompany.address || '',
                city: newCompany.city || '',
                country: newCompany.country || '',
                subscription_plan: newCompany.subscription_plan || 'start'
              });

              toast.success('Business profile created! Please update your business information.');
            }
          } else {
            // Load existing company information
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('id', userData.company_id)
              .single();

            if (companyData) {
              setCompanyInfo({
                name: companyData.name || '',
                phone: companyData.phone || '',
                email: companyData.email || '',
                tin: companyData.tin || '',
                address: companyData.address || '',
                city: companyData.city || '',
                country: companyData.country || '',
                subscription_plan: companyData.subscription_plan || 'start'
              });
              setShowCompanyNameInNavbar(companyData.show_company_name_in_navbar ?? true);
              setPaymentInfo(companyData.payment_info || {
                m_pesa: { paybill: '', account: '' },
                bank_transfer: { account: '', bank: '' },
                cash_payment: { accepted_at: '', hours: '' },
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load company data:', error);
      }
    };

    loadCompanyData();
  }, [user]);

  // Load user notification settings
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('notification_settings')
          .eq('id', user.id)
          .single();

        if (userData) {
          // Load notification settings if they exist
          if (userData.notification_settings) {
            setNotifications({
              email: userData.notification_settings.email ?? true,
              push: userData.notification_settings.push ?? true,
              sms: userData.notification_settings.sms ?? false,
              deals: userData.notification_settings.deals ?? true,
              tasks: userData.notification_settings.tasks ?? true,
              reports: userData.notification_settings.reports ?? true
            });
          }
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };

    loadUserSettings();
  }, [user]);

  // Preload locations on mount for instant tab switching
  useEffect(() => {
    loadLocations();
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

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
    }
  };

  const loadLocations = async () => {
    if (!user) return;
    
    try {
      // Get user's company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) return;

      // Load all locations from unified table
      const { data: locationsData, error } = await supabase
        .from('locations')
        .select('id, name, type, address, city, status')
        .eq('company_id', userData.company_id)
        .eq('status', 'active')
        .order('type')
        .order('name');

      if (error) {
        console.error('Error loading locations:', error);
        return;
      }

      const allLocations: Array<{
        id: string;
        name: string;
        type: 'pos' | 'inventory';
        address?: string;
        city?: string;
        status: 'active' | 'inactive';
      }> = locationsData || [];

      setLocations(allLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const saveLocation = async (locationData: {
    name: string;
    type: 'pos' | 'inventory';
    address?: string;
    city?: string;
  }) => {
    if (!user) return;

    try {
      // Get user's company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) {
        toast.error('Company information not found');
        return;
      }

      const { error } = await supabase
        .from('locations')
        .insert({
          name: locationData.name,
          type: locationData.type,
          address: locationData.address,
          city: locationData.city,
          company_id: userData.company_id,
          created_by: user.id,
          status: 'active'
        });

      if (error) throw error;

      toast.success('Location added successfully');
      loadLocations(); // Refresh the list
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    }
  };

  const updateLocation = async (id: string, updates: { name?: string; address?: string; city?: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('locations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Location updated successfully');
      loadLocations(); // Refresh the list
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  const deleteLocation = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('locations')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Location removed successfully');
      loadLocations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to remove location');
    }
  };

  const handleCompanySave = async () => {
    if (!user || !isAdmin || !isCompanyOwner) {
      toast.error('Only business owners can update business information');
      return;
    }

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
          phone: companyInfo.phone,
          email: companyInfo.email,
          tin: companyInfo.tin,
          address: companyInfo.address,
          city: companyInfo.city,
          country: companyInfo.country,
          show_company_name_in_navbar: showCompanyNameInNavbar,
          payment_info: paymentInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.company_id);

      if (error) throw error;

      // Dispatch event to notify navbar to refresh company data
      window.dispatchEvent(new CustomEvent('company-info-updated'));

      toast.success('Business information updated successfully');
    } catch (error) {
      console.error('Failed to update company:', error);
      toast.error('Failed to update business information');
    }
  };

  const toggleNotification = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    
    // Update state immediately for better UX
    setNotifications((prev) => ({ ...prev, [key]: newValue }));

    // Save to database
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          notification_settings: {
            ...notifications,
            [key]: newValue
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast.error('Failed to update notification settings');
      // Revert state on error
      setNotifications((prev) => ({ ...prev, [key]: !newValue }));
    }
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
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => setter(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          required
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage notifications, preferences, appearance, security, billing, and subscriptions.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'subscription', label: 'Subscription', icon: Crown },
            { id: 'sms', label: 'SMS / Automation', icon: MessageSquare },
            { id: 'locations', label: 'Locations', icon: Building }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'general' | 'billing' | 'subscription' | 'locations' | 'sms')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="inline-block mr-2" size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <>
          {/* Business Information - Visible to all users, editable only for company owners */}
          {user && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Building className="text-primary-600 dark:text-primary-400" size={20} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Business Information</h2>
              </div>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                  Business Profile
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-200">
                  {isCompanyOwner || isAdmin
                    ? "Manage your business profile. This information is shared with all users in your organization."
                    : "View your business profile. Only company owners and admins can edit this information."
                  }
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    placeholder="COPCCA Technologies"
                    disabled={!isCompanyOwner && !isAdmin}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    placeholder="+255 XXX XXX XXX"
                    disabled={!isCompanyOwner && !isAdmin}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                    placeholder="admin@company.com"
                    disabled={!isCompanyOwner && !isAdmin}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    TIN <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyInfo.tin}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, tin: e.target.value })}
                    placeholder="Enter your business TIN number"
                    disabled={!isCompanyOwner && !isAdmin}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Tax Identification Number - Only shown on invoices if provided</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Address</label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    placeholder="123 Business Ave, District"
                    disabled={!isCompanyOwner && !isAdmin}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                    placeholder="Dar es Salaam"
                    disabled={!isCompanyOwner && !isAdmin}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={companyInfo.country}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                    placeholder="Tanzania"
                    disabled={!isCompanyOwner && !isAdmin}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        disabled={!isCompanyOwner && !isAdmin}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {(isCompanyOwner || isAdmin) && (
                <div className="mt-4">
                  <Button 
                    icon={Save} 
                    onClick={handleCompanySave}
                    disabled={!companyInfo.name}
                  >
                    {'Save Business Information'}
                  </Button>
                </div>
              )}
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="text-primary-600 dark:text-primary-400" size={20} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security</h2>
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
        </>
      )}

      {activeTab === 'billing' && (
        <BillingHistory />
      )}

      {activeTab === 'subscription' && (
        <SubscriptionManagement />
      )}

      {activeTab === 'sms' && (
        <SMSSettings />
      )}

      {activeTab === 'locations' && (
        <LocationsManagement 
          locations={locations}
          onSave={saveLocation}
          onUpdate={updateLocation}
          onDelete={deleteLocation}
          userSubscriptionPlan={currentSubscriptionPlan}
        />
      )}
    </div>
  );
};

const LocationsManagement: React.FC<{
  locations: Array<{
    id: string;
    name: string;
    type: 'pos' | 'inventory';
    address?: string;
    city?: string;
    status: 'active' | 'inactive';
  }>;
  onSave: (location: { name: string; type: 'pos' | 'inventory'; address?: string; city?: string }) => Promise<void>;
  onUpdate: (id: string, updates: { name?: string; address?: string; city?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userSubscriptionPlan: string;
}> = ({ locations, onSave, onUpdate, onDelete, userSubscriptionPlan }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<{
    id: string;
    name: string;
    address: string;
    city: string;
  } | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'inventory' as 'pos' | 'inventory',
    address: '',
    city: ''
  });

  // Define plan limits based on subscription tier
  const planLimits = {
    start: { pos: 1, inventory: 1 },
    starter: { pos: 1, inventory: 1 }, // Legacy name
    grow: { pos: 2, inventory: 2 },
    pro: { pos: -1, inventory: -1 }, // -1 means unlimited
    professional: { pos: -1, inventory: -1 }, // Legacy name
    enterprise: { pos: -1, inventory: -1 } // Legacy name
  };

  // Normalize plan name and get limits (handle multiple formats)
  const normalizedPlan = userSubscriptionPlan.toLowerCase() as keyof typeof planLimits;
  const limits = planLimits[normalizedPlan] || planLimits.start;
  
  // Debug: Log the plan name to help troubleshoot
  console.log('Location limits - Plan:', userSubscriptionPlan, 'Normalized:', normalizedPlan, 'Limits:', limits);
  
  // Determine display plan name for UI
  const displayPlan = normalizedPlan === 'professional' || normalizedPlan === 'enterprise' 
    ? 'PRO' 
    : normalizedPlan === 'starter' 
    ? 'START' 
    : normalizedPlan.toUpperCase();

  // Count locations by type
  const posCount = locations.filter(l => l.type === 'pos').length;
  const inventoryCount = locations.filter(l => l.type === 'inventory').length;

  // Check if can add more of specific type
  const canAddPOS = limits.pos === -1 || posCount < limits.pos;
  const canAddInventory = limits.inventory === -1 || inventoryCount < limits.inventory;
  const canAddMore = canAddPOS || canAddInventory; // Show button if either type can be added

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      toast.error('Location name is required');
      return;
    }

    // Check limit for the specific type being added
    const currentCount = newLocation.type === 'pos' ? posCount : inventoryCount;
    const maxForType = newLocation.type === 'pos' ? limits.pos : limits.inventory;
    
    if (maxForType !== -1 && currentCount >= maxForType) {
      toast.error(`Your ${displayPlan} plan allows ${maxForType} ${newLocation.type.toUpperCase()} location(s). Upgrade to add more.`);
      return;
    }

    await onSave(newLocation);
    setNewLocation({ name: '', type: 'inventory', address: '', city: '' });
    setShowAddModal(false);
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation || !editingLocation.name.trim()) {
      toast.error('Location name is required');
      return;
    }

    await onUpdate(editingLocation.id, {
      name: editingLocation.name,
      address: editingLocation.address,
      city: editingLocation.city
    });
    setEditingLocation(null);
  };

  // Build plan limits message
  const getLimitsMessage = () => {
    if (limits.pos === -1 && limits.inventory === -1) {
      return `${displayPlan} plan allows unlimited POS and inventory locations.`;
    }
    const posLimit = limits.pos === -1 ? 'unlimited' : limits.pos;
    const invLimit = limits.inventory === -1 ? 'unlimited' : limits.inventory;
    return `${displayPlan} plan allows ${posLimit} POS and ${invLimit} inventory location(s). POS: ${posCount}/${posLimit === 'unlimited' ? '∞' : posLimit}, Inventory: ${inventoryCount}/${invLimit === 'unlimited' ? '∞' : invLimit}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Locations</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your POS and inventory locations. {getLimitsMessage()}
          </p>
        </div>
        {canAddMore && (
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Building size={16} />
            Add Location
          </Button>
        )}
      </div>

      {locations.length === 0 ? (
        <Card className="p-8 text-center">
          <Building className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No locations yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Add your first location to start managing inventory and POS operations.
            {limits.pos === -1 && limits.inventory === -1
              ? ` Your ${displayPlan} plan allows unlimited locations.` 
              : ` Your ${displayPlan} plan allows ${limits.pos} POS and ${limits.inventory} inventory location(s).`
            }
          </p>
          <Button onClick={() => setShowAddModal(true)}>Add Your First Location</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {locations.map((location) => (
              <Card key={location.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-slate-900 dark:text-white">{location.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        location.type === 'pos' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {location.type === 'pos' ? 'POS Location' : 'Inventory Location'}
                      </span>
                    </div>
                    {(location.address || location.city) && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {[location.address, location.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLocation({
                        id: location.id,
                        name: location.name,
                        address: location.address || '',
                        city: location.city || ''
                      })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this location?')) {
                          onDelete(location.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      }

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Add New Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., Main Store, Warehouse A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={newLocation.type}
                  onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as 'pos' | 'inventory' })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="inventory" disabled={!canAddInventory}>
                    Inventory Location {!canAddInventory ? `(Limit reached: ${inventoryCount}/${limits.inventory})` : `(${inventoryCount}/${limits.inventory === -1 ? '∞' : limits.inventory})`}
                  </option>
                  <option value="pos" disabled={!canAddPOS}>
                    POS Location {!canAddPOS ? `(Limit reached: ${posCount}/${limits.pos})` : `(${posCount}/${limits.pos === -1 ? '∞' : limits.pos})`}
                  </option>
                </select>
                {!canAddPOS && !canAddInventory && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    All location limits reached. Please upgrade your plan to add more locations.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="City"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddLocation} className="flex-1">
                Add Location
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Edit Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={editingLocation.name}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editingLocation.address}
                  onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={editingLocation.city}
                  onChange={(e) => setEditingLocation({ ...editingLocation, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingLocation(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateLocation} className="flex-1">
                Update Location
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
