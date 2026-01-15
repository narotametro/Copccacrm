import React, { useState, useEffect } from 'react';
import { Banknote, AlertTriangle, CheckCircle, Clock, Zap, Brain, Send, TrendingUp, Target, Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

type Debt = {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue' | 'reminded' | 'written_off';
  days_overdue: number;
  payment_probability: number;
  risk_score: 'low' | 'medium' | 'high';
  auto_reminder: boolean;
  companies: { name: string; contact_email: string; id?: string };
  payment_plan?: string;
};

interface Company {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  total_revenue: number;
  purchases: number;
  avg_order_value: number;
  last_purchase: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const DebtCollection: React.FC = () => {
  const { formatCurrency, convertAmount } = useCurrency();
  const [debts, setDebts] = useState<Debt[]>(() => {
    // Load debts from localStorage on initial render
    try {
      const saved = localStorage.getItem('copcca-debts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load debts from localStorage:', error);
      return [];
    }
  });
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [customers, setCustomers] = useState<Company[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Company | null>(null);
  const [debtForm, setDebtForm] = useState({
    invoice_number: '',
    amount: '',
    due_date: '',
    risk_score: 'medium' as 'low' | 'medium' | 'high',
  });

  // Load customers from localStorage
  useEffect(() => {
    const savedCustomers = localStorage.getItem('copcca-customers');
    if (savedCustomers) {
      try {
        setCustomers(JSON.parse(savedCustomers));
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    }
  }, []);

  // Save debts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('copcca-debts', JSON.stringify(debts));
    } catch (error) {
      console.error('Failed to save debts to localStorage:', error);
    }
  }, [debts]);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-blue-100 text-blue-700',
      reminded: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      written_off: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || colors.pending;
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600',
      medium: 'text-orange-600',
      high: 'text-red-600',
    };
    return colors[risk] || 'text-slate-600';
  };

  const handleAutoRemind = (_debtId: string) => {
    toast.success('AI-generated reminder sent successfully!');
  };

  const handleGeneratePaymentPlan = (_debtId: string) => {
    toast.success('Payment plan generated and sent to customer');
  };

  const handleEscalate = (_debtId: string) => {
    toast.warning('Case escalated to senior collections team');
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !debtForm.invoice_number.trim() || !debtForm.amount) {
      toast.error('Please select a customer and fill in all required fields');
      return;
    }

    const newDebt: Debt = {
      id: crypto.randomUUID(),
      invoice_number: debtForm.invoice_number.trim(),
      amount: Number(debtForm.amount),
      due_date: debtForm.due_date || new Date().toISOString().slice(0, 10),
      status: 'pending' as const,
      days_overdue: 0,
      payment_probability: 70,
      risk_score: debtForm.risk_score,
      auto_reminder: true,
      companies: {
        name: selectedCustomer.name,
        contact_email: selectedCustomer.email || '',
        id: selectedCustomer.id
      },
    };

    setDebts((prev) => [newDebt, ...prev]);
    toast.success('Debt record added successfully');

    // Reset form
    setDebtForm({
      invoice_number: '',
      amount: '',
      due_date: '',
      risk_score: 'medium',
    });
    setSelectedCustomer(null);
    setCustomerSearchTerm('');
    setShowAddDebtModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🤖 AI Debt Collection</h1>
          <p className="text-slate-600 mt-1">Automated reminders, risk scoring & payment prediction</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={automationEnabled ? "default" : "secondary"} 
            icon={Zap}
            onClick={() => {
              setAutomationEnabled(!automationEnabled);
              toast.success(automationEnabled ? 'Automation paused' : 'Automation activated');
            }}
          >
            {automationEnabled ? 'Automation ON' : 'Automation OFF'}
          </Button>
          <Button 
            variant="secondary" 
            icon={Send} 
            onClick={() => {
              toast.success('Sending reminders to all overdue customers...', {
                description: 'Emails will be sent in the next few minutes'
              });
            }}
          >
            Send All Reminders
          </Button>
          <Button 
            icon={TrendingUp} 
            onClick={() => {
              toast.success('Generating AI report...', {
                description: 'Report will be ready in a moment'
              });
            }}
          >
            AI Report
          </Button>
        </div>
      </div>

      {/* AI Automation Status */}
      {automationEnabled && (
        <Card className="bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Brain className="text-primary-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">🧠 AI Automation Active</h3>
              <p className="text-sm text-slate-600 mb-3">
                AI is monitoring all invoices 24/7 and will automatically send reminders based on payment patterns, 
                risk scores, and customer behavior.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Next Auto-Reminder</p>
                  <p className="font-semibold text-slate-900">Today at 2:00 PM</p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Reminders Sent (This Week)</p>
                  <p className="font-semibold text-slate-900">12 emails + 4 SMS</p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Auto-Collection Rate</p>
                  <p className="font-semibold text-green-600">94% success</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <Banknote className="text-primary-600 mb-2" size={24} />
          <h3 className="text-sm text-slate-600">Total Outstanding</h3>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(convertAmount(debts.filter(d => d.status !== 'paid').reduce((sum, d) => sum + d.amount, 0)))}
          </p>
        </Card>
        <Card>
          <AlertTriangle className="text-red-600 mb-2" size={24} />
          <h3 className="text-sm text-slate-600">High Risk</h3>
          <p className="text-2xl font-bold text-red-600">
            {debts.filter(d => d.risk_score === 'high').length}
          </p>
        </Card>
        <Card>
          <Clock className="text-orange-600 mb-2" size={24} />
          <h3 className="text-sm text-slate-600">Overdue</h3>
          <p className="text-2xl font-bold text-orange-600">
            {debts.filter(d => d.status === 'overdue').length}
          </p>
        </Card>
        <Card>
          <Target className="text-blue-600 mb-2" size={24} />
          <h3 className="text-sm text-slate-600">Avg Payment Probability</h3>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(debts.reduce((sum, d) => sum + d.payment_probability, 0) / debts.length)}%
          </p>
        </Card>
        <Card>
          <CheckCircle className="text-green-600 mb-2" size={24} />
          <h3 className="text-sm text-slate-600">Recovery Rate</h3>
          <p className="text-2xl font-bold text-green-600">94%</p>
        </Card>
      </div>

      {/* Add Debt Record Button */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowAddDebtModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Debt Record</span>
        </Button>
      </div>

      {/* Debts List */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Invoices & Auto-Collection</h2>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option>All Invoices</option>
              <option>High Risk Only</option>
              <option>Overdue Only</option>
              <option>Auto-Reminder Active</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-900">Company</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Invoice</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Risk Score</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Payment Prob.</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Auto-Remind</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => (
                <tr key={debt.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-900">{debt.companies?.name}</p>
                      <p className="text-xs text-slate-500">{debt.companies?.contact_email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{debt.invoice_number}</td>
                  <td className="py-3 px-4">{formatCurrency(convertAmount(debt.amount))}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p>{new Date(debt.due_date).toLocaleDateString()}</p>
                      {debt.days_overdue > 0 && (
                        <p className="text-xs text-red-600 font-medium">{debt.days_overdue} days overdue</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(debt.status)}`}>
                      {debt.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold uppercase text-xs ${getRiskColor(debt.risk_score)}`}>
                      {debt.risk_score}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${debt.payment_probability > 70 ? 'bg-green-500' : debt.payment_probability > 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                          style={{ width: `${debt.payment_probability}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{debt.payment_probability}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {debt.auto_reminder ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <Zap size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Manual</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Send}
                        onClick={() => handleAutoRemind(debt.id)}
                      >
                        Remind
                      </Button>
                      {debt.risk_score === 'high' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleGeneratePaymentPlan(debt.id)}
                          >
                            Payment Plan
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEscalate(debt.id)}
                          >
                            Escalate
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Debt Record Modal */}
      <Modal
        isOpen={showAddDebtModal}
        onClose={() => setShowAddDebtModal(false)}
        title="Add Debt Record"
      >
        <form onSubmit={handleAddDebt} className="space-y-4">
          {/* Customer Search and Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customers by name or email..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {customerSearchTerm && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-b-0 ${
                        selectedCustomer?.id === customer.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="font-medium text-slate-900">{customer.name}</div>
                      <div className="text-sm text-slate-600">{customer.email}</div>
                      <div className="text-xs text-slate-500">
                        Revenue: {formatCurrency(customer.total_revenue)} | {customer.purchases} purchases
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-slate-500 text-center">
                    No customers found. Add customers in the Customers section first.
                  </div>
                )}
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-green-900">Selected: {selectedCustomer.name}</div>
                <div className="text-sm text-green-700">{selectedCustomer.email}</div>
              </div>
            )}
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              placeholder="INV-001"
              value={debtForm.invoice_number}
              onChange={(e) => setDebtForm({ ...debtForm, invoice_number: e.target.value })}
              required
            />
            <Input
              label="Amount"
              type="number"
              placeholder="50000"
              value={debtForm.amount}
              onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={debtForm.due_date}
              onChange={(e) => setDebtForm({ ...debtForm, due_date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Risk Level</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={debtForm.risk_score}
                onChange={(e) => setDebtForm({ ...debtForm, risk_score: e.target.value as 'low' | 'medium' | 'high' })}
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddDebtModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Debt Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
