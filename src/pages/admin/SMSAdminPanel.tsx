/**
 * SMS Admin Panel - COPCCA Only
 * Configure centralized Twilio credentials
 * Monitor SMS usage across all companies
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { 
  Settings, 
  DollarSign, 
  MessageSquare, 
  TrendingUp, 
  Users,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  enabled: boolean;
}

interface SMSStats {
  total_companies: number;
  total_sms_sent: number;
  total_revenue: number;
  total_cost: number;
  profit: number;
  active_companies: number;
  sms_today: number;
  revenue_today: number;
}

export const SMSAdminPanel: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<TwilioConfig>({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    enabled: false
  });
  const [stats, setStats] = useState<SMSStats>({
    total_companies: 0,
    total_sms_sent: 0,
    total_revenue: 0,
    total_cost: 0,
    profit: 0,
    active_companies: 0,
    sms_today: 0,
    revenue_today: 0
  });
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    checkAdminAccess();
    loadConfig();
    loadStats();
  }, []);

  const checkAdminAccess = async () => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      window.location.href = '/app/dashboard';
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number', 'sms_enabled']);

      if (error) throw error;

      const configMap = Object.fromEntries(data?.map(s => [s.key, s.value]) || []);
      setConfig({
        accountSid: configMap.twilio_account_sid || '',
        authToken: configMap.twilio_auth_token || '',
        phoneNumber: configMap.twilio_phone_number || '',
        enabled: configMap.sms_enabled === 'true'
      });
    } catch (error) {
      console.error('Failed to load config:', error);
      toast.error('Failed to load Twilio configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get overall SMS statistics
      const { data: smsLogs } = await supabase
        .from('sms_logs')
        .select('*');

      const { data: balances } = await supabase
        .from('company_sms_balance')
        .select('*');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalSent = smsLogs?.length || 0;
      const smsToday = smsLogs?.filter(log => new Date(log.created_at) >= today).length || 0;
      const activeCompanies = balances?.filter(b => b.total_sms_sent > 0).length || 0;

      // Calculate revenue (assuming $0.02 per SMS)
      const totalRevenue = (balances?.reduce((sum, b) => sum + (b.total_spent || 0), 0) || 0);
      const totalCost = totalSent * 0.01; // Twilio costs ~$0.01 per SMS
      const profit = totalRevenue - totalCost;

      setStats({
        total_companies: balances?.length || 0,
        total_sms_sent: totalSent,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        profit: profit,
        active_companies: activeCompanies,
        sms_today: smsToday,
        revenue_today: smsToday * 0.02
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: 'twilio_account_sid', value: config.accountSid },
        { key: 'twilio_auth_token', value: config.authToken },
        { key: 'twilio_phone_number', value: config.phoneNumber },
        { key: 'sms_enabled', value: config.enabled ? 'true' : 'false' }
      ];

      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            category: 'sms',
            description: `Twilio ${setting.key.replace('twilio_', '').replace('_', ' ')}`
          }, { onConflict: 'key' });

        if (error) throw error;
      }

      toast.success('Twilio configuration saved successfully!');
      loadConfig();
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testTwilioConnection = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number to test');
      return;
    }

    setTesting(true);
    try {
      // Test sending SMS via Twilio
      const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
      const auth = btoa(`${config.accountSid}:${config.authToken}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        body: new URLSearchParams({
          To: testPhone,
          From: config.phoneNumber,
          Body: '🧪 Test SMS from COPCCA CRM Admin Panel. Twilio integration is working!'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Twilio API error');
      }

      const result = await response.json();
      toast.success('✅ Test SMS sent successfully!', {
        description: `Message SID: ${result.sid}`
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('❌ Test SMS failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const toggleSMSGlobally = async () => {
    try {
      const newStatus = !config.enabled;
      await supabase
        .from('system_settings')
        .upsert({
          key: 'sms_enabled',
          value: newStatus ? 'true' : 'false',
          category: 'sms'
        }, { onConflict: 'key' });

      setConfig({ ...config, enabled: newStatus });
      toast.success(`SMS service ${newStatus ? 'enabled' : 'disabled'} for all companies`);
    } catch (error) {
      toast.error('Failed to toggle SMS service');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const isConfigured = config.accountSid && config.authToken && config.phoneNumber;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SMS Admin Panel</h1>
          <p className="text-slate-600 mt-1">Manage centralized Twilio configuration for all users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            config.enabled && isConfigured 
              ? 'bg-green-100 text-green-700' 
              : 'bg-slate-100 text-slate-600'
          }`}>
            {config.enabled && isConfigured ? (
              <>
                <CheckCircle size={20} />
                <span className="font-semibold">SMS Active</span>
              </>
            ) : (
              <>
                <AlertCircle size={20} />
                <span className="font-semibold">SMS Inactive</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total SMS Sent</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total_sms_sent.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{stats.sms_today} today</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">${stats.total_revenue.toFixed(2)}</p>
              <p className="text-xs text-green-600">+${stats.revenue_today.toFixed(2)} today</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Net Profit</p>
              <p className="text-2xl font-bold text-slate-900">${stats.profit.toFixed(2)}</p>
              <p className="text-xs text-slate-500">Cost: ${stats.total_cost.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Companies</p>
              <p className="text-2xl font-bold text-slate-900">{stats.active_companies}</p>
              <p className="text-xs text-slate-500">of {stats.total_companies} total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Twilio Configuration */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="text-primary-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Twilio Configuration</h2>
              <p className="text-sm text-slate-600">Centralized SMS credentials for all companies</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          {!isConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">⚠️ Twilio Not Configured</p>
              <p className="text-sm text-yellow-700 mt-1">
                Add your Twilio credentials below to enable SMS for all users.
              </p>
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Twilio Account SID
              </label>
              <Input
                type="text"
                value={config.accountSid}
                onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                disabled={saving}
              />
              <p className="text-xs text-slate-500 mt-1">
                Found in your <a href="https://console.twilio.com" target="_blank" rel="noopener" className="text-blue-600 underline">Twilio Console</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Twilio Auth Token
              </label>
              <Input
                type="password"
                value={config.authToken}
                onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
                placeholder="••••••••••••••••••••••••••••••••"
                disabled={saving}
              />
              <p className="text-xs text-slate-500 mt-1">
                Keep this secret! Never share or commit to Git.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Twilio Phone Number
              </label>
              <Input
                type="tel"
                value={config.phoneNumber}
                onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                placeholder="+255754123456"
                disabled={saving}
              />
              <p className="text-xs text-slate-500 mt-1">
                Use E.164 format. Recommended: Local number for your region (+255 for Tanzania)
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="sms-enabled"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="sms-enabled" className="text-sm font-medium text-slate-900 cursor-pointer">
                Enable SMS service for all companies
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={saveConfig}
              disabled={saving || !config.accountSid || !config.authToken || !config.phoneNumber}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>

            {isConfigured && (
              <Button
                variant="secondary"
                onClick={toggleSMSGlobally}
              >
                {config.enabled ? 'Disable SMS Globally' : 'Enable SMS Globally'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Test SMS */}
      {isConfigured && (
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-slate-900">Test SMS Delivery</h2>
            <p className="text-sm text-slate-600">Send a test SMS to verify Twilio integration</p>
          </div>

          <div className="p-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+255754123456"
                  disabled={testing}
                />
              </div>
              <Button
                onClick={testTwilioConnection}
                disabled={testing || !testPhone}
              >
                {testing ? 'Sending...' : 'Send Test SMS'}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This will send a real SMS to the entered phone number to verify your Twilio setup.
            </p>
          </div>
        </Card>
      )}

      {/* Setup Guide */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">Setup Guide</h2>
        </div>

        <div className="p-6">
          <ol className="space-y-4">
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <p className="font-medium text-slate-900">Create Twilio Account</p>
                <p className="text-sm text-slate-600 mt-1">
                  Sign up at <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener" className="text-blue-600 underline">twilio.com/try-twilio</a> (free trial available)
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <p className="font-medium text-slate-900">Get Phone Number</p>
                <p className="text-sm text-slate-600 mt-1">
                  Buy a phone number in your region (+255 for Tanzania, +254 for Kenya) - costs ~$1/month
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <p className="font-medium text-slate-900">Copy Credentials</p>
                <p className="text-sm text-slate-600 mt-1">
                  From Twilio Console, copy Account SID, Auth Token, and Phone Number. Paste them above and save.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <p className="font-medium text-slate-900">Test & Enable</p>
                <p className="text-sm text-slate-600 mt-1">
                  Send a test SMS to your phone, then enable SMS globally. All companies can now use SMS!
                </p>
              </div>
            </li>
          </ol>
        </div>
      </Card>

      {/* Important Notes */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📌 Important Notes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Security:</strong> These credentials are shared by ALL companies. Keep them secret!</li>
            <li>• <strong>Costs:</strong> Twilio charges ~$0.01 per SMS. You can charge users $0.02+ for profit.</li>
            <li>• <strong>Users:</strong> Companies buy SMS credits and send messages - they never see Twilio credentials.</li>
            <li>• <strong>Billing:</strong> Monitor usage via the statistics above. Set up billing alerts in Twilio.</li>
            <li>• <strong>Support:</strong> If SMS fails, check Twilio Console logs and sms_logs table in database.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
