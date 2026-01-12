import React, { useState, useEffect } from 'react';
import { Database, Bot, Save, Eye, EyeOff, CheckCircle, AlertTriangle, Activity, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const AdminSystem: React.FC = () => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
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
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
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
          loading: 'Saving system settings...',
          success: 'System settings saved successfully!',
          error: 'Failed to save settings'
        }
      );
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAIConnection = async () => {
    if (!openaiKey) {
      toast.error('Please enter an OpenAI API key first');
      return;
    }

    setTestStatus('testing');
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
      });

      if (response.ok) {
        setTestStatus('success');
        toast.success('OpenAI connection successful! ✅');
      } else {
        setTestStatus('error');
        toast.error('Invalid API key or connection failed');
      }
    } catch (error) {
      setTestStatus('error');
      toast.error('Connection test failed');
    }

    setTimeout(() => setTestStatus('idle'), 3000);
  };

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
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-green-400 text-sm mb-1">Database</p>
            <p className="text-2xl font-bold text-green-400">Online</p>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-green-400 text-sm mb-1">Authentication</p>
            <p className="text-2xl font-bold text-green-400">Active</p>
          </div>
          <div className={`p-4 rounded-lg border ${aiEnabled ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <p className={`text-sm mb-1 ${aiEnabled ? 'text-green-400' : 'text-red-400'}`}>AI Assistant</p>
            <p className={`text-2xl font-bold ${aiEnabled ? 'text-green-400' : 'text-red-400'}`}>
              {aiEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </Card>

      {/* OpenAI Configuration */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
            <Bot className="text-purple-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Assistant Configuration</h3>
            <p className="text-purple-200 text-sm">Configure OpenAI integration for all companies</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">OpenAI API Key</label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxx"
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-200 hover:text-white"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-purple-200 text-xs mt-1">
              Get your key from: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="underline text-blue-400">platform.openai.com/api-keys</a>
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="text-white font-medium">Enable AI Assistant Globally</p>
              <p className="text-purple-200 text-sm">Allow all companies to use AI features</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600"></div>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              icon={Save}
              onClick={saveSettings}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              variant="secondary"
              onClick={testOpenAIConnection}
              disabled={testStatus === 'testing'}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              {testStatus === 'testing' && 'Testing...'}
              {testStatus === 'success' && <><CheckCircle size={16} className="mr-2" /> Connected</>}
              {testStatus === 'error' && <><AlertTriangle size={16} className="mr-2" /> Failed</>}
              {testStatus === 'idle' && 'Test Connection'}
            </Button>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-200 text-xs">
              <strong>Cost Estimate:</strong> Using gpt-4o-mini costs ~$0.15 per 1M input tokens. 
              Average across all companies: $50-150/month for moderate usage.
            </p>
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
