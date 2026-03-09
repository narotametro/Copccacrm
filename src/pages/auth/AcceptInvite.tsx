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

      // Use inviter info directly from invitation record (no queries needed!)
      // This avoids RLS policy issues when accepting invitations
      const inviterName = (data as any).inviter_name || 'System Administrator';
      const companyNameValue = (data as any).inviter_company_name || 'the company';
      const inviterCompanyId = (data as any).inviter_company_id;
      
      setAdminName(inviterName);
      setCompanyName(companyNameValue);

      // Fetch actual subscription plan for the company
      if (inviterCompanyId) {
        try {
          // Get the company owner's user ID
          const { data: companyOwner } = await supabase
            .from('users')
            .select('id')
            .eq('company_id', inviterCompanyId)
            .eq('role', 'admin')
            .limit(1)
            .maybeSingle();

          if (companyOwner) {
            // Fetch the actual subscription plan
            const { data: subscription } = await supabase
              .from('user_subscriptions')
              .select(`
                plan:subscription_plans (
                  display_name
                )
              `)
              .eq('user_id', companyOwner.id)
              .in('status', ['trial', 'active'])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (subscription && (subscription as any).plan) {
              const plan = (subscription as any).plan;
              const displayName = plan?.display_name;
              setPlanName(displayName || 'START');
            } else {
              setPlanName('START'); // Default if no subscription found
            }
          } else {
            setPlanName('START'); // Default if no owner found
          }
        } catch (err) {
          console.error('Error fetching subscription:', err);
          setPlanName('START'); // Default on error
        }
      } else {
        setPlanName('START'); // Default if no company ID
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
      // Get company_id from invitation record (no queries needed!)
      const companyId = (invite as any).inviter_company_id || null;

      // Check if user already exists in auth
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', invite.email.toLowerCase())
        .maybeSingle();

      // If user already exists, show error and direct to login
      if (existingUsers) {
        toast.error('This email is already registered. Please login instead.', {
          duration: 5000,
        });
        setTimeout(() => {
          navigate('/login?email=' + encodeURIComponent(invite.email), { replace: true });
        }, 2000);
        setLoading(false);
        return;
      }

      // Sign up the user
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

      if (signup.error) {
        // Handle "User already registered" error from Supabase Auth
        if (signup.error.message?.includes('already registered') || signup.error.status === 422) {
          toast.error('This email is already registered. Please login instead.', {
            duration: 5000,
          });
          setTimeout(() => {
            navigate('/login?email=' + encodeURIComponent(invite.email), { replace: true });
          }, 2000);
          return;
        }
        throw signup.error;
      }

      const userId = signup.data.user?.id;

      if (userId) {
        // Create user record - automatically inherit company from inviter
        const { error: upsertError } = await supabase.from('users').upsert({
          id: userId,
          email: invite.email,
          full_name: fullName || invite.email,
          role: invite.role,
          status: 'active',
          company_id: companyId, // Inherit company from inviter
          invited_by: invite.created_by,
          is_company_owner: false,
        });

        if (upsertError) {
          console.error('Error upserting user:', upsertError);
          throw upsertError;
        }

        // Mark invitation as used
        const { error: updateError } = await supabase
          .from('invitation_links')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('id', invite.id);

        if (updateError) throw updateError;
      }

      // Auto sign-in the user (no manual login needed!)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password,
      });

      if (signInError) {
        console.error('Auto sign-in failed:', signInError);
        toast.success('Invitation accepted! Please sign in.');
        navigate('/login', { replace: true });
        return;
      }

      toast.success('Welcome to the team! 🎉');
      setStatus('accepted');
      navigate('/app/dashboard', { replace: true });
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
                {(invite as any).department && <p>✓ Department: <span className="font-semibold">{(invite as any).department}</span></p>}
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
            
            {/* Info message for existing users */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>New to COPCCA?</strong> Set your password below to create your account.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Already have an account? <Link to="/login" className="underline font-semibold">Login here</Link> instead.
              </p>
            </div>

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
            
            <p className="text-sm text-center text-slate-600">
              Wrong email? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">Go to login</Link>
            </p>
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
