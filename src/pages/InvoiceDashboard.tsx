import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Banknote,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Users,
  Brain,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';
import { Database } from '@/lib/types/database';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

interface InvoiceStats {
  totalInvoiced: number;
  totalCollected: number;
  outstanding: number;
  overdue: number;
  avgPaymentDays: number;
  highRiskCustomers: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial' | 'cancelled';
  created_at: string;
}

const InvoiceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency: formatCurrencyFn } = useCurrency();
  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoiced: 0,
    totalCollected: 0,
    outstanding: 0,
    overdue: 0,
    avgPaymentDays: 0,
    highRiskCustomers: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load invoice statistics
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Calculate stats
      const totalInvoiced = invoices?.reduce((sum: number, inv: InvoiceRow) => sum + inv.total_amount, 0) || 0;
      const totalCollected = invoices?.reduce((sum: number, inv: InvoiceRow) => sum + inv.paid_amount, 0) || 0;
      const outstanding = totalInvoiced - totalCollected;
      const overdue = invoices?.filter((inv: InvoiceRow) =>
        new Date(inv.due_date) < new Date() && inv.balance > 0
      ).reduce((sum: number, inv: InvoiceRow) => sum + inv.balance, 0) || 0;

      // Calculate average payment days
      const paidInvoices = invoices?.filter((inv: InvoiceRow) => inv.status === 'paid') || [];
      const avgPaymentDays = paidInvoices.length > 0
        ? paidInvoices.reduce((sum: number, inv: InvoiceRow) => {
            const issueDate = new Date(inv.created_at);
            const payDate = new Date(inv.created_at); // Simplified - would need payment date
            return sum + Math.ceil((payDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / paidInvoices.length
        : 0;

      setStats({
        totalInvoiced,
        totalCollected,
        outstanding,
        overdue,
        avgPaymentDays: Math.round(avgPaymentDays),
        highRiskCustomers: 3, // Mock data - would be calculated by AI
      });

      setRecentInvoices(invoices || []);

      // Mock AI insights
      setAiInsights([
        "WARNING: 4 customers likely to delay payment this week",
        "Sending reminder today may recover ₦3.2M",
        "Stop credit for 2 customers (high risk)",
        "Collections up 18%, outstanding down 6%",
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Invoiced',
      value: formatCurrencyFn(stats.totalInvoiced),
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Collected',
      value: formatCurrencyFn(stats.totalCollected),
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Outstanding',
      value: formatCurrencyFn(stats.outstanding),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Overdue',
      value: formatCurrencyFn(stats.overdue),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Avg Payment Days',
      value: `${stats.avgPaymentDays} days`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'High-Risk Customers',
      value: stats.highRiskCustomers.toString(),
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoice Dashboard</h1>
            <p className="text-slate-600 mt-1">Track your sales-to-cash performance</p>
          </div>
          <div className="flex gap-3">
            <Button
              icon={Plus}
              onClick={() => navigate('/app/invoices/create')}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Create Invoice
            </Button>
            <Button
              variant="outline"
              icon={BarChart3}
              onClick={() => navigate('/app/invoices/analytics')}
            >
              View Analytics
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {loading ? (
            // Show skeleton loading cards
            [1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            statCards.map((card, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="text-xl font-bold text-slate-900">{card.value}</p>
                </div>
              </div>
            </Card>
          ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Flow Chart */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invoice Flow</h3>
              <select className="text-sm border rounded px-2 py-1">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Invoiced</span>
                </div>
                <span className="font-bold text-green-700">{formatCurrencyFn(stats.totalInvoiced)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Paid</span>
                </div>
                <span className="font-bold text-blue-700">{formatCurrencyFn(stats.totalCollected)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-medium">Outstanding</span>
                </div>
                <span className="font-bold text-orange-700">{formatCurrencyFn(stats.outstanding)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium">Overdue</span>
                </div>
                <span className="font-bold text-red-700">{formatCurrencyFn(stats.overdue)}</span>
              </div>
            </div>
          </Card>

          {/* AI Insights Panel */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Brain className="text-primary-600" size={24} />
              <h3 className="text-lg font-semibold">AI Money Insights</h3>
            </div>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg text-sm">
                  {insight}
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View Recommended Actions
            </Button>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Invoices</h3>
            <Button variant="ghost" onClick={() => navigate('/app/invoices')}>
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentInvoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/app/invoices/${invoice.id}`)}
              >
                <div>
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <p className="text-sm text-slate-600">
                    Due: {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrencyFn(invoice.total_amount)}</p>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceDashboard;