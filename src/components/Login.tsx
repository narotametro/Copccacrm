import { useState, useEffect } from 'react';
import { Phone, Lock, Eye, EyeOff, LogIn, UserPlus, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../lib/auth-context';
import { CountrySelector } from './CountrySelector';
import { invitationAPI } from '../lib/api';

interface LoginProps {
  onBack?: () => void;
  inviteCode?: string | null;
}

export function Login({ onBack, inviteCode }: LoginProps) {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(!!inviteCode); // Auto switch to signup if invite code
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  
  const [loginForm, setLoginForm] = useState({
    phone: '',
    countryCode: '+1',
    password: '',
  });
  
  const [signupForm, setSignupForm] = useState({
    name: '',
    phone: '',
    countryCode: '+1',
    password: '',
    confirmPassword: '',
    role: 'user', // Default role for invited users
  });

  // Load invite information if invite code is present
  useEffect(() => {
    const loadInviteInfo = async () => {
      if (inviteCode) {
        try {
          const info = await invitationAPI.verify(inviteCode);
          setInviteInfo(info);
          setSignupForm(prev => ({
            ...prev,
            name: info.name || '',
            role: info.role || 'user',
            // Parse phone to extract country code and local number
            phone: (() => {
              if (!info.phone) return '';
              // Match country code with optional hyphens: +1, +254, +1-684, etc.
              const match = info.phone.match(/^(\+\d{1,4}(?:-\d+)?)(\d+)$/);
              return match ? match[2] : info.phone.replace(/\D/g, '');
            })(),
            countryCode: (() => {
              if (!info.phone) return '+1';
              // Match country code with optional hyphens: +1, +254, +1-684, etc.
              const match = info.phone.match(/^(\+\d{1,4}(?:-\d+)?)(\d+)$/);
              return match ? match[1] : '+1';
            })(),
          }));
          setIsSignUp(true);
          toast.success(`Welcome ${info.name}! Complete your signup below.`);
        } catch (error: any) {
          console.error('Invalid invite code:', error);
          toast.error('Invalid or expired invitation link');
        }
      }
    };
    loadInviteInfo();
  }, [inviteCode]);

  // Password strength validation
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
    };
  };

  const passwordStrength = validatePassword(isSignUp ? signupForm.password : '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.phone || !loginForm.password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Clean and format phone number
    let cleanPhone = loginForm.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    const fullPhone = `${loginForm.countryCode}${cleanPhone}`;

    setLoading(true);
    try {
      await login(fullPhone, loginForm.password);
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.name || !signupForm.phone || !signupForm.password || !signupForm.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!passwordStrength.isValid) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, and number');
      return;
    }

    // Clean and format phone number
    let cleanPhone = signupForm.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    const fullPhone = `${signupForm.countryCode}${cleanPhone}`;

    setLoading(true);
    try {
      await signup(signupForm.name, fullPhone, signupForm.password, signupForm.role, inviteCode || undefined);
      toast.success('Account created successfully!');
      
      // If invited, show success message
      if (inviteCode) {
        toast.success('Welcome to the team! Redirecting to dashboard...');
      }
      
      setIsSignUp(false);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Check if user already exists
      if (error.message && error.message.includes('already registered')) {
        toast.error('This phone number is already registered. Please use the login page instead.', {
          duration: 6000,
          action: {
            label: 'Go to Login',
            onClick: () => setIsSignUp(false)
          }
        });
      } else {
        toast.error(error.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            COPCCA CRM
          </h1>
        </div>

        {/* Back to Landing Page Button */}
        {onBack && !inviteCode && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
        )}

        {/* Invite Banner */}
        {inviteCode && inviteInfo && (
          <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-xl">
            <div className="flex items-center gap-2 text-pink-800">
              <UserPlus size={18} className="text-pink-600" />
              <p className="text-sm">
                You've been invited to join as {inviteInfo.role === 'admin' ? 'an' : 'a'} <strong>{inviteInfo.role === 'admin' ? 'Admin' : 'User'}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-gray-600">
              {isSignUp 
                ? inviteCode ? 'Complete your signup to join the team' : 'Start your 7-day free trial today'
                : 'Sign in to access your dashboard'}
            </p>
          </div>

          {/* Sign Up Form */}
          {isSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
                  disabled={!!inviteInfo?.name}
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Phone Number
                </label>
                <div className="space-y-2">
                  <CountrySelector
                    value={signupForm.countryCode}
                    onChange={(code) => setSignupForm({ ...signupForm, countryCode: code })}
                    disabled={!!inviteInfo?.phone}
                  />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      placeholder="555 123 4567"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
                      disabled={!!inviteInfo?.phone}
                    />
                  </div>
                  {signupForm.phone && (
                    <p className="text-xs text-gray-500">
                      Your number: <span className="font-mono text-pink-600">
                        {signupForm.countryCode}{signupForm.phone.replace(/\D/g, '').replace(/^0+/, '')}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {signupForm.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      <div className={`h-1 flex-1 rounded ${signupForm.password.length >= 3 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                      <div className={`h-1 flex-1 rounded ${signupForm.password.length >= 6 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                      <div className={`h-1 flex-1 rounded ${passwordStrength.isValid ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className={`flex items-center gap-1 ${passwordStrength.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.minLength ? '✓' : '○'} At least 8 characters
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.hasUpperCase ? '✓' : '○'} One uppercase letter
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.hasLowerCase ? '✓' : '○'} One lowercase letter
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.hasNumber ? '✓' : '○'} One number
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                {signupForm.confirmPassword && signupForm.password !== signupForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !passwordStrength.isValid || signupForm.password !== signupForm.confirmPassword}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Create Account
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Phone Number
                </label>
                <div className="space-y-2">
                  <CountrySelector
                    value={loginForm.countryCode}
                    onChange={(code) => setLoginForm({ ...loginForm, countryCode: code })}
                  />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={loginForm.phone}
                      onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                      placeholder="555 123 4567"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                  {loginForm.phone && (
                    <p className="text-xs text-gray-500">
                      Signing in as: <span className="font-mono text-pink-600">
                        {loginForm.countryCode}{loginForm.phone.replace(/\D/g, '').replace(/^0+/, '')}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={20} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle Sign Up / Sign In */}
          {!inviteCode && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                {' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-pink-600 hover:text-pink-700"
                  disabled={loading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}