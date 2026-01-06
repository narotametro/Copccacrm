import { useState, useEffect } from 'react';
import { UserPlus, Copy, CheckCircle2, X, Mail, Link2, RefreshCw, Check, Info, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { toast } from 'sonner@2.0.3';
import { invitationAPI } from '../lib/api';
import { openWhatsApp } from '../lib/whatsapp-utils';
import { CountrySelector } from './CountrySelector';

export function InviteMember() {
  const { isAdmin, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1'); // Default to US
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isAdmin) return null;

  const generateInviteLink = async () => {
    try {
      // Clean and format phone number
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      const fullPhoneNumber = `${countryCode}${cleanPhone}`;

      const { inviteCode } = await invitationAPI.generate({ 
        name, 
        role,
        phone: fullPhoneNumber 
      });
      const link = `${window.location.origin}/?invite=${inviteCode}`;
      setInviteLink(link);
      return link;
    } catch (error: any) {
      console.error('Failed to generate invite:', error);
      toast.error('Failed to generate invitation link');
      return null;
    }
  };

  const handleSendWhatsApp = async () => {
    if (!phone || !name) {
      toast.error('Please enter name and phone number');
      return;
    }

    try {
      setSending(true);
      const link = await generateInviteLink();
      if (!link) return;

      // Clean and format phone number
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      const fullPhoneNumber = `${countryCode}${cleanPhone}`;
      
      console.log('📱 WhatsApp Number:', {
        countryCode,
        originalPhone: phone,
        cleanedPhone: cleanPhone,
        fullNumber: fullPhoneNumber
      });

      const message = `Hi ${name}! You've been invited to join our team on COPCCA CRM. Click this link to sign up: ${link}`;
      
      openWhatsApp(fullPhoneNumber, message);
      toast.success(`Opening WhatsApp for ${fullPhoneNumber}...`, {
        duration: 3000,
      });
      
      // Don't reset form yet - show the link
    } catch (error: any) {
      console.error('Failed to send WhatsApp invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) {
      const link = await generateInviteLink();
      if (!link) return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const resetForm = () => {
    setPhone('');
    setName('');
    setRole('user');
    setInviteLink('');
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
      >
        <UserPlus size={18} />
        Invite Member
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl my-8 flex flex-col">
            {/* Header - Fixed */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <UserPlus size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <h3 className="text-lg">Invite Team Member</h3>
                    <p className="text-sm text-gray-500">Send invitation via WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Success Banner - Shows after sending */}
              {inviteLink && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-900 mb-1">
                        ✅ Invitation Sent Successfully!
                      </p>
                      <p className="text-sm text-green-700">
                        WhatsApp has been opened with your invitation message. You can now close this popup or copy the link to share it elsewhere.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              {!inviteLink && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                  <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <strong>How it works:</strong> Generate signup link and send it via WhatsApp. 
                    The member will go directly to your business page after signing up!
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter member name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="relative z-10">
                <label className="block text-sm mb-2">
                  WhatsApp Number
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="w-full relative">
                    <CountrySelector
                      value={countryCode}
                      onChange={(code) => setCountryCode(code)}
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555 123 4567 or 0555 123 4567"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                {phone && (
                  <p className="text-xs text-gray-500 mt-2">
                    Will send to: <span className="font-mono text-pink-600">
                      {countryCode}{phone.replace(/\D/g, '').replace(/^0+/, '')}
                    </span>
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm mb-2">
                  Role
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRole('user')}
                    className={`flex-1 py-2.5 px-4 rounded-lg border transition-colors ${
                      role === 'user'
                        ? 'border-pink-600 bg-pink-50 text-pink-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    User
                  </button>
                  <button
                    onClick={() => setRole('admin')}
                    className={`flex-1 py-2.5 px-4 rounded-lg border transition-colors ${
                      role === 'admin'
                        ? 'border-pink-600 bg-pink-50 text-pink-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Admin
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {role === 'admin' 
                    ? 'Admins can manage users and view all data' 
                    : 'Users can only view and manage their own data'}
                </p>
              </div>

              {/* Invite Link Preview */}
              {inviteLink && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Check size={16} className="text-green-600" />
                    <p className="text-sm text-green-800">
                      Invitation link generated!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-gray-700 break-all bg-white px-2 py-1.5 rounded border border-green-200">
                      {inviteLink}
                    </code>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 hover:bg-green-100 rounded transition-colors"
                      title="Copy link"
                    >
                      {copied ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} className="text-green-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    <ExternalLink size={12} className="inline mr-1" />
                    Member will sign up and join your business automatically
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
              {inviteLink ? (
                <>
                  {/* After sending - prominent close button */}
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Close
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy Link
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Before sending - normal buttons */}
                  <button
                    onClick={resetForm}
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={sending || !phone || !name}
                    className="flex-1 px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Opening...
                      </>
                    ) : (
                      <>
                        <MessageSquare size={18} />
                        Send via WhatsApp
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}