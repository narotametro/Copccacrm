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
      const signup = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: {
            full_name: fullName || invite.email,
            role: invite.role,
          },
        },
      });

      if (signup.error) throw signup.error;

      const userId = signup.data.user?.id;

      if (userId) {
        await supabase.from('users').upsert({
          id: userId,
          email: invite.email,
          full_name: fullName || invite.email,
          role: invite.role,
          status: 'active',
        });

        await supabase
          .from('invitation_links')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('id', invite.id);
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
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
              <p className="font-semibold">You will join as: {invite.role.toUpperCase()}</p>
              <p>Expires: {new Date(invite.expires_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} icon={CheckCircle}>
                {loading ? 'Creating account...' : 'Accept invitation'}
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
