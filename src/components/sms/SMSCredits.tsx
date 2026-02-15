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

      // Get SMS usage stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_sms_usage_stats', { p_company_id: userData.company_id, p_days: 30 });

      if (!statsError && statsData) {
        setBalance(statsData.current_balance);
        setStats(statsData);
      }

      // Get available packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('sms_pricing')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!packagesError && packagesData) {
        setPackages(packagesData);
      }
    } catch (error) {
      console.error('Failed to load SMS credits data:', error);
      toast.error('Failed to load SMS credits');
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
                <p className="text-xs text-slate-500 mt-1">${(getPackagePriceValue(pkg) / pkg.sms_count).toFixed(4)}/SMS</p>
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
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'bank_transfer'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, integrate with:
      // - M-Pesa API (for Tanzania/Kenya)
      // - Stripe/PayPal (for cards)
      // - Bank transfer verification

      // For now, just add credits (demo mode)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) throw new Error('Company not found');

      // Add credits
      const { error } = await supabase.rpc('add_sms_credits', {
        p_company_id: userData.company_id,
        p_credits_amount: pkg.price_usd,
        p_payment_method: paymentMethod,
        p_payment_reference: `PAY-${Date.now()}`,
        p_package_id: pkg.id
      });

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
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
            Payment Method
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod('mpesa')}
              className={`w-full p-3 border-2 rounded-lg text-left ${
                paymentMethod === 'mpesa' ? 'border-primary-500 bg-primary-50' : 'border-slate-200'
              }`}
            >
              <div className="font-semibold">M-Pesa</div>
              <div className="text-xs text-slate-500">Pay via M-Pesa mobile money</div>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full p-3 border-2 rounded-lg text-left ${
                paymentMethod === 'card' ? 'border-primary-500 bg-primary-50' : 'border-slate-200'
              }`}
            >
              <div className="font-semibold">Credit/Debit Card</div>
              <div className="text-xs text-slate-500">Pay with Visa, Mastercard</div>
            </button>
            <button
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`w-full p-3 border-2 rounded-lg text-left ${
                paymentMethod === 'bank_transfer' ? 'border-primary-500 bg-primary-50' : 'border-slate-200'
              }`}
            >
              <div className="font-semibold">Bank Transfer</div>
              <div className="text-xs text-slate-500">Direct bank transfer</div>
            </button>
          </div>
        </div>

        {/* M-Pesa Phone Number */}
        {paymentMethod === 'mpesa' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+255 XXX XXX XXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-slate-500 mt-1">Enter your M-Pesa number to receive STK push</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handlePayment} className="flex-1" disabled={processing}>
            {processing ? 'Processing...' : `Pay ${getPackagePrice(pkg)}`}
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          🔒 Secure payment powered by COPCCA. Your credits will be added instantly.
        </p>
      </Card>
    </div>
  );
};
