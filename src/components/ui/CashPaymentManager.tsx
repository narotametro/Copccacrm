import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from './Button';
import { Card } from './Card';
import { CashPaymentModal } from './CashPaymentModal';
import { toast } from 'sonner';
import { Banknote, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';

interface CashPayment {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  collected_by: string;
  collected_at: string;
  payment_location: string;
  customer_name: string;
  customer_phone: string | null;
  receipt_number: string | null;
  notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  status: 'pending' | 'verified' | 'rejected';
  users_collector?: {
    full_name: string;
  };
  users_verifier?: {
    full_name: string;
  };
  user_subscriptions?: {
    subscription_plans: {
      display_name: string;
    };
    users: {
      full_name: string;
      email: string;
    };
  };
}

export const CashPaymentManager: React.FC = () => {
  const [payments, setPayments] = useState<CashPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CashPayment | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [summary, setSummary] = useState({
    total_payments: 0,
    total_amount: 0,
    verified_payments: 0,
    pending_payments: 0,
    rejected_payments: 0,
  });

  useEffect(() => {
    loadPayments();
    loadSummary();
  }, [filter]);

  const loadPayments = async () => {
    try {
      // Removed setLoading(true) - show UI immediately
      let query = supabase
        .from('cash_payments')
        .select(`
          *,
          users_collector:collected_by (
            full_name
          ),
          users_verifier:verified_by (
            full_name
          ),
          user_subscriptions!subscription_id (
            subscription_plans!plan_id (
              display_name
            ),
            users!user_id (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading cash payments:', error);
      toast.error('Failed to load cash payments');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_cash_payments_summary');

      if (error) throw error;
      setSummary(data[0] || summary);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .rpc('verify_cash_payment', {
          p_payment_id: paymentId,
          p_verifier_id: user.id,
          p_status: 'verified'
        });

      if (error) throw error;

      toast.success('Payment verified successfully!');
      loadPayments();
      loadSummary();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .rpc('verify_cash_payment', {
          p_payment_id: paymentId,
          p_verifier_id: user.id,
          p_status: 'rejected'
        });

      if (error) throw error;

      toast.success('Payment rejected');
      loadPayments();
      loadSummary();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-yellow-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Payment Management</h1>
          <p className="text-gray-600">Record and manage cash payments for subscriptions</p>
        </div>
        <Button onClick={() => setShowPaymentModal(true)}>
          <Plus size={16} className="mr-2" />
          Record Cash Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Banknote className="text-blue-500" size={24} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                TZS {summary.total_amount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <CheckCircle className="text-green-500" size={24} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{summary.verified_payments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="text-yellow-500" size={24} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{summary.pending_payments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <XCircle className="text-red-500" size={24} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{summary.rejected_payments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === status
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collected By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="animate-pulse">Loading...</div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No cash payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.user_subscriptions?.users?.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {payment.user_subscriptions?.subscription_plans?.display_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        TZS {payment.amount.toLocaleString()}
                      </div>
                      {payment.receipt_number && (
                        <div className="text-xs text-gray-500">
                          Receipt: {payment.receipt_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">{payment.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.users_collector?.full_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {payment.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifyPayment(payment.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectPayment(payment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {payment.status === 'verified' && (
                        <span className="text-green-600">Verified</span>
                      )}
                      {payment.status === 'rejected' && (
                        <span className="text-red-600">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cash Payment Modal */}
      <CashPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentRecorded={() => {
          loadPayments();
          loadSummary();
        }}
      />
    </div>
  );
};