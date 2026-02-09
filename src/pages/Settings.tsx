import React, { useState, useEffect } from 'react';
import { Bell, Globe, Database, Download, Trash2, Save, Lock, Eye, EyeOff, Building, CreditCard, Crown, Settings as SettingsIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { BillingHistory } from '@/components/ui/BillingHistory';
import { SubscriptionManagement } from '@/components/ui/SubscriptionManagement';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'subscription' | 'locations'>('general');
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    size: '',
    website: '',
    phone: '',
    address: '',
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

  const [locations, setLocations] = useState<Array<{
    id: string;
    name: string;
    type: 'pos' | 'inventory';
    address?: string;
    city?: string;
    status: 'active' | 'inactive';
  }>>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

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
                .select('*, show_company_name_in_navbar, payment_info')
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
                industry: newCompany.industry || '',
                size: newCompany.size || '',
                website: newCompany.website || '',
                phone: newCompany.phone || '',
                address: newCompany.address || '',
              });

              toast.success('Business profile created! Please update your business information.');
            }
          } else {
            // Load existing company information
            const { data: companyData } = await supabase
              .from('companies')
              .select('*, show_company_name_in_navbar, payment_info')
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

  // Load locations when locations tab is active
  useEffect(() => {
    if (activeTab === 'locations') {
      loadLocations();
    }
  }, [activeTab, user]);

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
    // Simulate password update (replace with real API call)
    toast.success('Password updated successfully');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const loadLocations = async () => {
    if (!user) return;
    
    setLoadingLocations(true);
    try {
      // Get user's company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) return;

      // Load both POS and inventory locations
      const [posResult, inventoryResult] = await Promise.all([
        supabase
          .from('pos_locations')
          .select('id, name, address, city, status')
          .eq('company_id', userData.company_id)
          .eq('status', 'active'),
        supabase
          .from('inventory_locations')
          .select('id, name, address, city, type, status')
          .eq('company_id', userData.company_id)
          .eq('status', 'active')
      ]);

      const allLocations: Array<{
        id: string;
        name: string;
        type: 'pos' | 'inventory';
        address?: string;
        city?: string;
        status: 'active' | 'inactive';
      }> = [];

      // Add POS locations
      if (posResult.data) {
        posResult.data.forEach(loc => {
          allLocations.push({
            id: loc.id,
            name: loc.name,
            type: 'pos',
            address: loc.address,
            city: loc.city,
            status: loc.status as 'active' | 'inactive'
          });
        });
      }

      // Add inventory locations
      if (inventoryResult.data) {
        inventoryResult.data.forEach(loc => {
          allLocations.push({
            id: loc.id,
            name: loc.name,
            type: 'inventory',
            address: loc.address,
            city: loc.city,
            status: loc.status as 'active' | 'inactive'
          });
        });
      }

      setLocations(allLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoadingLocations(false);
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

      const tableName = locationData.type === 'pos' ? 'pos_locations' : 'inventory_locations';
      
      const { error } = await supabase
        .from(tableName)
        .insert({
          name: locationData.name,
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
      // Find the location to determine which table to update
      const location = locations.find(loc => loc.id === id);
      if (!location) return;

      const tableName = location.type === 'pos' ? 'pos_locations' : 'inventory_locations';

      const { error } = await supabase
        .from(tableName)
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
      // Find the location to determine which table to update
      const location = locations.find(loc => loc.id === id);
      if (!location) return;

      const tableName = location.type === 'pos' ? 'pos_locations' : 'inventory_locations';

      const { error } = await supabase
        .from(tableName)
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
          industry: companyInfo.industry,
          size: companyInfo.size,
          website: companyInfo.website,
          phone: companyInfo.phone,
          address: companyInfo.address,
          show_company_name_in_navbar: showCompanyNameInNavbar,
          payment_info: paymentInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.company_id);

      if (error) throw error;

      toast.success('Business information updated successfully');
    } catch (error) {
      console.error('Failed to update company:', error);
      toast.error('Failed to update business information');
    }
  };

  const handlePreferencesSave = () => {
    toast.success('Preferences saved');
  };

  const handleDownloadData = () => {
    // Simulate export (replace with real logic)
    toast.success('Export ready. Download started.');
  };

  const handleDeleteData = () => {
    const confirmed = confirm('This will delete cached settings data on this device. Continue?');
    if (!confirmed) return;
    // Simulate clear (replace with real logic)
    toast.success('Local settings data removed');
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
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage notifications, preferences, appearance, security, billing, and subscriptions.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'subscription', label: 'Subscription', icon: Crown },
            { id: 'locations', label: 'Locations', icon: Building }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
                  {isCompanyOwner 
                    ? "Manage your business profile. This information is shared with all users in your organization."
                    : "View your business profile. Only company owners can edit this information."
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
                    disabled={!isCompanyOwner}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Industry</label>
                  <input
                    type="text"
                    value={companyInfo.industry}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                    placeholder="Technology, Retail, etc."
                    disabled={!isCompanyOwner}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Size</label>
                  <select
                    value={companyInfo.size}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, size: e.target.value })}
                    disabled={!isCompanyOwner}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={!isCompanyOwner}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    disabled={!isCompanyOwner}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    placeholder="123 Business Ave, Lagos"
                    disabled={!isCompanyOwner}
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
                        disabled={!isCompanyOwner}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {isCompanyOwner && (
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

          {user && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="text-primary-600 dark:text-primary-400" size={20} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment Information</h2>
              </div>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-100 font-medium mb-1">
                  Business Payment Methods
                </p>
                <p className="text-xs text-green-700 dark:text-green-200">
                  {isCompanyOwner 
                    ? "Configure payment methods for your business. This information will be displayed to customers."
                    : "View payment methods for your business."
                  }
                </p>
              </div>

              {/* M-Pesa Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">M-Pesa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paybill Number</label>
                    <input
                      type="text"
                      value={paymentInfo.m_pesa.paybill}
                      onChange={(e) => setPaymentInfo({
                        ...paymentInfo,
                        m_pesa: { ...paymentInfo.m_pesa, paybill: e.target.value }
                      })}
                      placeholder="123456"
                      disabled={!isCompanyOwner}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={paymentInfo.m_pesa.account}
                      onChange={(e) => setPaymentInfo({
                        ...paymentInfo,
                        m_pesa: { ...paymentInfo.m_pesa, account: e.target.value }
                      })}
                      placeholder="INV-708497"
                      disabled={!isCompanyOwner}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Transfer Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Bank Transfer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={paymentInfo.bank_transfer.account}
                      onChange={(e) => setPaymentInfo({
                        ...paymentInfo,
                        bank_transfer: { ...paymentInfo.bank_transfer, account: e.target.value }
                      })}
                      placeholder="1234567890"
                      disabled={!isCompanyOwner}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={paymentInfo.bank_transfer.bank}
                      onChange={(e) => setPaymentInfo({
                        ...paymentInfo,
                        bank_transfer: { ...paymentInfo.bank_transfer, bank: e.target.value }
                      })}
                      placeholder="CRDB Bank"
                      disabled={!isCompanyOwner}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Cash Payment Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Cash Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Accepted At</label>
                    <input
                      type="text"
                      value={paymentInfo.cash_payment.accepted_at}
                      onChange={(e) => setPaymentInfo({
                        ...paymentInfo,
                        cash_payment: { ...paymentInfo.cash_payment, accepted_at: e.target.value }
                      })}
                      placeholder="Accepted at office"
                      disabled={!isCompanyOwner}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Hours</label>
                    <input
                      type="text"
                      value={paymentInfo.cash_payment.hours}
                      onChange={(e) => setPaymentInfo({
                        ...paymentInfo,
                        cash_payment: { ...paymentInfo.cash_payment, hours: e.target.value }
                      })}
                      placeholder="Mon-Fri, 8AM-5PM"
                      disabled={!isCompanyOwner}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {isCompanyOwner && (
                <div className="mt-4">
                  <Button 
                    icon={Save} 
                    onClick={handleCompanySave}
                  >
                    Save Payment Information
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
        </>
      )}

      {activeTab === 'billing' && (
        <BillingHistory />
      )}

      {activeTab === 'subscription' && (
        <SubscriptionManagement />
      )}

      {activeTab === 'locations' && (
        <LocationsManagement 
          locations={locations}
          loading={loadingLocations}
          onSave={saveLocation}
          onUpdate={updateLocation}
          onDelete={deleteLocation}
          userSubscriptionPlan={companyInfo.subscription_plan || 'starter'}
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
  loading: boolean;
  onSave: (location: { name: string; type: 'pos' | 'inventory'; address?: string; city?: string }) => Promise<void>;
  onUpdate: (id: string, updates: { name?: string; address?: string; city?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userSubscriptionPlan: string;
}> = ({ locations, loading, onSave, onUpdate, onDelete, userSubscriptionPlan }) => {
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

  const maxLocations = userSubscriptionPlan === 'starter' ? 1 : userSubscriptionPlan === 'professional' ? 2 : 10;
  const canAddMore = locations.length < maxLocations;

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      toast.error('Location name is required');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Locations</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your POS and inventory locations. {userSubscriptionPlan === 'starter' && 'Starter plan allows 1 location.'}
            {userSubscriptionPlan === 'professional' && 'Professional plan allows up to 2 locations.'}
            {userSubscriptionPlan === 'enterprise' && 'Enterprise plan allows unlimited locations.'}
          </p>
        </div>
        {canAddMore && (
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Building size={16} />
            Add Location
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {locations.length === 0 ? (
            <Card className="p-8 text-center">
              <Building className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No locations yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Add your first location to start managing inventory and POS operations.</p>
              {canAddMore && (
                <Button onClick={() => setShowAddModal(true)}>Add Your First Location</Button>
              )}
            </Card>
          ) : (
            locations.map((location) => (
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
            ))
          )}
        </div>
      )}

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
                  <option value="inventory">Inventory Location</option>
                  <option value="pos">POS Location</option>
                </select>
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
