import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Eye, EyeOff, Building, Check, Crown, Zap, TrendingUp, Users, LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: LucideIcon;
  color: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'start',
    name: 'start',
    displayName: 'START',
    price: 'TZS 25,000',
    period: 'per month',
    description: 'Perfect for micro-businesses',
    icon: Users,
    color: 'green',
    features: [
      'Dashboard (AI Center)',
      'Customer Management (Customer 360)',
      'Advanced POS (Sales Hub)',
      'My Workplace (COPCCA Apps)',
    ],
  },
  {
    id: 'grow',
    name: 'grow',
    displayName: 'GROW',
    price: 'TZS 80,000',
    period: 'per month',
    description: 'Grow your business with POS',
    icon: TrendingUp,
    color: 'blue',
    popular: true,
    features: [
      'Everything in START',
      'After Sales & Task Management',
      'KPI Tracking',
      'Debt Collection',
      'My Workplace (COPCCA Apps)',
    ],
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'PRO',
    price: 'TZS 120,000',
    period: 'per month',
    description: 'Complete business platform',
    icon: Zap,
    color: 'purple',
    features: [
      'ALL FEATURES & TABS INCLUDED',
      'Dashboard (AI Center)',
      'Customer Management (Customer 360)',
      'Advanced POS (Sales Hub)',
      'After Sales & Task Management',
      'KPI Tracking',
      'Debt Collection',
      'Sales Pipeline',
      'Marketing Campaigns',
      'Product Intelligence',
      'Competitor Analysis',
      'Advanced Reports & Analytics',
      'Multi-user Collaboration',
      'Admin Panel',
      'My Workplace (COPCCA Apps)',
    ],
  },
];

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<'plan' | 'details'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setCurrentStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a pricing plan');
      return;
    }

    setLoading(true);

    try {
      // Create user account and auto sign in
      const signUpResult = await signUp(email, password, fullName, {
        companyName,
        phone,
        selectedPlan,
      });

      // Create subscription record
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('name', selectedPlan)
          .single();

        if (planData) {
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 7);

          await supabase
            .from('user_subscriptions')
            .insert({
              user_id: user.id,
              plan_id: planData.id,
              status: 'trial',
              trial_start_date: new Date().toISOString(),
              trial_end_date: trialEndDate.toISOString(),
            });
        }
      }

      if (signUpResult.autoSignedIn) {
        toast.success('Account created successfully! You have 7 days free trial.');
        navigate('/app/dashboard');
      } else if (signUpResult.requiresEmailConfirmation) {
        toast.success('Account created! Please check your email to confirm your account, then sign in.');
        navigate('/login');
      } else {
        toast.success('Account created successfully! You have 7 days free trial.');
        navigate('/app/dashboard');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 'plan') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 mb-4">
              <UserPlus className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Choose Your Plan</h1>
            <p className="text-slate-600 mt-2">Select the perfect plan for your business needs</p>
            <p className="text-sm text-slate-500 mt-1">All plans include 7 days free trial</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {pricingPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                    plan.popular
                      ? 'border-blue-500 shadow-lg scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${plan.color}-100 mb-3`}>
                      <Icon className={`text-${plan.color}-600`} size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{plan.displayName}</h3>
                    <p className="text-slate-600 text-sm mb-2">{plan.description}</p>
                    <div className="text-2xl font-bold text-slate-900">{plan.price}</div>
                    <div className="text-slate-600 text-sm">{plan.period}</div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-slate-600">
                        <Check className="text-green-500 mr-2 flex-shrink-0" size={16} />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-sm text-slate-500">
                        +{plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>

                  <Button
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Select Plan
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-slate-600 hover:text-slate-900"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="glass rounded-xl p-8 w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 mb-4">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-600 mt-2">Join COPCCA CRM today</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">Selected Plan: {pricingPlans.find(p => p.id === selectedPlan)?.displayName}</p>
            <p className="text-xs text-blue-600 mt-1">7 days free trial included</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={User}
            required
          />

          <Input
            type="text"
            label="Company Name"
            placeholder="Acme Corporation"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            icon={Building}
            required
          />

          <Input
            type="tel"
            label="Phone Number"
            placeholder="+234 800 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={User}
            required
          />

          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </Link>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setCurrentStep('plan')}
            >
              Back
            </Button>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
