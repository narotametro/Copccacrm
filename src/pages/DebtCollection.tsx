import React, { useState } from 'react';
import { Banknote, AlertTriangle, CheckCircle, Clock, Zap, Brain, Send, TrendingUp, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

const demoDebts = [
  { 
    id: '1', 
    invoice_number: 'INV-001', 
    amount: 50000, 
    due_date: '2026-02-15', 
    status: 'paid', 
    days_overdue: 0,
    payment_probability: 95,
    risk_score: 'low',
    auto_reminder: true,
    companies: { name: 'Acme Corp', contact_email: 'finance@acme.com' } 
  },
  { 
    id: '2', 
    invoice_number: 'INV-002', 
    amount: 120000, 
    due_date: '2026-01-25', 
    status: 'pending', 
    days_overdue: 0,
    payment_probability: 78,
    risk_score: 'medium',
    auto_reminder: true,
    companies: { name: 'GlobalTech Inc', contact_email: 'billing@globaltech.com' } 
  },
  { 
    id: '3', 
    invoice_number: 'INV-003', 
    amount: 30000, 
    due_date: '2025-12-20', 
    status: 'overdue', 
    days_overdue: 18,
    payment_probability: 45,
    risk_score: 'high',
    auto_reminder: true,
    companies: { name: 'MegaCorp Ltd', contact_email: 'ap@megacorp.com' } 
  },
  { 
    id: '4', 
    invoice_number: 'INV-004', 
    amount: 15000, 
    due_date: '2026-01-15', 
    status: 'reminded', 
    days_overdue: 0,
    payment_probability: 88,
    risk_score: 'low',
    auto_reminder: true,
    companies: { name: 'StartupX', contact_email: 'finance@startupx.io' } 
  },
];

export const DebtCollection: React.FC = () => {
  const { formatCurrency, convertAmount } = useCurrency();
  const [debts] = useState<any[]>(demoDebts);
  const [automationEnabled, setAutomationEnabled] = useState(true);

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
    </div>
  );
};
