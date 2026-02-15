import React, { useState, useEffect } from 'react';
import {
  Plus,
  Banknote,
  Target,
  TrendingUp,
  CheckCircle,
  Edit,
  Trash2,
  Brain,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { supabase } from '@/lib/supabase';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  company_id: string;
  company_name?: string;
  probability: number;
  expected_close_date: string | null;
  assigned_to: string | null;
  assigned_user_name?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface DealWithJoins {
  id: string;
  title: string;
  value: number;
  stage: string;
  company_id: string;
  probability: number;
  expected_close_date: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  companies?: { name: string } | null;
  profiles?: { full_name: string; email: string } | null;
}

const stages = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'won', label: 'Closed Won', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'lost', label: 'Closed Lost', color: 'bg-red-100 text-red-700 border-red-200' },
];

const initialDeals: Deal[] = [];

export const SalesPipelineView: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company_id: '',
    value: '',
    stage: 'lead',
    probability: '50',
    expected_close_date: '',
    assigned_to: '',
    notes: '',
  });

  // Fetch deals, companies, and users
  const fetchData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // PARALLEL API CALLS - fetch all data simultaneously
      const [dealsResult, companiesResult, usersResult] = await Promise.all([
        supabase
          .from('deals')
          .select(`
            *,
            companies:company_id(name),
            profiles:assigned_to(full_name, email)
          `)
          .eq('created_by', userData.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('companies')
          .select('id, name')
          .eq('created_by', userData.user.id)
          .order('name'),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name')
      ]);

      if (dealsResult.error) throw dealsResult.error;

      // Transform the data
      const transformedDeals = dealsResult.data?.map((deal: DealWithJoins) => ({
        ...deal,
        company_name: deal.companies?.name || 'Unknown Company',
        assigned_user_name: deal.profiles?.full_name || deal.profiles?.email || 'Unassigned',
      })) || [];

      setDeals(transformedDeals);

      if (!companiesResult.error && companiesResult.data) {
        setCompanies(companiesResult.data);
      }

      if (!usersResult.error && usersResult.data) {
        setUsers(usersResult.data);
      }

    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      toast.error('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({
      title: '',
      company_id: '',
      value: '',
      stage: 'lead',
      probability: '50',
      expected_close_date: '',
      assigned_to: '',
      notes: '',
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
      company_id: deal.company_id,
      value: String(deal.value),
      stage: deal.stage,
      probability: String(deal.probability),
      expected_close_date: deal.expected_close_date || '',
      assigned_to: deal.assigned_to || '',
      notes: deal.notes || '',
    });
    setShowDealModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dealData = {
        title: form.title,
        company_id: form.company_id,
        value: parseFloat(form.value),
        stage: form.stage,
        probability: parseInt(form.probability),
        expected_close_date: form.expected_close_date || null,
        assigned_to: form.assigned_to || null,
        notes: form.notes || null,
      };

      if (modalMode === 'add') {
        const { error } = await supabase
          .from('deals')
          .insert([dealData]);

        if (error) throw error;
        toast.success('Deal created successfully');
      } else {
        const { error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', activeDealId);

        if (error) throw error;
        toast.success('Deal updated successfully');
      }

      setShowDealModal(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Failed to save deal');
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;
      toast.success('Deal deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  };

  const filteredDeals = selectedStage === 'all'
    ? deals
    : deals.filter((deal) => deal.stage === selectedStage);

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Deal Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <Select
              label="Company"
              value={form.company_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, company_id: e.target.value })}
              required
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Deal Value"
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />

            <Select
              label="Stage"
              value={form.stage}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, stage: e.target.value })}
              required
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Probability (%)"
              type="number"
              min="0"
              max="100"
              value={form.probability}
              onChange={(e) => setForm({ ...form, probability: e.target.value })}
              required
            />

            <Input
              label="Expected Close Date"
              type="date"
              value={form.expected_close_date}
              onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
            />
          </div>

          <Select
            label="Assigned To"
            value={form.assigned_to}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, assigned_to: e.target.value })}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDealModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {modalMode === 'add' ? 'Create Deal' : 'Update Deal'}
            </Button>
          </div>
        </form>
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
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : formatCurrency(deals.reduce((sum, deal) => sum + (deal.value || 0), 0))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-green-600" size={20} />
            <span className="text-xs text-slate-600">Expected Revenue</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : formatCurrency(
              deals.reduce((sum, deal) => {
                if (deal.stage === 'won') return sum + (deal.value || 0);
                return sum + ((deal.value || 0) * (deal.probability || 0) / 100);
              }, 0)
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="text-xs text-slate-600">Avg Probability</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : deals.length > 0
              ? Math.round(deals.reduce((sum, deal) => sum + (deal.probability || 0), 0) / deals.length)
              : 0}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-orange-600" size={20} />
            <span className="text-xs text-slate-600">Active Deals</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : deals.filter(d => !['won', 'lost'].includes(d.stage)).length}
          </div>
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
        {loading ? (
          // Show skeleton loading cards
          [1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </Card>
          ))
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No deals found in this stage
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <Card key={deal.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg">{deal.title}</h3>
                  <p className="text-sm text-slate-600">{deal.company_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">{formatCurrency(deal.value)}</div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    stages.find(s => s.id === deal.stage)?.color || 'bg-slate-100 text-slate-700'
                  }`}>
                    {stages.find(s => s.id === deal.stage)?.label || deal.stage}
                  </span>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(deal)}>
                      <Edit size={12} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(deal.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Deal Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Probability</span>
                  <div className="font-semibold">{deal.probability}%</div>
                </div>
                {deal.expected_close_date && (
                  <div>
                    <span className="text-slate-500">Expected Close</span>
                    <div className="font-semibold">{new Date(deal.expected_close_date).toLocaleDateString()}</div>
                  </div>
                )}
                {deal.assigned_user_name && (
                  <div>
                    <span className="text-slate-500">Assigned To</span>
                    <div className="font-semibold">{deal.assigned_user_name}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Created</span>
                  <div className="font-semibold">{new Date(deal.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {deal.notes && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-medium text-slate-700">Notes</span>
                  <p className="text-sm text-slate-600 mt-1">{deal.notes}</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
