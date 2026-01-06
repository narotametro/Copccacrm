import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  CreditCard,
  Clock
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SubscriptionStatusProps {
  onClose: () => void;
}

export function SubscriptionStatus({ onClose }: SubscriptionStatusProps) {
  const { userProfile } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/subscription/status?adminEmail=${userProfile?.email}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error('Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = () => {
    if (!subscription?.subscriptionEnd) return 0;
    const endDate = new Date(subscription.subscriptionEnd);
    const today = new Date();
    const diff = endDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Subscription Status</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">
            View your COPCCA CRM subscription details
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent" />
            </div>
          ) : subscription && subscription.hasSubscription ? (
            <div className="space-y-6">
              {/* Status Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Subscription Status */}
                <div className={`p-4 rounded-lg border-2 ${
                  subscription.subscriptionStatus === 'active'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {subscription.subscriptionStatus === 'active' ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <XCircle className="text-red-600" size={20} />
                    )}
                    <span className="font-semibold text-gray-900">Subscription</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    subscription.subscriptionStatus === 'active'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {subscription.subscriptionStatus?.toUpperCase()}
                  </p>
                </div>

                {/* Payment Status */}
                <div className={`p-4 rounded-lg border-2 ${
                  subscription.paymentStatus === 'paid'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={
                      subscription.paymentStatus === 'paid' ? 'text-blue-600' : 'text-orange-600'
                    } size={20} />
                    <span className="font-semibold text-gray-900">Payment</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    subscription.paymentStatus === 'paid'
                      ? 'text-blue-600'
                      : 'text-orange-600'
                  }`}>
                    {subscription.paymentStatus?.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Days Remaining */}
              {subscription.subscriptionStatus === 'active' && (
                <div className={`p-4 rounded-lg border-2 ${
                  daysRemaining > 30
                    ? 'bg-green-50 border-green-200'
                    : daysRemaining > 7
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className={
                      daysRemaining > 30 ? 'text-green-600' :
                      daysRemaining > 7 ? 'text-yellow-600' :
                      'text-red-600'
                    } size={20} />
                    <span className="font-semibold text-gray-900">Days Remaining</span>
                  </div>
                  <p className={`text-3xl font-bold ${
                    daysRemaining > 30 ? 'text-green-600' :
                    daysRemaining > 7 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {daysRemaining} days
                  </p>
                  {daysRemaining <= 30 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {daysRemaining <= 7 ? '⚠️ Renewal required soon!' : '📅 Consider renewing soon'}
                    </p>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-gray-900 mb-3">Subscription Details</h3>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users size={16} />
                    Total Users
                  </span>
                  <span className="font-semibold text-gray-900">
                    {subscription.totalUsers}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} />
                    Start Date
                  </span>
                  <span className="font-semibold text-gray-900">
                    {new Date(subscription.subscriptionStart).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} />
                    End Date
                  </span>
                  <span className="font-semibold text-gray-900">
                    {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                  </span>
                </div>

                {subscription.lastPaymentDate && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <DollarSign size={16} />
                        Last Payment
                      </span>
                      <span className="font-semibold text-gray-900">
                        TSH {subscription.lastPaymentAmount?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Clock size={16} />
                        Payment Date
                      </span>
                      <span className="font-semibold text-gray-900">
                        {new Date(subscription.lastPaymentDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <CreditCard size={16} />
                        Payment Method
                      </span>
                      <span className="font-semibold text-gray-900 uppercase">
                        {subscription.paymentMethod || 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Warning Messages */}
              {subscription.subscriptionStatus === 'expired' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">Subscription Expired</p>
                      <p className="text-sm text-red-700">
                        Your subscription has expired. Please renew to continue using COPCCA CRM.
                        Contact support or complete payment to restore access.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {subscription.paymentStatus === 'unpaid' && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-orange-900 mb-1">Payment Pending</p>
                      <p className="text-sm text-orange-700">
                        Your payment is pending. Please complete payment to maintain access.
                        Annual cost: TSH {(30000 * 12 * subscription.totalUsers).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Need help?</strong>
                </p>
                <p className="text-xs text-blue-700">
                  For subscription or payment inquiries, contact COPCCA CRM support.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No subscription information available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
