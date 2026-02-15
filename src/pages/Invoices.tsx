import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Send,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';

interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  companies?: {
    name: string;
  };
  total_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial' | 'cancelled';
  created_at: string;
}

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency: formatCurrencyFn } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'created_at' | 'total_amount'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadInvoices = useCallback(async () => {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          companies (
            name
          )
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, sortBy, sortOrder, loadInvoices]);

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} />;
      case 'overdue':
        return <AlertTriangle size={16} />;
      case 'partial':
        return <Clock size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const handleSendInvoice = async (_invoiceId: string) => {
    // Mock sending invoice
    alert('Invoice sent successfully!');
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    // Navigate to invoice detail page which has print functionality
    navigate(`/app/invoices/${invoiceId}`);
  };

  return (
    <div className="max-w-7xl mx-auto" style={{ marginLeft: '-12px', marginRight: '-12px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
            <p className="text-slate-600">Manage your customer invoices</p>
          </div>
          <Button
            icon={Plus}
            onClick={() => navigate('/app/invoices/create')}
            className="bg-primary-600 hover:bg-primary-700"
          >
            Create Invoice
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field as 'due_date' | 'created_at' | 'total_amount');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              >
                <option value="created_at_desc">Newest First</option>
                <option value="created_at_asc">Oldest First</option>
                <option value="due_date_asc">Due Date (Earliest)</option>
                <option value="due_date_desc">Due Date (Latest)</option>
                <option value="total_amount_desc">Amount (High to Low)</option>
                <option value="total_amount_asc">Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Invoice Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  // Show skeleton loading rows
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded mr-2 animate-pulse"></div>
                          <div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-1 animate-pulse"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="text-slate-400 mr-2" size={16} />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {invoice.invoice_number}
                          </div>
                          <div className="text-sm text-slate-500">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {invoice.companies?.name || 'Unknown Customer'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {formatCurrencyFn(invoice.total_amount)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {formatCurrencyFn(invoice.balance)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                      {new Date(invoice.due_date) < new Date() && invoice.balance > 0 && (
                        <div className="text-xs text-red-600 font-medium">Overdue</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/app/invoices/${invoice.id}`)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/app/invoices/${invoice.id}/edit`)}
                        >
                          <Edit size={14} />
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendInvoice(invoice.id)}
                          >
                            <Send size={14} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No invoices found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first invoice.'}
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/app/invoices/create')}>
                  <Plus className="mr-2" size={16} />
                  Create Invoice
                </Button>
              </div>
            </div>
          )}
        </Card>
    </div>
  );
};

export default Invoices;