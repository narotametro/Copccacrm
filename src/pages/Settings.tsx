import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Lock, Globe, Palette, Database, Download, Trash2, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
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
          <Button icon={Save} onClick={() => toast.success('Preferences saved!')}>
            Save Preferences
          </Button>
        </div>
      </Card>

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
          <Button icon={Download} variant="secondary" onClick={() => toast.success('Export started...')}>
            Export My Data
          </Button>
          <Button icon={Trash2} variant="danger" onClick={() => toast.success('Account deletion requested')}>
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};
