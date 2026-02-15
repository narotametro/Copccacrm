import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Banknote,
  Target,
  TrendingUp,
  CheckCircle,
  Edit,
  Trash2,
  Building,
  Calendar,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { Select } from '@/components/ui/Select';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/types/database';

type DealWithJoins = Database['public']['Tables']['deals']['Row'] & {
  companies: { name: string } | null;
  profiles: { full_name: string; email: string } | null;
};

interface LocationState {
  prefillDeal?: {
    title?: string;
    customer_id?: string;
    value?: number;
    expected_close_date?: string;
  };
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

const stages = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'won', label: 'Closed Won', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'lost', label: 'Closed Lost', color: 'bg-red-100 text-red-700 border-red-200' },
];

export const Pipeline: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const location = useLocation();
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle prefilled deal data from navigation
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.prefillDeal) {
      setForm({
        title: state.prefillDeal.title || '',
        company_id: state.prefillDeal.customer_id || '',
        value: String(state.prefillDeal.value || ''),
        stage: 'lead',
        probability: '50',
        expected_close_date: state.prefillDeal.expected_close_date || '',
        assigned_to: '',
        notes: '',
      });
      setModalMode('add');
      setShowDealModal(true);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    : deals.filter(deal => deal.stage === selectedStage);

  const pipelineStats = {
    totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
    activeDeals: deals.filter(d => !['won', 'lost'].includes(d.stage)).length,
    wonDeals: deals.filter(d => d.stage === 'won').length,
    avgProbability: deals.length > 0
      ? Math.round(deals.reduce((sum, deal) => sum + (deal.probability || 0), 0) / deals.length)
      : 0,
  };

  return (
    <FeatureGate feature="sales_pipeline">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-600 mt-1">Track and manage your sales deals</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <Plus size={16} />
          Add Deal
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Banknote className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Pipeline Value</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(pipelineStats.totalValue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Deals</p>
              <p className="text-xl font-bold text-slate-900">{pipelineStats.activeDeals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Won Deals</p>
              <p className="text-xl font-bold text-slate-900">{pipelineStats.wonDeals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Avg. Probability</p>
              <p className="text-xl font-bold text-slate-900">{pipelineStats.avgProbability}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stage Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedStage === 'all' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setSelectedStage('all')}
        >
          All Stages
        </Button>
        {stages.map((stage) => (
          <Button
            key={stage.id}
            variant={selectedStage === stage.id ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStage(stage.id)}
          >
            {stage.label}
          </Button>
        ))}
      </div>

      {/* Pipeline Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter(deal => deal.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

          return (
            <div key={stage.id} className="space-y-3">
              <div className={`p-3 rounded-lg border-2 ${stage.color}`}>
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {stageDeals.length} deals • {formatCurrency(stageValue)}
                </p>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {stageDeals.map((deal) => (
                  <Card key={deal.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-slate-900 line-clamp-2">{deal.title}</h4>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(deal)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(deal.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building size={10} />
                        <span className="truncate">{deal.company_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Banknote size={10} />
                        <span>{formatCurrency(deal.value)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target size={10} />
                        <span>{deal.probability}%</span>
                      </div>
                      {deal.expected_close_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{new Date(deal.expected_close_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {deal.assigned_user_name && (
                        <div className="flex items-center gap-1">
                          <User size={10} />
                          <span className="truncate">{deal.assigned_user_name}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-8">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Modal */}
      <Modal
        isOpen={showDealModal}
        onClose={() => setShowDealModal(false)}
        title={modalMode === 'add' ? 'Add New Deal' : 'Edit Deal'}
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
              label="Business"
              value={form.company_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, company_id: e.target.value })}
              required
            >
              <option value="">Select Business</option>
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
    </div>
    </FeatureGate>
  );
};