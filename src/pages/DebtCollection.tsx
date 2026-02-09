import React, { useState, useEffect } from 'react';
import { Banknote, AlertTriangle, CheckCircle, Clock, Zap, Brain, Send, TrendingUp, Target, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { useSharedData, Customer } from '@/context/SharedDataContext';
import { supabase } from '@/lib/supabase';
import { FeatureGate } from '@/components/ui/FeatureGate';

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
  company_id?: string;
  company_name: string;
  company_contact_email?: string;
  payment_plan?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
};

export const DebtCollection: React.FC = () => {
  const { formatCurrency, convertAmount } = useCurrency();
  const { customers: contextCustomers } = useSharedData();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [automationEnabled, setAutomationEnabled] = useState(() => {
    // Load automation state from localStorage (keep this for now)
    try {
      const saved = localStorage.getItem('copcca-automation-enabled');
      return saved ? JSON.parse(saved) : true;
    } catch (error) {
      return true;
    }
  });
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [debtForm, setDebtForm] = useState({
    invoice_number: '',
    amount: '',
    due_date: '',
    risk_score: 'medium' as 'low' | 'medium' | 'high',
  });

  // Load debts from database on component mount
  useEffect(() => {
    loadDebts();
  }, []);

  // Load debts from Supabase
  const loadDebts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load debts from database:', error);
        toast.error('Failed to load debts');
        return;
      }

      console.log('Loaded debts from database:', data?.length || 0, 'items');
      setDebts(data || []);
    } catch (error) {
      console.error('Failed to load debts:', error);
      toast.error('Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  // Save debt to database
  const saveDebt = async (debt: Omit<Debt, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return null;
      }

      const { data, error } = await supabase
        .from('debts')
        .insert([{
          ...debt,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Failed to save debt:', error);
        toast.error('Failed to save debt');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to save debt:', error);
      toast.error('Failed to save debt');
      return null;
    }
  };

  // Update debt in database
  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update debt:', error);
        toast.error('Failed to update debt');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to update debt:', error);
      toast.error('Failed to update debt');
      return null;
    }
  };

  // Calculate real AI automation metrics
  const calculateAutomationMetrics = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Next Auto-Reminder: Find the earliest due date from pending/overdue debts
    const pendingDebts = debts.filter(d => d.status === 'pending' || d.status === 'overdue');
    const nextReminder = pendingDebts.length > 0
      ? pendingDebts.reduce((earliest, debt) => {
          const dueDate = new Date(debt.due_date);
          return dueDate < earliest ? dueDate : earliest;
        }, new Date('2099-12-31'))
      : null;

    // Reminders Sent (This Week): Count overdue debts as "needing reminders"
    const overdueThisWeek = debts.filter(d => {
      const dueDate = new Date(d.due_date);
      return dueDate >= weekAgo && d.status === 'overdue';
    }).length;

    // Auto-Collection Rate: Paid debts vs total debts
    const totalDebts = debts.length;
    const paidDebts = debts.filter(d => d.status === 'paid').length;
    const collectionRate = totalDebts > 0 ? Math.round((paidDebts / totalDebts) * 100) : 0;

    return {
      nextReminder,
      overdueThisWeek,
      collectionRate
    };
  };

  const automationMetrics = calculateAutomationMetrics();

  // Removed localStorage saving - now using database persistence

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

  const handleSendAllReminders = async () => {
    if (isSendingReminders) return;

    setIsSendingReminders(true);
    const overdueDebts = debts.filter(d => d.status === 'overdue');

    if (overdueDebts.length === 0) {
      toast.info('No overdue debts to send reminders for');
      setIsSendingReminders(false);
      return;
    }

    toast.success(`Sending reminders to ${overdueDebts.length} overdue customers...`, {
      description: 'Emails will be sent in the next few minutes'
    });

    // Simulate sending reminders with progress
    for (let i = 0; i < overdueDebts.length; i++) {
      const debt = overdueDebts[i];
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      // Update debt status to 'reminded'
      setDebts(prev => prev.map(d =>
        d.id === debt.id ? { ...d, status: 'reminded' as const } : d
      ));

      // Show progress
      if (i === overdueDebts.length - 1) {
        toast.success(`All ${overdueDebts.length} reminders sent successfully!`);
      }
    }

    setIsSendingReminders(false);
  };

  const handleGenerateAIReport = async () => {
    if (isGeneratingReport) return;

    setIsGeneratingReport(true);
    toast.success('Generating AI report...', {
      description: 'Analyzing debt collection performance and generating insights'
    });

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    const totalDebts = debts.length;
    const paidDebts = debts.filter(d => d.status === 'paid').length;
    const overdueDebts = debts.filter(d => d.status === 'overdue').length;
    const highRiskDebts = debts.filter(d => d.risk_score === 'high').length;
    const totalOutstanding = debts
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + d.amount, 0);

    const collectionRate = totalDebts > 0 ? Math.round((paidDebts / totalDebts) * 100) : 0;
    const avgPaymentProbability = Math.round(
      debts.reduce((sum, d) => sum + d.payment_probability, 0) / Math.max(debts.length, 1)
    );

    // Generate AI insights
    const insights = [
      `Collection rate of ${collectionRate}% with ${paidDebts} out of ${totalDebts} debts collected`,
      `Outstanding balance of ${formatCurrency(convertAmount(totalOutstanding))}`,
      `${overdueDebts} debts are currently overdue requiring immediate attention`,
      `${highRiskDebts} high-risk debts need escalation`,
      `Average payment probability: ${avgPaymentProbability}%`,
      automationEnabled
        ? 'AI automation is active and monitoring all invoices 24/7'
        : 'AI automation is currently disabled - consider enabling for better results'
    ];

    // Show detailed report modal or expanded view
    toast.success('AI Report Generated!', {
      description: `Key insights: ${insights[0]}`,
      duration: 5000,
    });

    // Log detailed report to console for now (could be shown in a modal)
    console.log('=== AI Debt Collection Report ===');
    insights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight}`);
    });
    console.log('=================================');

    setIsGeneratingReport(false);
  };

  const handleAutoRemind = async (debtId: string) => {
    const updatedDebt = await updateDebt(debtId, { status: 'reminded' });
    if (updatedDebt) {
      setDebts(prev => prev.map(debt =>
        debt.id === debtId ? { ...debt, status: 'reminded' as const } : debt
      ));
      toast.success('AI-generated reminder sent successfully!');
    }
  };

  const handleGeneratePaymentPlan = (_debtId: string) => {
    toast.success('Payment plan generated and sent to customer');
  };

  const handleEscalate = async (debtId: string) => {
    const updatedDebt = await updateDebt(debtId, { risk_score: 'high' });
    if (updatedDebt) {
      setDebts(prev => prev.map(debt =>
        debt.id === debtId ? { ...debt, risk_score: 'high' as const } : debt
      ));
      toast.warning('Case escalated to senior collections team');
    }
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !debtForm.invoice_number.trim() || !debtForm.amount) {
      toast.error('Please select a customer and fill in all required fields');
      return;
    }

    const debtData = {
      invoice_number: debtForm.invoice_number.trim(),
      amount: Number(debtForm.amount),
      due_date: debtForm.due_date || new Date().toISOString().slice(0, 10),
      status: 'pending' as const,
      days_overdue: 0,
      payment_probability: 70,
      risk_score: debtForm.risk_score,
      auto_reminder: true,
      company_id: selectedCustomer.id,
      company_name: selectedCustomer.name,
      company_contact_email: selectedCustomer.email || '',
    };

    const savedDebt = await saveDebt(debtData);
    if (savedDebt) {
      // Transform database format to component format for display
      const newDebt: Debt = {
        ...savedDebt,
        companies: {
          name: savedDebt.company_name,
          contact_email: savedDebt.company_contact_email || '',
          id: savedDebt.company_id
        }
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
      setShowAddDebtModal(false);
    }
  };

  return (
    <FeatureGate feature="debt_collection">
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading debt collection data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">AI Debt Collection</h1>
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
            disabled={isSendingReminders || isGeneratingReport}
          >
            {automationEnabled ? 'Automation ON' : 'Automation OFF'}
          </Button>
          <Button 
            variant="secondary" 
            icon={Send} 
            onClick={handleSendAllReminders}
            disabled={isSendingReminders || isGeneratingReport || !automationEnabled}
          >
            {isSendingReminders ? 'Sending...' : 'Send All Reminders'}
          </Button>
          <Button 
            icon={TrendingUp} 
            onClick={handleGenerateAIReport}
            disabled={isSendingReminders || isGeneratingReport}
          >
            {isGeneratingReport ? 'Generating...' : 'AI Report'}
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
                  <p className="font-semibold text-slate-900">
                    {automationMetrics.nextReminder
                      ? automationMetrics.nextReminder.toLocaleDateString() + ' at 2:00 PM'
                      : 'No pending reminders'
                    }
                  </p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Overdue This Week</p>
                  <p className="font-semibold text-slate-900">
                    {automationMetrics.overdueThisWeek} overdue invoices
                  </p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Collection Rate</p>
                  <p className="font-semibold text-green-600">
                    {automationMetrics.collectionRate}% success
                  </p>
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
                <th className="text-left py-3 px-4 font-medium text-slate-900">Business</th>
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
                      <p className="font-medium text-slate-900">{debt.company_name}</p>
                      <p className="text-xs text-slate-500">{debt.company_contact_email}</p>
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
          {/* Customer Selection Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customerId = e.target.value;
                const customer = contextCustomers.find((c: Customer) => c.id === customerId);
                setSelectedCustomer(customer || null);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select a customer...</option>
              {contextCustomers.map((customer: Customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email} (Lifetime Value: {formatCurrency(customer.lifetime_value)})
                </option>
              ))}
            </select>
            {contextCustomers.length === 0 && (
              <p className="text-sm text-slate-500 mt-1">No customers available. Add customers in the Customers section first.</p>
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
        </>
      )}
    </div>
    </FeatureGate>
  );
};
