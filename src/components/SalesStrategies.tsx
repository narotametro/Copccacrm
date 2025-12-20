import { salesAPI } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { toast } from 'sonner';
import { SkeletonLoader } from './shared/SkeletonLoader';
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Lightbulb, Target, TrendingUp, Zap, DollarSign, UserCheck, Megaphone, Pencil, Clock, Plus, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { StatCard } from './shared/StatCard';
import { PageHeader } from './shared/PageHeader';
import { getPriorityColor, getStatusColor, formatNumberWithCommas, formatInputWithCommas, removeCommas } from '../lib/utils';
import { useDebounce } from '../lib/performance';
import { DataModeBanner } from './DataModeBanner';
import { CurrencyInput } from './shared/CurrencyInput';
import { UserViewBanner } from './shared/UserViewBanner';

type StrategyType = 'sales' | 'marketing';

interface Strategy {
  id: number;
  type: StrategyType;
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'recommended' | 'planned' | 'completed';
  insight: string;
  actions: string[];
  expectedImpact: string;
  basedOn: string[];
  timeline: string;
  budget?: string;
  channels?: string[];
  performance?: number;
  leads?: number;
}

export const SalesStrategies = memo(function SalesStrategies() {
  const { user, isAdmin, selectedUserId } = useAuth();
  const [activeTab, setActiveTab] = useState<StrategyType>('sales');
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [deletingStrategy, setDeletingStrategy] = useState<Strategy | null>(null);
  const [stoppingStrategy, setStoppingStrategy] = useState<Strategy | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newStrategy, setNewStrategy] = useState({
    type: 'sales' as StrategyType,
    title: '',
    category: 'growth',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'recommended' as 'active' | 'recommended' | 'planned' | 'completed',
    insight: '',
    expectedImpact: '',
    timeline: '',
    budget: '',
    channels: [] as string[],
  });

  useEffect(() => {
    loadStrategies();
  }, [selectedUserId]);

  const loadStrategies = async () => {
    try {
      // Don't block UI with loading state - load in background
      // Filter by selected user if not viewing all
      const { records } = await salesAPI.getAll(selectedUserId || undefined, !selectedUserId);
      setStrategies(records || []);
    } catch (error: any) {
      console.error('Failed to load strategies:', error);
      toast.error('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStrategy = async () => {
    if (!newStrategy.title || !newStrategy.insight) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const strategyData = {
        ...newStrategy,
        type: activeTab,
        actions: [],
        basedOn: ['User Input'],
      };

      const created = await salesAPI.create(strategyData);
      
      // Optimistically add to local state
      setStrategies(prev => [...prev, created.record]);
      
      toast.success('Strategy added successfully');
      setShowAddModal(false);
      resetNewStrategy();
    } catch (error: any) {
      console.error('Failed to add strategy:', error);
      toast.error(error.message || 'Failed to add strategy');
    }
  };

  const handleEditStrategy = async () => {
    if (!editingStrategy) return;

    try {
      const oldStrategy = strategies.find(s => s.id === editingStrategy.id);
      
      // Optimistically update local state
      setStrategies(prev => 
        prev.map(s => s.id === editingStrategy.id ? editingStrategy : s)
      );
      
      await salesAPI.update(editingStrategy.id, editingStrategy);
      toast.success('Strategy updated successfully');
      setShowEditModal(false);
      setEditingStrategy(null);
    } catch (error: any) {
      // Revert on error
      if (oldStrategy) {
        setStrategies(prev => 
          prev.map(s => s.id === editingStrategy.id ? oldStrategy : s)
        );
      }
      console.error('Failed to update strategy:', error);
      toast.error(error.message || 'Failed to update strategy');
    }
  };

  const handleDeleteStrategy = async () => {
    if (!deletingStrategy) return;

    try {
      const deletedStrategy = deletingStrategy;
      
      // Optimistically remove from local state
      setStrategies(prev => prev.filter(s => s.id !== deletingStrategy.id));
      
      await salesAPI.delete(deletingStrategy.id);
      toast.success('Strategy deleted successfully');
      setShowDeleteModal(false);
      setDeletingStrategy(null);
    } catch (error: any) {
      // Revert on error
      setStrategies(prev => [...prev, deletedStrategy].sort((a, b) => a.id - b.id));
      console.error('Failed to delete strategy:', error);
      toast.error(error.message || 'Failed to delete strategy');
    }
  };

  const handleStopStrategy = async () => {
    if (!stoppingStrategy) return;

    try {
      await salesAPI.update(stoppingStrategy.id, { status: 'completed' });
      toast.success('Strategy stopped successfully');
      
      // Optimistically update local state without reloading
      setStrategies(prev => 
        prev.map(s => s.id === stoppingStrategy.id ? { ...s, status: 'completed' } : s)
      );
      
      setShowStopModal(false);
      setStoppingStrategy(null);
    } catch (error: any) {
      console.error('Failed to stop strategy:', error);
      toast.error(error.message || 'Failed to stop strategy');
    }
  };

  const resetNewStrategy = () => {
    setNewStrategy({
      type: activeTab,
      title: '',
      category: 'growth',
      priority: 'medium',
      status: 'recommended',
      insight: '',
      expectedImpact: '',
      timeline: '',
      budget: '',
      channels: [],
    });
  };

  const filteredStrategies = strategies.filter(s => s.type === activeTab);

  // Stats for the dashboard
  // - Active Strategies: Count of active strategies from the database
  // - Target Conversion: Calculated from KPI Tracking data (conversion rate metrics)
  // - ROI Improvement: Calculated from KPI Tracking data (ROI performance metrics)
  // - Opportunities: Count of recommended strategies that haven't been implemented yet
  const stats = [
    {
      label: activeTab === 'sales' ? 'Active Sales Strategies' : 'Active Marketing Campaigns',
      value: filteredStrategies.filter(s => s.status === 'active').length.toString(),
      change: '+3',
      icon: Lightbulb,
      color: 'bg-pink-500',
    },
    {
      // Data source: KPI Tracking module - Conversion Rate metrics
      // This should pull from actual conversion rate KPIs when integrated
      label: 'Target Conversion',
      value: '24%',
      change: '+5%',
      icon: Target,
      color: 'bg-purple-500',
    },
    {
      // Data source: KPI Tracking module - ROI metrics
      // This should pull from actual ROI calculation KPIs when integrated
      label: 'ROI Improvement',
      value: '32%',
      change: '+8%',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      // Data source: Count of recommended strategies from the strategies database
      label: 'Opportunities',
      value: filteredStrategies.filter(s => s.status === 'recommended').length.toString(),
      change: '+2',
      icon: Zap,
      color: 'bg-blue-500',
    },
  ];

  const getCategoryIcon = (category: string) => {
    const icons = {
      competitive: Target,
      revenue: DollarSign,
      retention: UserCheck,
      pricing: DollarSign,
      growth: TrendingUp,
      campaign: Megaphone,
      content: Lightbulb,
    };
    return icons[category as keyof typeof icons] || Lightbulb;
  };

  // Show content immediately, even while loading
  return (
    <div className="p-8 space-y-6">
      {/* User View Banner */}
      {selectedUserId && <UserViewBanner />}
      
      {/* Data Mode Banner */}
      <DataModeBanner recordCount={strategies.length} entityName="strategies" />
      
      <PageHeader 
        title="Sales & Marketing Strategies"
        description="Data-driven strategies powered by after-sales insights, KPI performance metrics, and competitor information"
        actionLabel="Create Strategy"
        onAction={() => {
          resetNewStrategy();
          setShowAddModal(true);
        }}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-3 text-sm transition-colors relative ${
            activeTab === 'sales'
              ? 'text-pink-600 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sales Strategies
          {activeTab === 'sales' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('marketing')}
          className={`px-6 py-3 text-sm transition-colors relative ${
            activeTab === 'marketing'
              ? 'text-pink-600 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Marketing Strategies
          {activeTab === 'marketing' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"></div>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Strategies List */}
      <div className="space-y-4">
        <h3 className="text-lg flex items-center gap-2">
          {activeTab === 'sales' ? (
            <>
              <Target size={20} className="text-pink-500" />
              Sales Strategies
            </>
          ) : (
            <>
              <Megaphone size={20} className="text-pink-500" />
              Marketing Campaigns
            </>
          )}
        </h3>
        
        {filteredStrategies.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="text-gray-400 mb-4">
              {activeTab === 'sales' ? <Target size={48} className="mx-auto" /> : <Megaphone size={48} className="mx-auto" />}
            </div>
            <p className="text-gray-600 mb-4">No {activeTab} strategies yet</p>
            <button
              onClick={() => {
                resetNewStrategy();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Create Your First Strategy
            </button>
          </div>
        ) : (
          filteredStrategies.map((strategy) => {
            const CategoryIcon = getCategoryIcon(strategy.category);

            return (
              <div
                key={strategy.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-pink-200 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CategoryIcon size={20} className="text-pink-500" />
                      <h4 className="text-lg">{strategy.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs border ${getPriorityColor(strategy.priority)}`}>
                        {strategy.priority} priority
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(strategy.status)}`}>
                        {strategy.status}
                      </span>
                      <span className="text-xs text-gray-500">Timeline: {strategy.timeline}</span>
                      {strategy.budget && (
                        <span className="text-xs text-gray-500">Budget: {strategy.budget}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingStrategy(strategy);
                        setShowEditModal(true);
                      }}
                      title="Edit strategy"
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                    >
                      <Pencil size={18} className="text-gray-400 group-hover:text-blue-600" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingStrategy(strategy);
                        setShowDeleteModal(true);
                      }}
                      title="Delete strategy"
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                    >
                      <Trash2 size={18} className="text-gray-400 group-hover:text-red-600" />
                    </button>
                    {strategy.status === 'active' && (
                      <button
                        onClick={() => {
                          setStoppingStrategy(strategy);
                          setShowStopModal(true);
                        }}
                        title="Stop strategy"
                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                      >
                        <Clock size={18} className="text-gray-400 group-hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Insight */}
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-900">
                    <span className="font-semibold">AI Insight: </span>
                    {strategy.insight}
                  </p>
                  {strategy.basedOn && strategy.basedOn.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-purple-700 flex-wrap">
                      <span>Based on:</span>
                      {strategy.basedOn.map((source, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-100 rounded">
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Channels (for marketing) */}
                {strategy.channels && strategy.channels.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm mb-2">Channels:</p>
                    <div className="flex flex-wrap gap-2">
                      {strategy.channels.map((channel, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-xs">
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {strategy.actions && strategy.actions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm mb-2">Recommended Actions:</p>
                    <ul className="space-y-2">
                      {strategy.actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Performance (for marketing) */}
                {strategy.performance !== undefined && strategy.status !== 'planned' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Performance</span>
                      <span>{strategy.performance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${strategy.performance}%` }}
                      ></div>
                    </div>
                    {strategy.leads !== undefined && (
                      <p className="text-xs text-gray-600">{strategy.leads} leads generated</p>
                    )}
                  </div>
                )}

                {/* Expected Impact */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-green-500" />
                    <span className="text-gray-600">Expected Impact:</span>
                    <span className="">{strategy.expectedImpact}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {strategy.status !== 'active' ? (
                      <button
                        onClick={async () => {
                          try {
                            // Optimistically update UI immediately
                            setStrategies(prev => 
                              prev.map(s => s.id === strategy.id ? { ...s, status: 'active' } : s)
                            );
                            
                            // Update in background
                            await salesAPI.update(strategy.id, { status: 'active' });
                            toast.success('Strategy implemented successfully');
                          } catch (error) {
                            // Revert on error
                            setStrategies(prev => 
                              prev.map(s => s.id === strategy.id ? { ...s, status: strategy.status } : s)
                            );
                            toast.error('Failed to implement strategy');
                          }
                        }}
                        className="px-4 py-2 bg-pink-500 text-white hover:bg-pink-600 rounded-lg transition-colors text-sm"
                      >
                        Implement
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setStoppingStrategy(strategy);
                          setShowStopModal(true);
                        }}
                        className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition-colors text-sm flex items-center gap-2"
                      >
                        <Clock size={16} />
                        Stop Strategy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Strategy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-xl mb-1">Create {activeTab === 'sales' ? 'Sales Strategy' : 'Marketing Campaign'}</h3>
                <p className="text-sm text-white/80">Add a new {activeTab} strategy</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStrategy.title}
                  onChange={(e) => setNewStrategy({ ...newStrategy, title: e.target.value })}
                  placeholder="Enter strategy title"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Category</label>
                  <select
                    value={newStrategy.category}
                    onChange={(e) => setNewStrategy({ ...newStrategy, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    {activeTab === 'sales' ? (
                      <>
                        <option value="growth">Growth</option>
                        <option value="retention">Retention</option>
                        <option value="revenue">Revenue</option>
                        <option value="competitive">Competitive</option>
                        <option value="pricing">Pricing</option>
                      </>
                    ) : (
                      <>
                        <option value="campaign">Campaign</option>
                        <option value="content">Content</option>
                        <option value="growth">Growth</option>
                        <option value="retention">Retention</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Priority</label>
                  <select
                    value={newStrategy.priority}
                    onChange={(e) => setNewStrategy({ ...newStrategy, priority: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Status</label>
                  <select
                    value={newStrategy.status}
                    onChange={(e) => setNewStrategy({ ...newStrategy, status: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Timeline</label>
                  <input
                    type="text"
                    value={newStrategy.timeline}
                    onChange={(e) => setNewStrategy({ ...newStrategy, timeline: e.target.value })}
                    placeholder="e.g., 2 weeks"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {activeTab === 'marketing' && (
                <div>
                  <label className="block text-sm mb-2">Budget</label>
                  <CurrencyInput
                    value={newStrategy.budget}
                    onChange={(value) => setNewStrategy({ ...newStrategy, budget: value })}
                    placeholder="e.g., $15,000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-2">
                  Insight / Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newStrategy.insight}
                  onChange={(e) => setNewStrategy({ ...newStrategy, insight: e.target.value })}
                  placeholder="Describe the strategy and its context"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Expected Impact</label>
                <input
                  type="text"
                  value={newStrategy.expectedImpact}
                  onChange={(e) => setNewStrategy({ ...newStrategy, expectedImpact: e.target.value })}
                  placeholder="e.g., 25% increase in conversions"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleAddStrategy}
                  disabled={!newStrategy.title || !newStrategy.insight}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Create Strategy
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Strategy Modal */}
      {showEditModal && editingStrategy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-xl mb-1">Edit Strategy</h3>
                <p className="text-sm text-white/80">Update strategy details</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingStrategy.title}
                  onChange={(e) => setEditingStrategy({ ...editingStrategy, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Category</label>
                  <select
                    value={editingStrategy.category}
                    onChange={(e) => setEditingStrategy({ ...editingStrategy, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    {editingStrategy.type === 'sales' ? (
                      <>
                        <option value="growth">Growth</option>
                        <option value="retention">Retention</option>
                        <option value="revenue">Revenue</option>
                        <option value="competitive">Competitive</option>
                        <option value="pricing">Pricing</option>
                      </>
                    ) : (
                      <>
                        <option value="campaign">Campaign</option>
                        <option value="content">Content</option>
                        <option value="growth">Growth</option>
                        <option value="retention">Retention</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Priority</label>
                  <select
                    value={editingStrategy.priority}
                    onChange={(e) => setEditingStrategy({ ...editingStrategy, priority: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Status</label>
                  <select
                    value={editingStrategy.status}
                    onChange={(e) => setEditingStrategy({ ...editingStrategy, status: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Timeline</label>
                  <input
                    type="text"
                    value={editingStrategy.timeline}
                    onChange={(e) => setEditingStrategy({ ...editingStrategy, timeline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {editingStrategy.type === 'marketing' && (
                <div>
                  <label className="block text-sm mb-2">Budget</label>
                  <CurrencyInput
                    value={editingStrategy.budget || ''}
                    onChange={(value) => setEditingStrategy({ ...editingStrategy, budget: value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-2">
                  Insight / Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingStrategy.insight}
                  onChange={(e) => setEditingStrategy({ ...editingStrategy, insight: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Expected Impact</label>
                <input
                  type="text"
                  value={editingStrategy.expectedImpact}
                  onChange={(e) => setEditingStrategy({ ...editingStrategy, expectedImpact: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleEditStrategy}
                  disabled={!editingStrategy.title || !editingStrategy.insight}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingStrategy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <h3 className="text-lg">Delete Strategy</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deletingStrategy.title}"? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteStrategy}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stop Strategy Modal */}
      {showStopModal && stoppingStrategy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock size={24} className="text-orange-600" />
                </div>
                <h3 className="text-lg">Stop Strategy</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to stop "{stoppingStrategy.title}"? The strategy will be marked as completed.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStopStrategy}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Stop Strategy
                </button>
                <button
                  onClick={() => setShowStopModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});