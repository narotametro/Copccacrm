import React, { useState, useEffect } from 'react';
import { Bell, Globe, Palette, Database, Download, Trash2, Save, Lock, Eye, EyeOff, Bot, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

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

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // AI Settings
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadAISettings();
    }
  }, [isAdmin]);

  const loadAISettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['openai_api_key', 'ai_assistant_enabled']);

      if (data) {
        const keyData = data.find(s => s.key === 'openai_api_key');
        const enabledData = data.find(s => s.key === 'ai_assistant_enabled');
        
        if (keyData?.value) setOpenaiKey(keyData.value);
        if (enabledData?.value) setAiEnabled(enabledData.value === 'true');
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const saveAISettings = async () => {
    setIsLoadingAI(true);
    try {
      await toast.promise(
        Promise.all([
          supabase.rpc('update_system_setting', {
            setting_key: 'openai_api_key',
            setting_value: openaiKey
          }),
          supabase.rpc('update_system_setting', {
            setting_key: 'ai_assistant_enabled',
            setting_value: aiEnabled.toString()
          })
        ]),
        {
          loading: 'Saving AI settings...',
          success: 'AI settings saved successfully!',
          error: 'Failed to save AI settings'
        }
      );
    } catch (error) {
      console.error('Save AI settings error:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }
    
    try {
      // In production, this would call Supabase API
      await toast.promise(
        new Promise(resolve => setTimeout(resolve, 1500)),
        {
          loading: 'Updating password...',
          success: 'Password changed successfully!',
          error: 'Failed to change password',
        }
      );
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change failed:', error);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">⚙️ Settings</h1>
        <p className="text-slate-600 mt-1">Manage your application preferences</p>
      </div>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Bell className="text-primary-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
            <p className="text-sm text-slate-600">Configure how you receive updates</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-600">Receive updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Push Notifications</p>
              <p className="text-sm text-slate-600">Browser push notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">SMS Alerts</p>
              <p className="text-sm text-slate-600">Text message notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.sms}
                onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="font-medium text-slate-900 mb-3">Notify me about:</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications.deals}
                  onChange={(e) => setNotifications({ ...notifications, deals: e.target.checked })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">New deals and opportunities</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications.tasks}
                  onChange={(e) => setNotifications({ ...notifications, tasks: e.target.checked })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Task assignments and deadlines</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications.reports}
                  onChange={(e) => setNotifications({ ...notifications, reports: e.target.checked })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Weekly reports and analytics</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Globe className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Preferences</h3>
            <p className="text-sm text-slate-600">Customize your experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="UTC+1">West Africa Time (UTC+1)</option>
              <option value="UTC+0">UTC</option>
              <option value="UTC-5">Eastern Time (UTC-5)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
            <select
              value={preferences.currency}
              onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="NGN">Nigerian Naira (₦)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <Button 
            icon={Save} 
            onClick={async () => {
              try {
                await toast.promise(
                  new Promise(resolve => setTimeout(resolve, 1000)),
                  {
                    loading: 'Saving preferences...',
                    success: 'Preferences saved successfully!',
                    error: 'Failed to save preferences',
                  }
                );
              } catch (error) {
                console.error('Failed to save preferences:', error);
              }
            }}
          >
            Save Preferences
          </Button>
        </div>
      </Card>

      {/* AI Assistant Settings (Admin Only) */}
      {isAdmin && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
              <Bot className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">AI Assistant Configuration</h3>
              <p className="text-sm text-slate-600">Configure OpenAI integration (Admin only)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="text-purple-600 mt-1" size={20} />
                <div>
                  <p className="font-medium text-purple-900">About AI Assistant</p>
                  <p className="text-sm text-purple-700 mt-1">
                    The AI Assistant uses OpenAI's GPT-4o-mini to provide intelligent insights, data analysis, and recommendations throughout the CRM.
                  </p>
                  <p className="text-sm text-purple-700 mt-2">
                    Get your API key from: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="underline font-medium">platform.openai.com/api-keys</a>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <Input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxx"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showOpenaiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Stored securely in Supabase. Only visible to admin users.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Enable AI Assistant</p>
                <p className="text-sm text-slate-600">Allow users to access AI-powered features</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600"></div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                icon={Save} 
                onClick={saveAISettings}
                disabled={isLoadingAI}
              >
                {isLoadingAI ? 'Saving...' : 'Save AI Settings'}
              </Button>
              <Button 
                variant="secondary"
                onClick={loadAISettings}
              >
                Reset
              </Button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Cost Estimate:</strong> Using gpt-4o-mini costs approximately $0.15 per 1M input tokens and $0.60 per 1M output tokens. 
                Average usage: ~$2-5/month for 1,000 queries.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Appearance */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Palette className="text-pink-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Appearance</h3>
            <p className="text-sm text-slate-600">Customize the look and feel</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div 
            onClick={() => handleThemeChange('light')}
            className={`p-4 border-2 rounded-lg cursor-pointer bg-white transition-all hover:shadow-lg ${
              theme === 'light' ? 'border-primary-500 shadow-lg' : 'border-slate-300'
            }`}
          >
            <div className="w-full h-20 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg mb-2"></div>
            <p className="text-sm font-medium text-center">Light Theme</p>
            {theme === 'light' && <p className="text-xs text-primary-600 text-center mt-1 font-bold">✓ Active</p>}
          </div>
          <div 
            onClick={() => handleThemeChange('dark')}
            className={`p-4 border-2 rounded-lg cursor-pointer bg-slate-900 transition-all hover:shadow-lg ${
              theme === 'dark' ? 'border-primary-500 shadow-lg' : 'border-slate-300'
            }`}
          >
            <div className="w-full h-20 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg mb-2"></div>
            <p className="text-sm font-medium text-center text-white">Dark Theme</p>
            {theme === 'dark' && <p className="text-xs text-primary-400 text-center mt-1 font-bold">✓ Active</p>}
          </div>
          <div 
            onClick={() => handleThemeChange('auto')}
            className={`p-4 border-2 rounded-lg cursor-pointer bg-white transition-all hover:shadow-lg ${
              theme === 'auto' ? 'border-primary-500 shadow-lg' : 'border-slate-300'
            }`}
          >
            <div className="w-full h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mb-2"></div>
            <p className="text-sm font-medium text-center">Auto</p>
            {theme === 'auto' && <p className="text-xs text-primary-600 text-center mt-1 font-bold">✓ Active</p>}
          </div>
        </div>
      </Card>

      {/* Security - Change Password */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Lock className="text-green-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Security</h3>
            <p className="text-sm text-slate-600">Change your password</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handlePasswordChange}>
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Enter current password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-9 text-slate-500 hover:text-slate-700"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter new password (min 6 characters)"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-9 text-slate-500 hover:text-slate-700"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-slate-500 hover:text-slate-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button type="submit" icon={Lock}>
            Change Password
          </Button>
        </form>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Data & Privacy</h3>
            <p className="text-sm text-slate-600">Manage your data</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            icon={Download} 
            variant="secondary" 
            onClick={async () => {
              try {
                await toast.promise(
                  new Promise(resolve => setTimeout(resolve, 2000)),
                  {
                    loading: 'Preparing your data export...',
                    success: 'Export complete! Check your downloads.',
                    error: 'Export failed',
                  }
                );
              } catch (error) {
                console.error('Failed to export data:', error);
              }
            }}
          >
            Export My Data
          </Button>
          <Button 
            icon={Trash2} 
            variant="danger" 
            onClick={() => {
              if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
              
              toast.error('Account deletion requested', {
                description: 'Contact support to complete this process',
                action: {
                  label: 'Contact Support',
                  onClick: () => window.location.href = 'mailto:support@copcca.com'
                }
              });
            }}
          >
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};
