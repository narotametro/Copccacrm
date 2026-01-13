import React, { useMemo, useState } from 'react';
import {
  Plus,
  Banknote,
  Target,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  company: string;
  ai_probability: number;
  ai_confidence: 'low' | 'medium' | 'high';
  next_action: string;
  action_priority: 'low' | 'medium' | 'high' | 'urgent';
  days_in_stage: number;
  estimated_close_date: string;
  win_factors: string[];
  risk_factors: string[];
}

const stages = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-700' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-700' },
  { id: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-700' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-700' },
  { id: 'closed-won', label: 'Closed Won', color: 'bg-green-100 text-green-700' },
];

const initialDeals: Deal[] = [
  {
    id: '1',
    title: 'Enterprise CRM License',
    value: 85000,
    stage: 'negotiation',
    company: 'Acme Corp',
    ai_probability: 82,
    ai_confidence: 'high',
    next_action: 'Schedule pricing discussion',
    action_priority: 'urgent',
    days_in_stage: 8,
    estimated_close_date: '2026-01-15',
    win_factors: ['Strong champion', 'Budget approved'],
    risk_factors: ['Competitor offering discount'],
  },
  {
    id: '2',
    title: 'Cloud Migration',
    value: 120000,
    stage: 'proposal',
    company: 'GlobalTech Inc',
    ai_probability: 65,
    ai_confidence: 'medium',
    next_action: 'Send technical proposal',
    action_priority: 'high',
    days_in_stage: 12,
    estimated_close_date: '2026-02-01',
    win_factors: ['Technical fit', 'Existing relationship'],
    risk_factors: ['Budget concerns', 'Timeline pressure'],
  },
  {
    id: '3',
    title: 'SMB Package',
    value: 25000,
    stage: 'qualified',
    company: 'StartupX',
    ai_probability: 55,
    ai_confidence: 'medium',
    next_action: 'Schedule demo',
    action_priority: 'medium',
    days_in_stage: 5,
    estimated_close_date: '2026-01-25',
    win_factors: ['Urgent need', 'Fast decision process'],
    risk_factors: ['Limited budget', 'Exploring alternatives'],
  },
];

export const SalesPipelineView: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    value: '',
    stage: 'lead',
    ai_probability: '',
    ai_confidence: 'medium',
    next_action: '',
    action_priority: 'medium',
    days_in_stage: '',
    estimated_close_date: '',
    win_factors: '',
    risk_factors: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      company: '',
      value: '',
      stage: 'lead',
      ai_probability: '',
      ai_confidence: 'medium',
      next_action: '',
      action_priority: 'medium',
      days_in_stage: '',
      estimated_close_date: '',
      win_factors: '',
      risk_factors: '',
    });
    setActiveDealId(null);
    setModalMode('add');
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setShowDealModal(true);
  };

  const openEditModal = (deal: Deal) => {
    setModalMode('edit');
    setActiveDealId(deal.id);
    setForm({
      title: deal.title,
      company: deal.company,
      value: String(deal.value),
      stage: deal.stage,
      ai_probability: String(deal.ai_probability),
      ai_confidence: deal.ai_confidence,
      next_action: deal.next_action,
      action_priority: deal.action_priority,
      days_in_stage: String(deal.days_in_stage),
      estimated_close_date: deal.estimated_close_date,
      win_factors: deal.win_factors.join(', '),
      risk_factors: deal.risk_factors.join(', '),
    });
    setShowDealModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('Deal title is required');
      return;
    }
    const payload: Deal = {
      id: activeDealId || crypto.randomUUID(),
      title: form.title.trim(),
      company: form.company.trim() || 'Unspecified',
      value: Number(form.value) || 0,
      stage: form.stage,
      ai_probability: Math.min(100, Math.max(0, Number(form.ai_probability) || 0)),
      ai_confidence: form.ai_confidence as Deal['ai_confidence'],
      next_action: form.next_action.trim() || 'Follow up',
      action_priority: form.action_priority as Deal['action_priority'],
      days_in_stage: Number(form.days_in_stage) || 0,
      estimated_close_date: form.estimated_close_date || 'TBD',
      win_factors: form.win_factors ? form.win_factors.split(',').map((w) => w.trim()).filter(Boolean) : [],
      risk_factors: form.risk_factors ? form.risk_factors.split(',').map((r) => r.trim()).filter(Boolean) : [],
    };

    setDeals((prev) => {
      if (modalMode === 'edit' && activeDealId) {
        return prev.map((d) => (d.id === activeDealId ? payload : d));
      }
      return [payload, ...prev];
    });

    toast.success(modalMode === 'edit' ? 'Deal updated' : 'Deal added', {
      description: `${payload.title}${payload.company ? ` • ${payload.company}` : ''}`,
    });

    setShowDealModal(false);
    resetForm();
  };

  const filteredDeals = selectedStage === 'all'
    ? deals
    : deals.filter((deal) => deal.stage === selectedStage);

  const totalValue = useMemo(() => deals.reduce((sum, deal) => sum + deal.value, 0), [deals]);
  const avgProbability = useMemo(
    () => (deals.length ? Math.round(deals.reduce((sum, deal) => sum + deal.ai_probability, 0) / deals.length) : 0),
    [deals]
  );
  const expectedRevenue = useMemo(
    () => Math.round(deals.reduce((sum, deal) => sum + (deal.value * deal.ai_probability) / 100, 0)),
    [deals]
  );

  return (
    <div className="space-y-4">
      <Modal
        isOpen={showDealModal}
        onClose={() => {
          setShowDealModal(false);
          resetForm();
        }}
        title={modalMode === 'edit' ? 'Edit Deal' : 'Add Deal'}
        size="md"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Deal Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Enterprise CRM License"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
            <Input
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="e.g., 85000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Close Probability (%)</label>
            <Input
              type="number"
              value={form.ai_probability}
              onChange={(e) => setForm({ ...form, ai_probability: e.target.value })}
              placeholder="0-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confidence</label>
            <select
              value={form.ai_confidence}
              onChange={(e) => setForm({ ...form, ai_confidence: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Next Action</label>
            <Input
              value={form.next_action}
              onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              placeholder="e.g., Schedule pricing discussion"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Action Priority</label>
            <select
              value={form.action_priority}
              onChange={(e) => setForm({ ...form, action_priority: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Days in Stage</label>
            <Input
              type="number"
              value={form.days_in_stage}
              onChange={(e) => setForm({ ...form, days_in_stage: e.target.value })}
              placeholder="e.g., 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Close Date</label>
            <Input
              type="date"
              value={form.estimated_close_date}
              onChange={(e) => setForm({ ...form, estimated_close_date: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Win Factors (comma separated)</label>
            <textarea
              value={form.win_factors}
              onChange={(e) => setForm({ ...form, win_factors: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              rows={2}
              placeholder="Strong champion, Budget approved"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Risk Factors (comma separated)</label>
            <textarea
              value={form.risk_factors}
              onChange={(e) => setForm({ ...form, risk_factors: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              rows={2}
              placeholder="Competitor discounting, Budget risk"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDealModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>{modalMode === 'edit' ? 'Update Deal' : 'Save Deal'}</Button>
          </div>
        </div>
      </Modal>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={openAddModal}>Add Deal</Button>
        <Button
          variant="outline"
          onClick={() => toast.success('AI insights refreshed', { description: 'Demo: recalculated win probability + next action.' })}
        >
          <Brain size={16} className="mr-2" />
          Refresh AI Insights
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="text-blue-600" size={20} />
            <span className="text-xs text-slate-600">Total Pipeline</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-green-600" size={20} />
            <span className="text-xs text-slate-600">Expected Revenue</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(expectedRevenue)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="text-xs text-slate-600">Avg AI Probability</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgProbability}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-orange-600" size={20} />
            <span className="text-xs text-slate-600">Active Deals</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{deals.length}</div>
        </Card>
      </div>

      {/* Stage Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setSelectedStage('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            selectedStage === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Deals
        </button>
        {stages.map((stage) => (
          <button
            type="button"
            key={stage.id}
            onClick={() => setSelectedStage(stage.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedStage === stage.id
                ? stage.color
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Deal Cards */}
      <div className="grid gap-4">
        {filteredDeals.map((deal) => (
          <Card key={deal.id} className="p-4 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-lg">{deal.title}</h3>
                <p className="text-sm text-slate-600">{deal.company}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">{formatCurrency(deal.value)}</div>
                <span className={`text-xs px-2 py-1 rounded ${
                  stages.find(s => s.id === deal.stage)?.color || 'bg-slate-100 text-slate-700'
                }`}>
                  {stages.find(s => s.id === deal.stage)?.label || deal.stage}
                </span>
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(deal)}>
                    Edit
                  </Button>
                </div>
              </div>
            </div>

            {/* AI Health Score */}
            <div className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <Brain className="text-purple-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">AI Close Probability</span>
                  <span className={`text-sm font-bold ${
                    deal.ai_probability >= 70 ? 'text-green-600' :
                    deal.ai_probability >= 50 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {deal.ai_probability}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      deal.ai_probability >= 70 ? 'bg-green-500' :
                      deal.ai_probability >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${deal.ai_probability}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Next Action */}
            <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-xs font-medium text-blue-900">Next Action</span>
                  <p className="text-sm text-blue-700 mt-1">{deal.next_action}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  deal.action_priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  deal.action_priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  deal.action_priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {deal.action_priority}
                </span>
              </div>
            </div>

            {/* Win/Risk Factors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                  <CheckCircle size={14} />
                  <span>Win Factors</span>
                </div>
                {deal.win_factors.slice(0, 2).map((factor, idx) => (
                  <div key={idx} className="text-xs text-slate-600 ml-4">• {factor}</div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-red-700">
                  <AlertTriangle size={14} />
                  <span>Risk Factors</span>
                </div>
                {deal.risk_factors.slice(0, 2).map((factor, idx) => (
                  <div key={idx} className="text-xs text-slate-600 ml-4">• {factor}</div>
                ))}
              </div>
            </div>

            {/* Deal Info */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <span>{deal.days_in_stage} days in stage</span>
              <span>Est. close: {deal.estimated_close_date}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
