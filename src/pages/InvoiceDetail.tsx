import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Download,
  Send,
  Printer,
  FileText,
  Building,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import PrintableInvoice from '@/components/PrintableInvoice';

interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  companies?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  total_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial' | 'cancelled';
  created_at: string;
  notes?: string;
  payment_terms?: string;
  items?: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency: formatCurrencyFn } = useCurrency();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [showPrintable, setShowPrintable] = useState(false);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          companies (
            name,
            email,
            phone,
            address
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setInvoice(data);

      // Load invoice items if they exist
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true });

      if (!itemsError && itemsData) {
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id, loadInvoice]);

  // Reset printable view after printing
  useEffect(() => {
    const handleAfterPrint = () => {
      setShowPrintable(false);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrint = () => {
    setShowPrintable(true);
    // Use setTimeout to ensure the component renders before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownload = () => {
    // For now, just trigger print. In a real app, this would generate a PDF
    handlePrint();
  };

  const handleSend = async () => {
    if (!invoice) return;

    try {
      // Update status to sent
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id);

      if (error) throw error;

      toast.success('Invoice sent successfully!');
      setInvoice({ ...invoice, status: 'sent' });
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-medium text-slate-900">Invoice not found</h3>
        <p className="mt-1 text-sm text-slate-500">The invoice you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Button onClick={() => navigate('/app/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  if (showPrintable && invoice) {
    return <PrintableInvoice invoice={invoice} items={items} />;
  }

  return (
    <div className="max-w-4xl mx-auto" style={{ marginLeft: '-12px', marginRight: '-12px' }}>
      {/* Header - Hidden in print */}
      <div className="no-print flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/app/invoices')}
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{invoice.invoice_number}</h1>
            <p className="text-slate-600">Invoice details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
          <Button
            variant="outline"
            onClick={handlePrint}
            icon={Printer}
          >
            Print
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            icon={Download}
          >
            Download
          </Button>
          {invoice.status === 'draft' && (
            <Button
              onClick={handleSend}
              icon={Send}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Send Invoice
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/app/invoices/${invoice.id}/edit`)}
            icon={Edit}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div id="invoice-print-area" className="space-y-6">
        {/* Invoice Header */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">INVOICE</h2>
              <p className="text-slate-600">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Date Issued</p>
              <p className="font-medium">{new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Company and Billing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Building size={16} />
                Bill To
              </h3>
              <div className="text-sm">
                <p className="font-medium">{invoice.companies?.name}</p>
                {invoice.companies?.email && <p>{invoice.companies.email}</p>}
                {invoice.companies?.phone && <p>{invoice.companies.phone}</p>}
                {invoice.companies?.address && <p>{invoice.companies.address}</p>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <User size={16} />
                Invoice Details
              </h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Terms:</span>
                  <span className="font-medium">{invoice.payment_terms || 'Net 30'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Invoice Items */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Discount</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length > 0 ? items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrencyFn(item.unit_price)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrencyFn(item.discount)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrencyFn(item.line_total)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No items found for this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Invoice Summary */}
        <Card className="p-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrencyFn(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Paid Amount:</span>
                <span>{formatCurrencyFn(invoice.paid_amount || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Balance Due:</span>
                <span>{formatCurrencyFn(invoice.balance)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
            <p className="text-sm text-slate-600">{invoice.notes}</p>
          </Card>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
          }

          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            background: #fff !important;
          }

          * {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .no-print {
            display: none !important;
          }

          /* Invoice specific print styles */
          #invoice-print-area h1 {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10pt;
          }

          #invoice-print-area h2 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 8pt;
          }

          #invoice-print-area h3 {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 6pt;
          }

          #invoice-print-area .card {
            border: 1pt solid #e2e8f0;
            border-radius: 0;
            box-shadow: none;
            margin-bottom: 15pt;
          }

          #invoice-print-area .card .p-6 {
            padding: 10pt;
          }

          #invoice-print-area table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10pt;
          }

          #invoice-print-area table th,
          #invoice-print-area table td {
            border: 1pt solid #e2e8f0;
            padding: 6pt 8pt;
            text-align: left;
            font-size: 10pt;
          }

          #invoice-print-area table th {
            background-color: #f8fafc !important;
            font-weight: bold;
          }

          #invoice-print-area .text-right {
            text-align: right;
          }

          #invoice-print-area .font-bold {
            font-weight: bold;
          }

          #invoice-print-area .font-semibold {
            font-weight: bold;
          }

          /* Summary section */
          #invoice-print-area .flex.justify-end .w-64 {
            width: 150pt;
            margin-left: auto;
          }

          #invoice-print-area .flex.justify-between {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4pt;
          }

          /* Hide buttons and interactive elements */
          #invoice-print-area button,
          #invoice-print-area .no-print {
            display: none !important;
          }

          /* Ensure proper page breaks */
          #invoice-print-area .card {
            page-break-inside: avoid;
          }

          #invoice-print-area table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceDetail;