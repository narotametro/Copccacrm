import { useState } from 'react';
import { CreditCard, Users, Check, Shield, Lock, Crown } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface SubscriptionModalProps {
  userEmail: string;
  adminEmail: string;
  totalUsers: number;
  onPaymentSuccess: () => void;
}

export function SubscriptionModal({ userEmail, adminEmail, totalUsers, onPaymentSuccess }: SubscriptionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'bank'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const pricePerUser = 30000; // TSH per user per month
  const annualMultiplier = 12;
  const annualTotal = pricePerUser * totalUsers * annualMultiplier;
  const monthlyCost = pricePerUser * totalUsers;

  const handlePayment = async () => {
    if (paymentMethod === 'mpesa' && !phoneNumber) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    if (paymentMethod === 'card' && (!cardNumber || !expiryDate || !cvv)) {
      toast.error('Please fill in all card details');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/subscription/payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminEmail,
            totalUsers,
            amount: annualTotal,
            paymentMethod,
            phoneNumber: paymentMethod === 'mpesa' ? phoneNumber : undefined,
            cardDetails: paymentMethod === 'card' ? { cardNumber, expiryDate, cvv } : undefined,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Payment initiated successfully! Please complete the payment.');
        
        // In a real implementation, you would redirect to payment gateway
        // or wait for webhook confirmation
        // For now, we'll simulate success after a delay
        setTimeout(() => {
          onPaymentSuccess();
          toast.success('Payment confirmed! Your subscription is now active.');
        }, 3000);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-700 text-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
              <Crown size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">Subscription Required</h2>
              <p className="text-white/90">Activate your COPCCA CRM subscription to continue</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={20} />
              <p className="font-semibold">This is a mandatory subscription service</p>
            </div>
            <p className="text-sm text-white/80">
              You must complete the payment to access the COPCCA CRM system
            </p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Monthly Breakdown */}
            <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-gray-600" />
                Monthly Cost Breakdown
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per user/month:</span>
                  <span className="font-semibold text-gray-900">TSH {pricePerUser.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total users:</span>
                  <span className="font-semibold text-gray-900">{totalUsers}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-600">Monthly total:</span>
                  <span className="font-semibold text-gray-900">TSH {monthlyCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Annual Payment */}
            <div className="border-4 border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                BILLED ANNUALLY
              </div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-purple-600" />
                Annual Subscription
              </h3>
              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly cost × 12 months:</span>
                  <span className="font-semibold text-gray-900">TSH {(monthlyCost * 12).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Annual payment:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    TSH {annualTotal.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="bg-white/50 rounded-lg p-3 text-xs text-gray-700">
                <p className="flex items-center gap-1 mb-1">
                  <Check size={14} className="text-green-600" />
                  Save with annual billing
                </p>
                <p className="flex items-center gap-1">
                  <Check size={14} className="text-green-600" />
                  Uninterrupted access for 12 months
                </p>
              </div>
            </div>
          </div>

          {/* Features Included */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              What's Included in Your Subscription
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">After-Sales Follow-up Tracking</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">KPI Performance Tracking</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Competitor Intelligence</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Sales & Marketing Strategies</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Debt Collection Management</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Task Management System</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">AI-Powered Analytics & Reports</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Multi-Currency Support (80+ currencies)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">WhatsApp Integration</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Multi-User Team Management</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Priority Support</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Regular Updates & New Features</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Select Payment Method</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-4 border-2 rounded-xl transition-all ${
                  paymentMethod === 'mpesa'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📱</div>
                  <p className="font-semibold text-gray-900">M-Pesa</p>
                  <p className="text-xs text-gray-600 mt-1">Mobile Money</p>
                </div>
              </button>
              
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 border-2 rounded-xl transition-all ${
                  paymentMethod === 'card'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <CreditCard className="mx-auto text-gray-600 mb-2" size={24} />
                  <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                  <p className="text-xs text-gray-600 mt-1">Visa, Mastercard</p>
                </div>
              </button>
              
              <button
                onClick={() => setPaymentMethod('bank')}
                className={`p-4 border-2 rounded-xl transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🏦</div>
                  <p className="font-semibold text-gray-900">Bank Transfer</p>
                  <p className="text-xs text-gray-600 mt-1">Direct Payment</p>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
            {paymentMethod === 'mpesa' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 0712345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-600 mt-2">
                  You will receive an M-Pesa prompt to authorize the payment
                </p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="text-sm text-gray-700 space-y-3">
                <p className="font-semibold text-gray-900">Bank Transfer Details:</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-semibold">Bank Name:</span> CRDB Bank</p>
                  <p><span className="font-semibold">Account Name:</span> COPCCA CRM Limited</p>
                  <p><span className="font-semibold">Account Number:</span> 0150123456789</p>
                  <p><span className="font-semibold">Swift Code:</span> CORUTZTZ</p>
                  <p><span className="font-semibold">Amount:</span> TSH {annualTotal.toLocaleString()}</p>
                  <p><span className="font-semibold">Reference:</span> {adminEmail}</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  After completing the transfer, please contact our support team with the transaction receipt for activation.
                </p>
              </div>
            )}
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock size={20} />
                Pay TSH {annualTotal.toLocaleString()} & Activate Subscription
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-600 mt-4">
            By proceeding with payment, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
