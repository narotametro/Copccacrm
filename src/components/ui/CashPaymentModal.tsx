import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from './Button';
import { Card } from './Card';
import { toast } from 'sonner';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId?: string;
  userId?: string;
  onPaymentRecorded?: () => void;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  subscription_plans: {
    display_name: string;
    price_monthly: number;
    currency: string;
  };
  users: {
    full_name: string;
    email: string;
  };
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  userId,
  onPaymentRecorded,
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentLocation, setPaymentLocation] = useState<string>('office');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSubscriptions();
    }
  }, [isOpen, userId]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          status,
          subscription_plans (
            display_name,
            price_monthly,
            currency
          ),
          users (
            full_name,
            email
          )
        `)
        .in('status', ['trial', 'past_due']);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSubscriptions(data || []);

      // Auto-select if subscriptionId is provided
      if (subscriptionId) {
        setSelectedSubscription(subscriptionId);
        const sub = data?.find(s => s.id === subscriptionId);
        if (sub) {
          setAmount(sub.subscription_plans.price_monthly.toString());
          setCustomerName(sub.users.full_name);
        }
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubscription || !amount || !customerName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Record cash payment
      const { data, error } = await supabase
        .rpc('record_cash_payment', {
          p_subscription_id: selectedSubscription,
          p_amount: parseFloat(amount),
          p_currency: 'TZS',
          p_payment_date: new Date().toISOString(),
          p_collector_id: (await supabase.auth.getUser()).data.user?.id,
          p_notes: notes || 'Cash payment recorded via admin panel'
        });

      if (error) throw error;

      // Record additional cash payment details
      const { error: cashError } = await supabase
        .from('cash_payments')
        .insert({
          subscription_id: selectedSubscription,
          amount: parseFloat(amount),
          currency: 'TZS',
          payment_location: paymentLocation,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          receipt_number: receiptNumber || null,
          notes: notes,
          status: 'verified', // Auto-verify for admin-recorded payments
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString(),
        });

      if (cashError) {
        console.error('Error recording cash payment details:', cashError);
        // Don't throw here as the main payment was recorded
      }

      toast.success('Cash payment recorded successfully! Subscription activated.');
      onPaymentRecorded?.();
      onClose();

      // Reset form
      setSelectedSubscription('');
      setAmount('');
      setCustomerName('');
      setCustomerPhone('');
      setReceiptNumber('');
      setNotes('');
    } catch (error) {
      console.error('Error recording cash payment:', error);
      toast.error('Failed to record cash payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSub = subscriptions.find(s => s.id === selectedSubscription);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Record Cash Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subscription Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subscription
              </label>
              {loading ? (
                <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
              ) : (
                <select
                  value={selectedSubscription}
                  onChange={(e) => {
                    setSelectedSubscription(e.target.value);
                    const sub = subscriptions.find(s => s.id === e.target.value);
                    if (sub) {
                      setAmount(sub.subscription_plans.price_monthly.toString());
                      setCustomerName(sub.users.full_name);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a subscription...</option>
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.users.full_name} - {sub.subscription_plans.display_name} ({sub.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedSub && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900">Subscription Details</h3>
                <p className="text-sm text-blue-700">
                  Customer: {selectedSub.users.full_name}<br />
                  Plan: {selectedSub.subscription_plans.display_name}<br />
                  Status: {selectedSub.status}<br />
                  Expected Amount: TZS {selectedSub.subscription_plans.price_monthly.toLocaleString()}
                </p>
              </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (TZS) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Location
                </label>
                <select
                  value={paymentLocation}
                  onChange={(e) => setPaymentLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="office">Office</option>
                  <option value="branch">Branch</option>
                  <option value="online">Online</option>
                  <option value="mobile">Mobile Payment</option>
                </select>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+255..."
                />
              </div>
            </div>

            {/* Receipt Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="RCP-001"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional notes about the payment..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};