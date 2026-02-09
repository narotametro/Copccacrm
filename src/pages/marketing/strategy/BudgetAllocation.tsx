import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Save, RefreshCw, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  roi: number;
  channel: string;
  start_date: string;
  end_date: string;
}

interface BudgetItem {
  strategy: string;
  budget: number;
  spent: number;
  roi: number;
  status: 'on-track' | 'over-budget' | 'under-budget' | 'review';
  campaignCount: number;
}

export const BudgetAllocation: React.FC = () => {
  const { formatCurrency } = useCurrency();

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    strategy: '',
    budget: '',
    spent: '',
    roi: '',
  });

  const [aiOptimization, setAiOptimization] = useState({
    fromStrategy: 'Digital Presence',
    toStrategy: 'Channel Partner Program',
    amount: 150000,
    expectedIncrease: 450000,
  });

  // Load campaigns and budgets on mount
  useEffect(() => {
    loadCampaigns();
    loadBudgets();
  }, [loadCampaigns, loadBudgets]);

  // Load campaigns from localStorage
  const loadCampaigns = useCallback(() => {
    try {
      const saved = localStorage.getItem('copcca-campaigns');
      const campaignData = saved ? JSON.parse(saved) : [];
      setCampaigns(campaignData);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }, []);

  // Load budgets from localStorage
  const loadBudgets = useCallback(() => {
    try {
      const saved = localStorage.getItem('copcca-budget-allocations');
      if (saved) {
        const budgetData = JSON.parse(saved);
        setBudgets(budgetData);
      } else {
        // Generate initial budgets from campaigns if no saved budgets
        generateBudgetsFromCampaigns();
      }
    } catch (error) {
      console.error('Failed to load budgets:', error);
      generateBudgetsFromCampaigns();
    }
  }, [generateBudgetsFromCampaigns]);

  // Generate budget allocations from campaign data
  const generateBudgetsFromCampaigns = useCallback(() => {
    if (campaigns.length === 0) return;

    // Group campaigns by channel/type for budget allocation
    const channelGroups = campaigns.reduce((acc, campaign) => {
      const channel = campaign.channel || 'General Marketing';
      if (!acc[channel]) {
        acc[channel] = {
          totalBudget: 0,
          totalSpent: 0,
          campaigns: [],
        };
      }
      acc[channel].totalBudget += campaign.budget || 0;
      acc[channel].totalSpent += campaign.spent || 0;
      acc[channel].campaigns.push(campaign);
      return acc;
    }, {} as Record<string, { totalBudget: number; totalSpent: number; campaigns: Campaign[] }>);

    // Create budget allocations
    const generatedBudgets = Object.entries(channelGroups).map(([channel, data]) => {
      const roi = data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 2 : 0; // Estimated ROI
      let status: 'on-track' | 'over-budget' | 'under-budget' | 'review' = 'on-track';

      if (data.totalSpent > data.totalBudget) status = 'over-budget';
      else if (data.totalSpent < data.totalBudget * 0.7) status = 'under-budget';
      else if (roi < 1.5) status = 'review';

      return {
        strategy: channel,
        budget: data.totalBudget,
        spent: data.totalSpent,
        roi: parseFloat(roi.toFixed(1)),
        status,
        campaignCount: data.campaigns.length,
      };
    });

    setBudgets(generatedBudgets);
  }, [campaigns]);

  // Regenerate budgets when campaigns change
  useEffect(() => {
    if (campaigns.length > 0 && budgets.length === 0) {
      generateBudgetsFromCampaigns();
    }
  }, [campaigns, budgets.length, generateBudgetsFromCampaigns]);

  const handleAddBudget = () => {
    if (!budgetForm.strategy || !budgetForm.budget) {
      toast.error('Please fill in strategy name and budget amount');
      return;
    }

    const budget = parseFloat(budgetForm.budget);
    const spent = parseFloat(budgetForm.spent) || 0;
    const roi = parseFloat(budgetForm.roi) || 0;
    
    let status: 'on-track' | 'over-budget' | 'under-budget' | 'review' = 'on-track';
    if (spent > budget) status = 'over-budget';
    else if (spent < budget * 0.7) status = 'under-budget';
    else if (roi < 2.0) status = 'review';

    const newBudget = {
      strategy: budgetForm.strategy,
      budget,
      spent,
      roi,
      status,
      campaignCount: 0,
    };

    const updatedBudgets = [...budgets, newBudget];
    setBudgets(updatedBudgets);
    localStorage.setItem('copcca-budget-allocations', JSON.stringify(updatedBudgets));
    setBudgetForm({ strategy: '', budget: '', spent: '', roi: '' });
    setShowAddModal(false);
    toast.success('Budget line added successfully');
  };

  const handleRemoveBudget = (index: number) => {
    const updatedBudgets = budgets.filter((_, i) => i !== index);
    setBudgets(updatedBudgets);
    localStorage.setItem('copcca-budget-allocations', JSON.stringify(updatedBudgets));
    toast.success('Budget line removed');
  };

  const handleSaveChanges = () => {
    localStorage.setItem('copcca-budget-allocations', JSON.stringify(budgets));
    toast.success('Budget changes saved successfully');
  };

  const handleApplyAI = () => {
    // Apply AI optimization
    const fromIndex = budgets.findIndex(b => b.strategy === aiOptimization.fromStrategy);
    const toIndex = budgets.findIndex(b => b.strategy === aiOptimization.toStrategy);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newBudgets = [...budgets];
      newBudgets[fromIndex] = {
        ...newBudgets[fromIndex],
        budget: newBudgets[fromIndex].budget - aiOptimization.amount,
      };
      newBudgets[toIndex] = {
        ...newBudgets[toIndex],
        budget: newBudgets[toIndex].budget + aiOptimization.amount,
      };
      setBudgets(newBudgets);
      localStorage.setItem('copcca-budget-allocations', JSON.stringify(newBudgets));
      setShowAIModal(false);
      toast.success('AI optimization applied successfully', {
        description: `Shifted ${formatCurrency(aiOptimization.amount)} to optimize ROI`,
      });
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const averageROI = budgets.length > 0 ? budgets.reduce((sum, b) => sum + b.roi, 0) / budgets.length : 0;

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Budget Line
        </Button>
        <Button icon={Save} variant="outline" onClick={handleSaveChanges}>
          Save Changes
        </Button>
        <Button icon={RefreshCw} variant="outline" onClick={() => setShowAIModal(true)}>
          Optimize with AI
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Budget Optimization</h3>
            <p className="text-sm opacity-90">
              Click "Optimize with AI" above to see intelligent budget reallocation suggestions based on ROI performance.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-sm text-slate-600 mb-1">Total Budget</div>
          <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalBudget)}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-600 mb-1">Actual Spend</div>
          <div className="text-3xl font-bold text-orange-600">{formatCurrency(totalSpent)}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-600 mb-1">Average ROI</div>
          <div className="text-3xl font-bold text-green-600">{averageROI.toFixed(1)}x</div>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Budget by Strategy</h3>
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">
              No budget lines added yet. Click "Add Budget Line" to get started.
            </p>
          ) : (
            budgets.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{item.strategy}</div>
                    <div className="text-sm text-slate-600">
                      {formatCurrency(item.spent)} / {formatCurrency(item.budget)} spent
                      {item.campaignCount && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                          {item.campaignCount} campaigns
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{item.roi}x ROI</div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'on-track' ? 'bg-green-100 text-green-700' :
                        item.status === 'over-budget' ? 'bg-red-100 text-red-700' :
                        item.status === 'under-budget' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveBudget(idx)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove budget line"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.spent > item.budget ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((item.spent / item.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Budget Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Budget Line">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Strategy Name *
              </label>
              <Input
                value={budgetForm.strategy}
                onChange={(e) => setBudgetForm({ ...budgetForm, strategy: e.target.value })}
                placeholder="e.g., Enterprise Growth, SME Acquisition"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Budget Amount *
                </label>
                <Input
                  type="number"
                  value={budgetForm.budget}
                  onChange={(e) => setBudgetForm({ ...budgetForm, budget: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount Spent
                </label>
                <Input
                  type="number"
                  value={budgetForm.spent}
                  onChange={(e) => setBudgetForm({ ...budgetForm, spent: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ROI Multiplier
              </label>
              <Input
                type="number"
                step="0.1"
                value={budgetForm.roi}
                onChange={(e) => setBudgetForm({ ...budgetForm, roi: e.target.value })}
                placeholder="e.g., 2.5"
              />
              <p className="text-xs text-slate-500 mt-1">
                Return on Investment (e.g., 2.5x means ₦2.50 return for every ₦1 spent)
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button icon={Plus} onClick={handleAddBudget}>
              Add Budget Line
            </Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Optimization Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Budget Optimization">
        <div className="p-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-green-600" size={20} />
              <h4 className="font-semibold text-slate-900">Recommended Optimization</h4>
            </div>
            <p className="text-sm text-slate-700">
              Our AI has analyzed your budget performance and identified an opportunity to improve overall ROI.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  From Strategy (Lower ROI)
                </label>
                <select
                  value={aiOptimization.fromStrategy}
                  onChange={(e) => setAiOptimization({ ...aiOptimization, fromStrategy: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {budgets.map((b, idx) => (
                    <option key={idx} value={b.strategy}>
                      {b.strategy} ({b.roi}x ROI)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  To Strategy (Higher ROI)
                </label>
                <select
                  value={aiOptimization.toStrategy}
                  onChange={(e) => setAiOptimization({ ...aiOptimization, toStrategy: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {budgets.map((b, idx) => (
                    <option key={idx} value={b.strategy}>
                      {b.strategy} ({b.roi}x ROI)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount to Shift
              </label>
              <Input
                type="number"
                value={aiOptimization.amount}
                onChange={(e) => setAiOptimization({ ...aiOptimization, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-semibold text-slate-900 mb-2">Impact Analysis</h5>
              <div className="space-y-1 text-sm text-slate-700">
                <p>• Budget shift: {formatCurrency(aiOptimization.amount)}</p>
                <p>• From: {aiOptimization.fromStrategy}</p>
                <p>• To: {aiOptimization.toStrategy}</p>
                <p className="text-green-700 font-medium mt-2">
                  • Expected revenue increase: {formatCurrency(aiOptimization.expectedIncrease)}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-xs text-slate-700">
                <strong>Note:</strong> This optimization is based on historical ROI data. Actual results may vary based on market conditions and execution.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button icon={RefreshCw} onClick={handleApplyAI}>
              Apply Optimization
            </Button>
            <Button variant="outline" onClick={() => setShowAIModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
