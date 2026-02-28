/**
 * SMS Credits Component
 * Display SMS balance, usage stats, and allow top-ups
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { MessageSquare, CreditCard, AlertCircle, Zap, Check } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

interface SMSPackage {
  id: string;
  package_name: string;
  sms_count: number;
  price_usd: number;
  price_tzs: number;
  price_kes: number;
  discount_percentage: number;
  description: string;
  sort_order: number;
}

export const SMSCredits: React.FC = () => {
  const { formatCurrency, currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({
    total_sms_sent: 0,
    total_spent: 0,
    sms_last_30_days: 0,
    estimated_remaining_sms: 0,
    low_balance_warning: false
  });
  const [packages, setPackages] = useState<SMSPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SMSPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) return;

      // Get SMS usage stats (gracefully handle if function doesn't exist)
      try {
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_sms_usage_stats', { p_company_id: userData.company_id, p_days: 30 });

        if (!statsError && statsData) {
          setBalance(statsData.current_balance);
          setStats(statsData);
        }
      } catch (rpcError) {
        console.warn('SMS usage stats function not available:', rpcError);
        // Set default values when function doesn't exist
        setBalance(0);
        setStats(null);
      }

      // Get available packages (gracefully handle if table doesn't exist)
      try {
        const { data: packagesData, error: packagesError } = await supabase
          .from('sms_pricing')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (!packagesError && packagesData) {
          setPackages(packagesData);
        }
      } catch (tableError) {
        console.warn('SMS pricing table not available:', tableError);
        setPackages([]);
      }
    } catch (error) {
      console.error('Failed to load SMS credits data:', error);
      // Don't show error toast if tables/functions don't exist - this is expected during setup
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPackage = (pkg: SMSPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const getPackagePrice = (pkg: SMSPackage) => {
    switch (currency.code) {
      case 'TZS':
        return formatCurrency(pkg.price_tzs);
      case 'KES':
        return formatCurrency(pkg.price_kes);
      default:
        return formatCurrency(pkg.price_usd);
    }
  };

  const getPackagePriceValue = (pkg: SMSPackage) => {
    switch (currency.code) {
      case 'TZS':
        return pkg.price_tzs;
      case 'KES':
        return pkg.price_kes;
      default:
        return pkg.price_usd;
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">SMS Credits Balance</h2>
            <p className="text-sm text-slate-600">Centralized SMS service powered by COPCCA</p>
          </div>
          <div className="p-3 bg-primary-100 rounded-lg">
            <MessageSquare className="text-primary-600" size={24} />
          </div>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${stats.low_balance_warning ? 'bg-red-50 border border-red-200' : 'bg-primary-50 border border-primary-200'}`}>
            <p className="text-sm text-slate-600 mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(balance)}</p>
            {stats.low_balance_warning && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                Low balance - top up soon
              </p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">SMS Remaining</p>
            <p className="text-3xl font-bold text-slate-900">{stats.estimated_remaining_sms}</p>
            <p className="text-xs text-slate-500 mt-1">Approx. {formatCurrency(0.02)}/SMS</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Sent (30 days)</p>
            <p className="text-3xl font-bold text-slate-900">{stats.sms_last_30_days}</p>
            <p className="text-xs text-slate-500 mt-1">Last month</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(stats.total_spent)}</p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Zap className="text-blue-600" size={18} />
            Centralized SMS Service Benefits
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <Check className="text-green-600" size={16} />
              No Twilio account needed
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-green-600" size={16} />
              Pay-as-you-go pricing
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-green-600" size={16} />
              Instant activation
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-green-600" size={16} />
              Better bulk rates
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-green-600" size={16} />
              No setup required
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-green-600" size={16} />
              24/7 support
            </li>
          </ul>
        </div>
      </Card>

      {/* Pricing Packages */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Buy SMS Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="relative hover:shadow-lg transition-shadow">
              {pkg.discount_percentage > 0 && (
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  -{pkg.discount_percentage}%
                </div>
              )}
              
              <div className="text-center mb-4">
                <h3 className="font-semibold text-slate-900 mb-1">{pkg.package_name}</h3>
                <p className="text-3xl font-bold text-primary-600">{pkg.sms_count}</p>
                <p className="text-xs text-slate-500">SMS Messages</p>
              </div>

              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-slate-900">{getPackagePrice(pkg)}</p>
              </div>

              <p className="text-xs text-slate-600 text-center mb-4">{pkg.description}</p>

              <Button
                variant="primary"
                className="w-full"
                icon={CreditCard}
                onClick={() => handleBuyPackage(pkg)}
              >
                Buy Now
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <PaymentModal
          package={selectedPackage}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPackage(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedPackage(null);
            loadData();
            toast.success('SMS credits added successfully!');
          }}
          getPackagePrice={getPackagePrice}
        />
      )}
    </div>
  );
};

interface PaymentModalProps {
  package: SMSPackage;
  onClose: () => void;
  onSuccess: () => void;
  getPackagePrice: (pkg: SMSPackage) => string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ package: pkg, onClose, onSuccess, getPackagePrice }) => {
  const paymentMethod = 'mpesa'; // Manual M-Pesa payment only
  const [paymentToken, setPaymentToken] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!paymentToken.trim()) {
      toast.error('Please enter the M-Pesa confirmation code');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) throw new Error('Company not found');

      // Add credits with the payment reference token
      const { error } = await supabase.rpc('add_sms_credits', {
        p_company_id: userData.company_id,
        p_credits_amount: pkg.price_usd,
        p_payment_method: paymentMethod,
        p_payment_reference: paymentToken.toUpperCase(),
        p_package_id: pkg.id
      });

      if (error) throw error;

      toast.success('Payment verified! SMS credits added to your account.');
      onSuccess();
    } catch (error) {
      console.error('Payment verification failed:', error);
      toast.error('Payment verification failed. Please check your confirmation code and try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Complete Payment</h2>
            <p className="text-sm text-slate-600 mt-1">{pkg.package_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>

        {/* Package Summary */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-slate-600">SMS Credits:</span>
            <span className="font-semibold">{pkg.sms_count} SMS</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-slate-600">Amount:</span>
            <span className="font-semibold">{getPackagePrice(pkg)}</span>
          </div>
          {pkg.discount_percentage > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-semibold">-{pkg.discount_percentage}%</span>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Payment Instructions
          </label>
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Step 1: Send M-Pesa Payment</p>
              <p className="text-xs text-slate-600">Send <strong>{getPackagePrice(pkg)}</strong> to:</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-primary-300">
              <p className="text-xs text-slate-600 mb-1">M-Pesa Number</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-primary-600">0795003415</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('0795003415');
                    toast.success('Number copied!');
                  }}
                  className="px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded text-xs font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Step 2: Get Confirmation Code</p>
              <p className="text-xs text-slate-600">After sending payment, you'll receive an M-Pesa confirmation SMS with a code (e.g., RG12345678)</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Step 3: Enter Code Below</p>
              <p className="text-xs text-slate-600">Enter the confirmation code to verify your payment</p>
            </div>
          </div>
        </div>

        {/* Payment Token Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            M-Pesa Confirmation Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={paymentToken}
            onChange={(e) => setPaymentToken(e.target.value.toUpperCase())}
            placeholder="Enter M-Pesa code (e.g., RG12345678)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">This code is in your M-Pesa confirmation SMS</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handlePayment} className="flex-1" disabled={processing || !paymentToken.trim()}>
            {processing ? 'Verifying...' : 'Verify Payment'}
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          🔒 Your credits will be added immediately after verification. Contact support if you have issues.
        </p>
      </Card>
    </div>
  );
};
