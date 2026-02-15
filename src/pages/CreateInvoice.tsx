import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
  User,
  Building,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  industry?: string;
  website?: string;
  status?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formatCurrency: formatCurrencyFn } = useCurrency();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  // Invoice data with localStorage persistence
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('net_30');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      line_total: 0,
    },
  ]);

  // Load invoice data from localStorage on component mount
  useEffect(() => {
    const savedInvoiceData = localStorage.getItem('copcca-invoice-draft');
    if (savedInvoiceData) {
      try {
        const parsedData = JSON.parse(savedInvoiceData);
        setSelectedCompany(parsedData.selectedCompany || '');
        setDueDate(parsedData.dueDate || '');
        setPaymentTerms(parsedData.paymentTerms || 'net_30');
        setNotes(parsedData.notes || '');
        setItems(parsedData.items || [{
          id: '1',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount: 0,
          line_total: 0,
        }]);
      } catch (error) {
        console.error('Error loading saved invoice data:', error);
      }
    }
  }, []);

  // Save invoice data to localStorage whenever it changes
  useEffect(() => {
    const invoiceData = {
      selectedCompany,
      dueDate,
      paymentTerms,
      notes,
      items,
    };
    localStorage.setItem('copcca-invoice-draft', JSON.stringify(invoiceData));
  }, [selectedCompany, dueDate, paymentTerms, notes, items]);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    // Set selected company if we have a company name from navigation state
    if (location.state?.selectedCompanyName && companies.length > 0) {
      const matchingCompany = companies.find(c => c.name === location.state.selectedCompanyName);
      if (matchingCompany) {
        setSelectedCompany(matchingCompany.id);
      }
    }
  }, [companies, location.state]);

  const loadCompanies = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // Load companies for invoice customers
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, email, phone, industry, status')
        .eq('status', 'active')
        .eq('created_by', userData.user.id)
        .order('name');

      if (error) throw error;
      
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      line_total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };

        // Recalculate line total
        if (field === 'quantity' || field === 'unit_price' || field === 'discount') {
          updated.line_total = (updated.quantity * updated.unit_price) - updated.discount;
        }

        return updated;
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.line_total, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    // Add tax calculation here if needed
    return subtotal;
  };

  const clearDraft = () => {
    setSelectedCompany('');
    setDueDate('');
    setPaymentTerms('net_30');
    setNotes('');
    setItems([{
      id: '1',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      line_total: 0,
    }]);
    localStorage.removeItem('copcca-invoice-draft');
    toast.success('Draft cleared');
  };

  const calculateRiskAssessment = () => {
    const totalAmount = calculateTotal();
    const selectedCompanyData = companies.find(c => c.id === selectedCompany);
    
    // Risk factors
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    let expectedDelay = '1-3 days';
    let recommendation = 'Standard payment terms are acceptable';
    let riskScore = 0;

    // Amount-based risk scoring
    if (totalAmount > 100000) {
      riskScore += 40;
      expectedDelay = '30-60 days';
    } else if (totalAmount > 50000) {
      riskScore += 25;
      expectedDelay = '15-30 days';
    } else if (totalAmount > 25000) {
      riskScore += 15;
      expectedDelay = '7-14 days';
    } else if (totalAmount > 10000) {
      riskScore += 8;
      expectedDelay = '5-7 days';
    } else {
      riskScore += 2;
      expectedDelay = '1-3 days';
    }

    // Payment terms adjustment
    if (paymentTerms === 'net_60') {
      riskScore += 20;
      expectedDelay = riskScore > 30 ? '45-60 days' : '20-30 days';
    } else if (paymentTerms === 'net_45') {
      riskScore += 10;
      expectedDelay = riskScore > 30 ? '25-45 days' : '10-20 days';
    } else if (paymentTerms === 'net_15') {
      riskScore -= 5; // Shorter terms reduce risk
      expectedDelay = '1-5 days';
    } else if (paymentTerms === 'due_on_receipt') {
      riskScore -= 10; // Immediate payment reduces risk significantly
      expectedDelay = 'Immediate';
    }

    // Customer selection factor
    if (!selectedCompanyData) {
      riskScore += 15;
      recommendation = 'Please select a customer to get accurate risk assessment';
    }

    // Determine final risk level based on score
    if (riskScore >= 35) {
      riskLevel = 'High';
      recommendation = 'High risk - consider requiring full prepayment or declining';
    } else if (riskScore >= 20) {
      riskLevel = 'Medium';
      recommendation = 'Request partial prepayment (30-50%) or shorten payment terms';
    } else {
      riskLevel = 'Low';
      recommendation = 'Low risk - standard payment terms acceptable';
    }

    // Special cases
    if (totalAmount > 50000 && paymentTerms === 'net_60') {
      riskLevel = 'High';
      recommendation = 'Critical risk - large amount with long payment terms. Require prepayment.';
    }

    return {
      riskLevel,
      expectedDelay,
      recommendation,
      totalAmount,
      riskScore
    };
  };

  const handleSaveAsDraft = async () => {
    await saveInvoice('draft');
  };

  const handleSendInvoice = async () => {
    await saveInvoice('sent');
  };

  const saveInvoice = async (status: 'draft' | 'sent') => {
    if (!selectedCompany || !dueDate || items.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate that all items have required fields
    const invalidItems = items.filter(item => !item.description || item.quantity <= 0 || item.unit_price < 0);
    if (invalidItems.length > 0) {
      toast.error('Please fill in all item details (description, valid quantity, and unit price)');
      return;
    }

    // Removed setLoading(true) - keep UI responsive during save
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Authentication required');
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          company_id: selectedCompany, // Use selected company ID
          status,
          total_amount: calculateTotal(),
          due_date: dueDate,
          payment_terms: paymentTerms,
          notes: notes || null,
          created_by: userData.user.id,
          assigned_to: userData.user.id, // Assign to current user by default
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message || 'Unknown database error'}`);
      }

      // Create invoice items
      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax_rate: 0, // Default tax rate
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Invoice items creation error:', itemsError);
        throw new Error(`Failed to create invoice items: ${itemsError.message || 'Unknown database error'}`);
      }

      toast.success(status === 'draft' ? 'Invoice saved as draft' : 'Invoice sent successfully');
      
      // Clear saved draft data after successful save
      localStorage.removeItem('copcca-invoice-draft');
      
      navigate('/app/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save invoice: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  return (
    <div className="max-w-6xl mx-auto" style={{ marginLeft: '-12px', marginRight: '-12px' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/app/invoices')}
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Invoices
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create Invoice</h1>
              <p className="text-slate-600">Create a new invoice for your customer</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearDraft}
              disabled={loading}
            >
              Clear Draft
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={loading}
            >
              <Save className="mr-2" size={16} />
              Save as Draft
            </Button>
            <Button
              onClick={handleSendInvoice}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Send className="mr-2" size={16} />
              Send Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Selection */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="text-slate-600" size={20} />
                Customer Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Customer *
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                    required
                  >
                    <option value="">Choose a customer...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} {company.industry ? `(${company.industry})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCompanyData && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="text-slate-600" size={16} />
                      <span className="font-medium">{selectedCompanyData.name}</span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      {selectedCompanyData.email && (
                        <div>Email: {selectedCompanyData.email}</div>
                      )}
                      {selectedCompanyData.phone && (
                        <div>Phone: {selectedCompanyData.phone}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Invoice Items */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="text-slate-600" size={20} />
                  Invoice Items
                </h3>
                <Button size="sm" onClick={addItem}>
                  <Plus size={16} />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Description *
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                          className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Unit Price *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price || ''}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                          required
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Line Total
                          </label>
                          <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm font-medium">
                            {formatCurrencyFn(item.line_total)}
                          </div>
                        </div>
                        {items.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Terms & Notes */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Payment & Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  >
                    <option value="net_15">Net 15 days</option>
                    <option value="net_30">Net 30 days</option>
                    <option value="net_45">Net 45 days</option>
                    <option value="net_60">Net 60 days</option>
                    <option value="due_on_receipt">Due on receipt</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or terms..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>
            </Card>
          </div>

          {/* Invoice Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="text-slate-600" size={20} />
                Invoice Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">{formatCurrencyFn(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax (0%)</span>
                  <span className="font-medium">{formatCurrencyFn(0)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrencyFn(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Risk Preview */}
            <Card className="border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold mb-4">AI Risk Preview</h3>
              <div className="space-y-3">
                {(() => {
                  const risk = calculateRiskAssessment();
                  const riskStyles = {
                    Low: {
                      bg: 'bg-green-50',
                      border: 'border-green-200',
                      text: 'text-green-800',
                      textSecondary: 'text-green-700',
                      textMuted: 'text-green-600'
                    },
                    Medium: {
                      bg: 'bg-orange-50',
                      border: 'border-orange-200',
                      text: 'text-orange-800',
                      textSecondary: 'text-orange-700',
                      textMuted: 'text-orange-600'
                    },
                    High: {
                      bg: 'bg-red-50',
                      border: 'border-red-200',
                      text: 'text-red-800',
                      textSecondary: 'text-red-700',
                      textMuted: 'text-red-600'
                    }
                  };
                  
                  const style = riskStyles[risk.riskLevel as keyof typeof riskStyles];
                  
                  return (
                    <>
                      <div className={`${style.bg} p-3 rounded-lg border ${style.border}`}>
                        <div className={`text-sm font-medium ${style.text} mb-1`}>
                          Payment Risk: {risk.riskLevel}
                        </div>
                        <div className={`text-xs ${style.textSecondary}`}>
                          Expected delay: {risk.expectedDelay}
                        </div>
                        <div className={`text-xs ${style.textSecondary} mt-1`}>
                          Invoice Amount: {formatCurrencyFn(risk.totalAmount)}
                        </div>
                        <div className={`text-xs ${style.textMuted} mt-1 font-mono`}>
                          Risk Score: {risk.riskScore}/100
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                        <strong>Recommendation:</strong> {risk.recommendation}
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;