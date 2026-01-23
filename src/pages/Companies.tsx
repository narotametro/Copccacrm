import React, { useState, useEffect } from 'react';
import { Building, Users, DollarSign, Edit2, Trash2, Plus, Search, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/lib/types/database';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  subscription_status?: string;
  subscription_plan?: string;
  max_users?: number;
  created_at: string;
  user_count?: number;
  jtbd?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
}

export const Companies: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    jtbd: '',
    sentiment: 'neutral',
    subscription_plan: 'starter',
    max_users: 10,
    show_payment_popup: false,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      // Fetch companies with user count
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (companiesData) {
        // Get user counts for each company
        const companiesWithCounts = await Promise.all(
          companiesData.map(async (company: Database['public']['Tables']['companies']['Row']) => {
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id);

            return {
              ...company,
              user_count: count || 0,
            };
          })
        );

        setCompanies(companiesWithCounts);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          industry: formData.industry || null,
          size: formData.size || null,
          website: formData.website || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          jtbd: formData.jtbd || null,
          sentiment: formData.sentiment || 'neutral',
          status: 'active',
          subscription_plan: formData.subscription_plan,
          max_users: formData.max_users,
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          created_by: user?.id,
          show_payment_popup: formData.show_payment_popup,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Company added successfully');
      setShowAddModal(false);
      setFormData({
        name: '',
        industry: '',
        size: '',
        website: '',
        phone: '',
        email: '',
        address: '',
        jtbd: '',
        sentiment: 'neutral',
        subscription_plan: 'starter',
        max_users: 10,
        show_payment_popup: false,
      });
      fetchCompanies();
    } catch (error) {
      console.error('Error adding company:', error);
      toast.error('Failed to add company');
    }
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          industry: formData.industry || null,
          size: formData.size || null,
          website: formData.website || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          jtbd: formData.jtbd || null,
          sentiment: formData.sentiment || 'neutral',
          subscription_plan: formData.subscription_plan,
          max_users: formData.max_users,
          updated_at: new Date().toISOString(),
          show_payment_popup: formData.show_payment_popup,
        })
        .eq('id', selectedCompany.id);

      if (error) throw error;

      toast.success('Company updated successfully');
      setShowEditModal(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company');
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This will remove all associated data.`)) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry || '',
      size: company.size || '',
      website: company.website || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      jtbd: company.jtbd || '',
      sentiment: company.sentiment || 'neutral',
      subscription_plan: company.subscription_plan || 'starter',
      max_users: company.max_users || 10,
      show_payment_popup: company.show_payment_popup || false,
    });
    setShowEditModal(true);
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPlanColor = (plan?: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'professional': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'starter': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Businesses Management</h1>
          <p className="text-slate-600 mt-1">Manage all businesses and their subscriptions</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            icon={FileText} 
            onClick={() => navigate('/app/settings')}
          >
            Business Information
          </Button>
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Business
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Businesses</p>
              <p className="text-2xl font-bold text-slate-900">{companies.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Companies</p>
              <p className="text-2xl font-bold text-slate-900">
                {companies.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
          {/* JTBD and Sentiment fields */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jobs To Be Done (JTBD)</label>
              <div className="flex gap-2">
                <Input
                  value={formData.jtbd}
                  onChange={e => setFormData({ ...formData, jtbd: e.target.value })}
                  placeholder="Describe what the customer is trying to accomplish"
                />
                {formData.jtbd && (
                  <Button type="button" variant="danger" onClick={() => setFormData({ ...formData, jtbd: '' })}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sentiment</label>
              <select
                value={formData.sentiment}
                onChange={e => setFormData({ ...formData, sentiment: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">
                {companies.reduce((sum, c) => sum + (c.user_count || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search companies by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
        </div>
      </Card>

      {/* Companies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Company</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Industry</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Plan</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Users</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Created</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div>
                      <p className="font-semibold text-slate-900">{company.name}</p>
                      {company.email && <p className="text-xs text-slate-600">{company.email}</p>}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-sm text-slate-700">{company.industry || '—'}</p>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${getPlanColor(company.subscription_plan)}`}>
                      {(company.subscription_plan || 'starter').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">
                        {company.user_count || 0}/{company.max_users || 10}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      company.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="text-sm text-slate-700">
                      {new Date(company.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(company)}
                        className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id, company.name)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <Building className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600">No companies found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Add Business Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Company"
        size="lg"
      >
        <form onSubmit={handleAddCompany} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Size</label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
            <Input
              label="Website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
              <select
                value={formData.subscription_plan}
                onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="starter">Starter - ₦45K/mo (10 users)</option>
                <option value="professional">Professional - ₦120K/mo (25 users)</option>
                <option value="enterprise">Enterprise - ₦250K/mo (100 users)</option>
              </select>
            </div>
          </div>
          {/* JTBD and Sentiment fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jobs To Be Done (JTBD)</label>
              <div className="flex gap-2">
                <Input
                  value={formData.jtbd}
                  onChange={(e) => setFormData({ ...formData, jtbd: e.target.value })}
                  placeholder="Describe what the customer is trying to accomplish"
                />
                {formData.jtbd && (
                  <Button type="button" variant="danger" onClick={() => setFormData({ ...formData, jtbd: '' })}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sentiment</label>
              <select
                value={formData.sentiment}
                onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_payment_popup}
                onChange={(e) => setFormData({ ...formData, show_payment_popup: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Show Payment Popup</span>
                <p className="text-xs text-slate-500">Display payment reminder to this company's users</p>
              </div>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={Plus}>
              Add Business
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Company"
        size="lg"
      >
        <form onSubmit={handleEditCompany} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Size</label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
            <Input
              label="Website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
              <select
                value={formData.subscription_plan}
                onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="starter">Starter - ₦45K/mo (10 users)</option>
                <option value="professional">Professional - ₦120K/mo (25 users)</option>
                <option value="enterprise">Enterprise - ₦250K/mo (100 users)</option>
              </select>
            </div>
          </div>
          {/* JTBD and Sentiment fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jobs To Be Done (JTBD)</label>
              <div className="flex gap-2">
                <Input
                  value={formData.jtbd}
                  onChange={(e) => setFormData({ ...formData, jtbd: e.target.value })}
                  placeholder="Describe what the customer is trying to accomplish"
                />
                {formData.jtbd && (
                  <Button type="button" variant="danger" onClick={() => setFormData({ ...formData, jtbd: '' })}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sentiment</label>
              <select
                value={formData.sentiment}
                onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_payment_popup}
                onChange={(e) => setFormData({ ...formData, show_payment_popup: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Show Payment Popup</span>
                <p className="text-xs text-slate-500">Display payment reminder to this company's users</p>
              </div>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={Edit2}>
              Update Company
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
