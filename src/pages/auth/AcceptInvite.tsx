import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import type { Database } from '@/lib/types/database';

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
);

type InviteRow = Database['public']['Tables']['invitation_links']['Row'];

type InvitationStatus = 'validating' | 'ready' | 'invalid' | 'accepted';

export const AcceptInvite: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const emailParam = params.get('email');

  const [invite, setInvite] = useState<InviteRow | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');
  const [planName, setPlanName] = useState<string>('');
  const [status, setStatus] = useState<InvitationStatus>('validating');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validateInvite = async () => {
      if (!token || !emailParam) {
        setStatus('invalid');
        return;
      }

      if (!isSupabaseConfigured) {
        setStatus('invalid');
        toast.error('Supabase is not configured for invite acceptance.');
        return;
      }

      const { data, error } = await supabase
        .from('invitation_links')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (error || !data) {
        setStatus('invalid');
        return;
      }

      const isExpired = new Date(data.expires_at) < new Date();
      const emailMismatch = emailParam.toLowerCase() !== data.email.toLowerCase();

      if (data.used || isExpired || emailMismatch) {
        setStatus('invalid');
        return;
      }

      setInvite(data);

      // Fetch inviter's company and plan information
      const { data: inviterData } = await supabase
        .from('users')
        .select('company_id, full_name, companies(name)')
        .eq('id', data.created_by)
        .single();

      if (inviterData) {
        setAdminName(inviterData.full_name || 'Admin');
        const companyInfo = inviterData.companies as any;
        setCompanyName(companyInfo?.name || 'the company');

        // Get inviter's subscription plan
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select('subscription_plans(display_name)')
          .eq('user_id', data.created_by)
          .in('status', ['trial', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (subscriptionData) {
          const planInfo = subscriptionData.subscription_plans as any;
          setPlanName(planInfo?.display_name || 'START');
        }
      }

      setStatus('ready');
    };

    validateInvite();
  }, [token, emailParam]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // Get the inviting admin's company_id
      const { data: inviterData, error: inviterError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', invite.created_by)
        .single();

      if (inviterError) {
        console.error('Error getting inviter data:', inviterError);
      }

      console.log('Inviter data:', inviterData);

      let companyId = inviterData?.company_id;

      // If inviter doesn't have a company, create one
      if (!companyId) {
        console.log('Inviter has no company, creating one...');
        const { data: inviterUserData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', invite.created_by)
          .single();

        const companyName = inviterUserData?.full_name 
          ? `${inviterUserData.full_name}'s Company`
          : `${inviterUserData?.email?.split('@')[0] || 'Company'}`;

        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            email: inviterUserData?.email,
            status: 'active',
            subscription_plan: 'starter',
            subscription_status: 'trial',
            max_users: 10,
            created_by: invite.created_by,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating company for inviter:', createError);
        } else if (newCompany) {
          companyId = newCompany.id;
          console.log('Created company for inviter:', companyId);

          // Update the inviter with the company_id
          await supabase
            .from('users')
            .update({
              company_id: companyId,
              is_company_owner: true,
            })
            .eq('id', invite.created_by);
        }
      }

      const signup = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: {
            full_name: fullName || invite.email,
            role: invite.role,
            company_id: companyId,
          },
        },
      });

      if (signup.error) throw signup.error;

      const userId = signup.data.user?.id;

      if (userId) {
        console.log('Creating user record for invited user:', userId, 'with company_id:', companyId);
        // Create user record - automatically inherit admin's company
        const { error: upsertError } = await supabase.from('users').upsert({
          id: userId,
          email: invite.email,
          full_name: fullName || invite.email,
          role: invite.role,
          status: 'active',
          company_id: companyId, // Inherit admin's company
          invited_by: invite.created_by, // Track who invited them
          is_company_owner: false, // Invited users are not company owners
        });

        if (upsertError) {
          console.error('Error upserting user:', upsertError);
          throw upsertError;
        } else {
          console.log('Successfully created user record with company_id');
        }

        const { error: updateError } = await supabase
          .from('invitation_links')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('id', invite.id);

        if (updateError) throw updateError;
      }

      toast.success('Invitation accepted! Please sign in.');
      setStatus('accepted');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Invite acceptance failed:', error);
      toast.error('Could not accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const renderInvalid = () => (
    <Card className="max-w-lg mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3 text-red-700">
        <AlertCircle />
        <div>
          <h2 className="text-xl font-bold">Invitation is invalid</h2>
          <p className="text-sm text-red-600">The link may be expired, used, or incorrect.</p>
        </div>
      </div>
      <Button variant="secondary" onClick={() => navigate('/login')}>
        Go to login
      </Button>
    </Card>
  );

  if (status === 'invalid') return renderInvalid();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="w-full max-w-xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center text-white">
            <Shield />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Accept Invitation</h1>
            <p className="text-sm text-slate-600">Complete your account setup to join the workspace.</p>
          </div>
        </div>

        {status === 'validating' && <p className="text-sm text-slate-600">Validating invitation...</p>}

        {status === 'ready' && invite && (
          <form className="space-y-4" onSubmit={handleAccept}>
            {/* Company Info Banner */}
            <div className="p-4 bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-lg text-slate-900">Join {companyName}</h3>
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                <p>✓ Invited by: <span className="font-semibold">{adminName}</span></p>
                <p>✓ Your role: <span className="font-semibold">{invite.role.toUpperCase()}</span></p>
                {planName && <p>✓ Subscription: <span className="font-semibold">{planName} Plan</span></p>}
                {invite.department && <p>✓ Department: <span className="font-semibold">{invite.department}</span></p>}
              </div>
            </div>

            <Input label="Email" value={invite.email} icon={Mail} disabled />
            <Input
              label="Full name"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={User}
              required
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              minLength={8}
            />
            <Input
              type="password"
              label="Confirm password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
              required
              minLength={8}
            />
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} icon={CheckCircle}>
                {loading ? 'Creating account...' : `Join ${companyName}`}
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate('/login')}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {status === 'accepted' && (
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle />
            <p>Invitation accepted. Redirecting to login...</p>
          </div>
        )}

        <div className="text-xs text-slate-500">
          Wrong email? <Link to="/login" className="text-primary-600 font-semibold">Go to login</Link>
        </div>
      </Card>
    </div>
  );
};

export default AcceptInvite;
