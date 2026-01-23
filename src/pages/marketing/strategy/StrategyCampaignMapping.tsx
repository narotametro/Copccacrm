import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, AlertTriangle, Target, Plus, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
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

interface Mapping {
  strategy: string;
  campaigns: Campaign[];
  kpis: string;
  status: 'active' | 'review' | 'unmapped';
}

export const StrategyCampaignMapping: React.FC = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    strategy: '',
    budget: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = () => {
    try {
      const saved = localStorage.getItem('copcca-campaigns');
      const campaignData = saved ? JSON.parse(saved) : [];
      setCampaigns(campaignData);
      generateMappings(campaignData);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const generateMappings = (campaignData: Campaign[]) => {
    // Group campaigns by channel/type as strategy
    const strategyGroups = campaignData.reduce((acc, campaign) => {
      const strategy = campaign.channel || 'General Marketing';
      if (!acc[strategy]) {
        acc[strategy] = [];
      }
      acc[strategy].push(campaign);
      return acc;
    }, {} as Record<string, Campaign[]>);

    // Create mappings
    const generatedMappings: Mapping[] = Object.entries(strategyGroups).map(([strategy, camps]) => {
      const totalLeads = camps.length * 25; // Estimated leads per campaign
      const avgConv = camps.reduce((sum, c) => sum + (c.roi > 0 ? c.roi * 0.1 : 0.03), 0) / camps.length;
      const kpis = `${totalLeads} leads, ${(avgConv * 100).toFixed(1)}% conv`;
      
      return {
        strategy,
        campaigns: camps,
        kpis,
        status: camps.length > 0 ? 'active' : 'unmapped',
      };
    });

    // Add unmapped strategies
    const budgetStrategies: { strategy: string }[] = JSON.parse(localStorage.getItem('copcca-budget-allocations') || '[]');
    budgetStrategies.forEach((budget) => {
      if (!generatedMappings.find(m => m.strategy === budget.strategy)) {
        generatedMappings.push({
          strategy: budget.strategy,
          campaigns: [],
          kpis: 'No campaigns yet',
          status: 'unmapped',
        });
      }
    });

    setMappings(generatedMappings);
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.strategy) {
      toast.error('Please fill in campaign name and select strategy');
      return;
    }

    const campaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      status: 'draft',
      budget: parseFloat(newCampaign.budget) || 0,
      spent: 0,
      roi: 0,
      channel: newCampaign.strategy,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };

    const updatedCampaigns = [...campaigns, campaign];
    setCampaigns(updatedCampaigns);
    localStorage.setItem('copcca-campaigns', JSON.stringify(updatedCampaigns));
    generateMappings(updatedCampaigns);
    setNewCampaign({ name: '', strategy: '', budget: '' });
    setShowCreateModal(false);
    toast.success('Campaign created and linked to strategy');
  };

  const handleAutoLink = () => {
    // Auto-link logic: assign campaigns to strategies based on naming patterns
    const updatedCampaigns = campaigns.map(campaign => {
      if (!campaign.channel || campaign.channel === 'General Marketing') {
        // Try to infer strategy from campaign name
        if (campaign.name.toLowerCase().includes('enterprise')) {
          campaign.channel = 'Enterprise Growth';
        } else if (campaign.name.toLowerCase().includes('sme') || campaign.name.toLowerCase().includes('small')) {
          campaign.channel = 'SME Acquisition';
        } else if (campaign.name.toLowerCase().includes('social') || campaign.name.toLowerCase().includes('digital')) {
          campaign.channel = 'Digital Presence';
        } else {
          campaign.channel = 'Brand Awareness';
        }
      }
      return campaign;
    });

    setCampaigns(updatedCampaigns);
    localStorage.setItem('copcca-campaigns', JSON.stringify(updatedCampaigns));
    generateMappings(updatedCampaigns);
    toast.success('Auto-linking complete');
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>Create Campaign from Strategy</Button>
        <Button icon={RefreshCw} variant="outline" onClick={handleAutoLink}>Auto-Link Campaigns</Button>
      </div>

      <Card className="bg-gradient-to-r from-red-500 to-orange-600 text-white border-none">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} />
          <div>
            <h3 className="font-semibold mb-1">Strategy Alignment Rule</h3>
            <p className="text-sm opacity-90">
              Every campaign MUST link to a strategy. {mappings.filter(m => m.status === 'unmapped').length} strategies flagged without campaigns. 
              {campaigns.filter(c => !c.channel || c.channel === 'General Marketing').length} orphan campaigns detected without clear strategy link.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Strategy → Campaign Mapping</h3>
        <div className="space-y-4">
          {mappings.map((item, idx) => (
            <div key={idx} className={`p-4 rounded-lg border-2 ${
              item.status === 'unmapped' ? 'border-red-200 bg-red-50' : 'border-slate-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <Target size={16} className="text-purple-600" />
                    {item.strategy}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{item.kpis}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'active' ? 'bg-green-100 text-green-700' :
                  item.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.status}
                </span>
              </div>
              
              {item.campaigns.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full text-sm">
                      <LinkIcon size={12} className="text-blue-600" />
                      <span className="text-blue-700">{campaign.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle size={16} />
                  <span>No campaigns linked - Action required</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Create Campaign Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Campaign from Strategy">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
            <Input
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              placeholder="e.g., Q1 Enterprise Push"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Link to Strategy</label>
            <select
              value={newCampaign.strategy}
              onChange={(e) => setNewCampaign({ ...newCampaign, strategy: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select strategy...</option>
              {mappings.map((mapping) => (
                <option key={mapping.strategy} value={mapping.strategy}>
                  {mapping.strategy}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Budget (₦)</label>
            <Input
              type="number"
              value={newCampaign.budget}
              onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
              placeholder="50000"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateCampaign}>Create Campaign</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
