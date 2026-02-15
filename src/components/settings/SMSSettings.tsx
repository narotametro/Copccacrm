/**
 * SMS Settings Component
 * Configure Twilio SMS for Debt Collection
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { MessageSquare, CheckCircle, Zap, CreditCard } from 'lucide-react';
import { loadSMSConfig } from '@/lib/services/smsService';
import { SMSCredits } from '@/components/sms/SMSCredits';
import { useCurrency } from '@/context/CurrencyContext';

export const SMSSettings: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'credits' | 'settings'>('credits');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    enabled: true,
    language: 'en' as 'en' | 'sw',
    reminderIntervalDays: 3
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const smsConfig = await loadSMSConfig();
      setConfig({
        enabled: smsConfig.enabled !== false,
        language: smsConfig.language || 'en',
        reminderIntervalDays: smsConfig.reminderIntervalDays || 3
      });
    } catch (error) {
      console.error('Failed to load SMS settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Save language and interval settings only
      const settings = [
        { key: 'sms_language', value: config.language },
        { key: 'sms_reminder_interval_days', value: config.reminderIntervalDays.toString() },
        { key: 'sms_enabled', value: config.enabled ? 'true' : 'false' }
      ];

      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            category: 'sms'
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      toast.success('SMS settings saved successfully');
    } catch (error) {
      console.error('Failed to save SMS settings:', error);
      toast.error('Failed to save SMS settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('credits')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'credits'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCard className="inline-block mr-2" size={16} />
            SMS Credits & Balance
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="inline-block mr-2" size={16} />
            Language & Settings
          </button>
        </nav>
      </div>

      {/* Credits Tab */}
      {activeTab === 'credits' && <SMSCredits />}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 pb-6 border-b">
          <div className="p-3 bg-primary-100 rounded-lg">
            <MessageSquare className="text-primary-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">SMS Language & Automation</h2>
            <p className="text-sm text-slate-600">
              Configure language preference and reminder settings for SMS
            </p>
          </div>
          {config.enabled && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Active</span>
            </div>
          )}
        </div>

        {/* Centralized SMS Info */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Zap className="text-primary-600" size={18} />
            Powered by COPCCA SMS Service
          </h3>
          <p className="text-sm text-slate-700 mb-3">
            SMS is now centrally managed by COPCCA! No Twilio account needed. Just buy SMS credits and start sending.
          </p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>Pay-as-you-go pricing ({formatCurrency(0.02)}/SMS)</li>
            <li>Instant activation - no setup required</li>
            <li>Better bulk rates with volume discounts</li>
            <li>Free {formatCurrency(0.20)} credits for new accounts</li>
          </ul>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              SMS Language / Lugha ya SMS
            </label>
            <select
              value={config.language}
              onChange={(e) => setConfig({ ...config, language: e.target.value as 'en' | 'sw' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            >
              <option value="en">🇬🇧 English - "URGENT: Dear Customer, your invoice #123..."</option>
              <option value="sw">🇹🇿 Kiswahili - "DHARURA: Mpendwa Mteja, ankara yako #123..."</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Choose the language your customers understand best. Messages will be sent in this language.
            </p>
          </div>

          {/* Reminder Interval */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reminder Interval (Days) / Muda wa Ukumbusho (Siku)
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="1"
                max="30"
                value={config.reminderIntervalDays}
                onChange={(e) => setConfig({ ...config, reminderIntervalDays: parseInt(e.target.value) || 7 })}
                placeholder="7"
                disabled={loading}
                className="w-32"
              />
              <span className="text-sm text-slate-600">days between automatic reminders</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              System will automatically send reminders every {config.reminderIntervalDays} days for overdue invoices. 
              Recommended: 3-7 days
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
              Enable SMS reminders for debt collection
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            variant="secondary"
            onClick={loadSettings}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={saveSettings}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Pricing Info */}
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900 mb-2">💰 Centralized SMS Pricing</p>
          <ul className="space-y-1 text-xs">
            <li>• {formatCurrency(0.02)} per SMS (pay-as-you-go)</li>
            <li>• Volume discounts: 10-30% off bulk packages</li>
            <li>• Free {formatCurrency(0.20)} credits for new accounts</li>
            <li>• Switch to "Credits & Balance" tab to top up</li>
          </ul>
        </div>
      </div>
    </Card>
      )}
    </div>
  );
};
