import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const COPCCAAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Authenticate against database
      const { data, error } = await supabase.rpc('verify_admin_login', {
        login_email: email,
        login_password: password
      });

      if (error) {
        console.error('Login error:', error);
        toast.error('Login failed. Please try again.');
        return;
      }

      const result = data?.[0];
      
      if (result?.success) {
        // Store COPCCA admin session
        sessionStorage.setItem('copcca_admin_auth', 'true');
        sessionStorage.setItem('copcca_admin_email', result.admin_email);
        sessionStorage.setItem('copcca_admin_name', result.admin_name);
        sessionStorage.setItem('copcca_admin_id', result.admin_id);
        sessionStorage.setItem('copcca_admin_login_time', new Date().toISOString());
        
        toast.success(`Welcome, ${result.admin_name}`);
        navigate('/copcca-admin/dashboard');
      } else {
        toast.error(result?.message || 'Invalid credentials. Access denied.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 mb-4 shadow-xl">
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            COPCCA Platform Admin
          </h1>
          <p className="text-purple-200">
            Authorized Personnel Only
          </p>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 border-2 border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-3 text-red-200">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-100 mb-1">Restricted Access</p>
              <p className="text-sm">
                This portal is exclusively for COPCCA office staff. 
                Unauthorized access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </Card>

        {/* Login Form */}
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Mail className="inline mr-2" size={16} />
                COPCCA Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@copcca.com"
                required
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Lock className="inline mr-2" size={16} />
                Admin Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700"
            >
              {loading ? 'Verifying...' : 'Access Platform Admin'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-purple-200 hover:text-white text-sm transition-colors"
            >
              ← Back to Customer Login
            </button>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-purple-200/60 text-sm">
          <p>COPCCA Internal System</p>
          <p className="mt-1">All activities are monitored and logged</p>
        </div>
      </div>
    </div>
  );
};
