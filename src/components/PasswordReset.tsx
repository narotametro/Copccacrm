import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function PasswordReset() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setVerifying(false);
      toast.error('Invalid reset link');
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-a2294ced/auth/verify-reset-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid token');
      }

      setTokenValid(data.valid);
      setEmail(data.email);
    } catch (error: any) {
      console.error('Token verification error:', error);
      toast.error(error.message || 'Invalid or expired reset link');
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
    };
  };

  const passwordStrength = validatePassword(form.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.newPassword || !form.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!passwordStrength.isValid) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, and number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-a2294ced/auth/update-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            newPassword: form.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess(true);
      toast.success('Password updated successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-2xl mb-4">
              <AlertCircle size={40} className="text-red-600" />
            </div>
            <h1 className="text-3xl mb-2">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-2xl mb-4">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl mb-2">Password Updated!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
            <Lock size={40} className="text-white" />
          </div>
          <h1 className="text-3xl mb-2">Create New Password</h1>
          <p className="text-gray-600">
            Enter a new password for {email}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {form.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded ${form.newPassword.length >= 3 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded ${form.newPassword.length >= 6 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded ${passwordStrength.isValid ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className={`flex items-center gap-2 ${passwordStrength.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordStrength.minLength ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordStrength.hasUpperCase ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordStrength.hasLowerCase ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordStrength.hasNumber ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      One number
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
                  disabled={loading}
                />
              </div>
              {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordStrength.isValid || form.newPassword !== form.confirmPassword}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex gap-3">
              <ShieldCheck className="text-blue-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-blue-900 mb-1">
                  Secure Password Reset
                </p>
                <p className="text-xs text-blue-700">
                  Your new password is encrypted and securely stored. This reset link will expire after use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}