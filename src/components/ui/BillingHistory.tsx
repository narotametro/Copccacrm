import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Receipt,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getBillingHistory, getCurrentUsage, getUserSubscription } from '@/lib/subscription';
import { toast } from 'sonner';

interface PaymentRecord {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_id: string | null;
  invoice_url: string | null;
  created_at: string;
  description?: string;
}

export const BillingHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [usage, setUsage] = useState<Record<string, { current: number; limit: number; percentage: number }>>({});
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [billingHistory, currentUsage, userSubscription] = await Promise.all([
        getBillingHistory(),
        getCurrentUsage(),
        getUserSubscription(),
      ]);

      setPayments(billingHistory);
      setUsage(currentUsage);
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const downloadInvoice = async (invoiceUrl: string) => {
    try {
      window.open(invoiceUrl, '_blank');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan & Usage */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Current Plan & Usage</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Plan:</span>
            <span className="font-medium text-slate-900">{subscription?.plan.display_name || 'Free Trial'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(usage).map(([key, data]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 capitalize">{key}</span>
                <span className="text-sm font-medium text-slate-900">
                  {data.current}/{data.limit}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    data.percentage > 90 ? 'bg-red-500' :
                    data.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(data.percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {data.percentage.toFixed(1)}% used
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Billing History</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBillingData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No billing history available</p>
            <p className="text-sm text-slate-500 mt-1">
              Your payment history will appear here once you make payments
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      TZS {payment.amount.toLocaleString()} {payment.currency.toUpperCase()}
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(payment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.payment_method} {payment.transaction_id && `• ${payment.transaction_id}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                  {payment.invoice_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoice(payment.invoice_url!)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Invoice
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Paid</p>
              <p className="text-xl font-bold text-slate-900">
                TZS {payments
                  .filter(p => p.status === 'completed')
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Last Payment</p>
              <p className="text-xl font-bold text-slate-900">
                {payments.length > 0
                  ? new Date(payments[0].created_at).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Payment Count</p>
              <p className="text-xl font-bold text-slate-900">
                {payments.filter(p => p.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};