import React, { useState, useEffect } from 'react';
import { Shield, Plus, RefreshCw, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface Competitor {
  id: string;
  name: string;
  brand: string;
  website: string;
  industry: string;
  competitor_type: string;
  price: number;
  market_share: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  market_position: 'leader' | 'challenger' | 'follower' | 'niche';
  product_quality: number;
  pricing_strategy: 'premium' | 'competitive' | 'budget' | 'value';
  innovation_level: number;
  customer_satisfaction: number;
  usp?: string;
  package_design?: string;
  key_features?: string[];
  target_audience: string;
  pain_points: string;
  strengths: string;
  weaknesses: string;
  distribution_channels: string[];
  marketing_channels: string[];
  ai_threat_score: number;
  ai_recommendations: string[];
  last_activity: string;
}

const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const CompetitivePositioning: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState<{
    name: string;
    brand: string;
    threat_level: Competitor['threat_level'];
  }>({
    name: '',
    brand: '',
    threat_level: 'medium',
  });

  // Load competitors on component mount
  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = () => {
    try {
      const saved = localStorage.getItem('copcca-competitors');
      const competitorData = saved ? JSON.parse(saved) : [];
      setCompetitors(competitorData);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    }
  };

  const handleAddCompetitor = () => {
    if (!newCompetitor.name || !newCompetitor.brand) {
      toast.error('Please fill in competitor name and brand');
      return;
    }

    const competitor: Competitor = {
      id: Date.now().toString(),
      name: newCompetitor.name,
      brand: newCompetitor.brand,
      website: '',
      industry: 'CRM Software',
      competitor_type: 'Direct',
      price: 0,
      market_share: 0,
      threat_level: newCompetitor.threat_level,
      market_position: 'challenger',
      product_quality: 7,
      pricing_strategy: 'competitive',
      innovation_level: 6,
      customer_satisfaction: 7.5,
      target_audience: 'Small to Medium Businesses',
      pain_points: 'Integration challenges, complex interfaces',
      strengths: 'Established brand recognition',
      weaknesses: 'Higher pricing, less agile',
      distribution_channels: ['Direct Sales', 'Partners'],
      marketing_channels: ['Website', 'Email', 'Social Media'],
      ai_threat_score: 65,
      ai_recommendations: ['Focus on superior customer support', 'Emphasize ease of use'],
      last_activity: new Date().toISOString(),
    };

    const updatedCompetitors = [...competitors, competitor];
    setCompetitors(updatedCompetitors);
    localStorage.setItem('copcca-competitors', JSON.stringify(updatedCompetitors));
    setNewCompetitor({ name: '', brand: '', threat_level: 'medium' });
    setShowAddModal(false);
    toast.success('Competitor added successfully');
  };

  const handleExportReport = () => {
    const report = `Competitive Positioning Report - ${new Date().toLocaleDateString()}\n\n` +
      `Total Competitors Analyzed: ${competitors.length}\n\n` +
      competitors.map(comp => 
        `Competitor: ${comp.name} (${comp.brand})\n` +
        `Threat Level: ${comp.threat_level}\n` +
        `Market Position: ${comp.market_position}\n` +
        `Key Strengths: ${comp.strengths}\n` +
        `Key Weaknesses: ${comp.weaknesses}\n` +
        `AI Threat Score: ${comp.ai_threat_score}/100\n` +
        `Recommendations: ${comp.ai_recommendations.join(', ')}\n\n`
      ).join('');

    downloadText(`competitive_positioning_${new Date().toISOString().split('T')[0]}.txt`, report);
    toast.success('Competitive report exported');
  };
  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>Add Competitor</Button>
        <Button icon={RefreshCw} variant="outline" onClick={() => {
          loadCompetitors();
          toast.success('Competitive analysis updated');
        }}>Update Analysis</Button>
        <Button
          icon={Download}
          variant="outline"
          onClick={handleExportReport}
        >
          Export Report
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Shield size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Competitive Analysis</h3>
            <p className="text-sm opacity-90">
              {competitors.length > 0 ? (
                <>
                  {competitors.filter(c => c.threat_level === 'high' || c.threat_level === 'critical').length > 0
                    ? `${competitors.filter(c => c.threat_level === 'high' || c.threat_level === 'critical').length} high-threat competitors identified. `
                    : 'No critical competitive threats detected. '
                  }
                  Average competitor threat score: {competitors.length > 0 ? Math.round(competitors.reduce((sum, c) => sum + c.ai_threat_score, 0) / competitors.length) : 0}/100. 
                  Focus on {competitors.some(c => c.marketing_channels.includes('Digital Ads')) ? 'strengthening digital presence' : 'maintaining direct sales advantage'}.
                </>
              ) : (
                'Add competitors to get AI-powered competitive analysis and positioning recommendations.'
              )}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Positioning Map</h3>
          <div className="relative h-80 bg-slate-50 rounded-lg p-4">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-600">High Value</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-600">Low Value</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 -rotate-90">Low Price</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 -rotate-90">High Price</div>
            
            {/* Plot points */}
            <div className="absolute top-1/3 left-1/2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              You
            </div>
            <div className="absolute top-1/4 right-1/3 w-12 h-12 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
              Comp A
            </div>
            <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
              Comp B
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">SWOT Comparison</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-700 mb-1">Strengths</div>
              <div className="text-xs text-slate-600">Direct sales, local support, trust</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-sm font-medium text-red-700 mb-1">Weaknesses</div>
              <div className="text-xs text-slate-600">Digital presence, rural reach</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-700 mb-1">Opportunities</div>
              <div className="text-xs text-slate-600">SMS marketing, reseller network</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm font-medium text-yellow-700 mb-1">Threats</div>
              <div className="text-xs text-slate-600">Competitor A digital dominance</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Competitor Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Competitor">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Competitor Name</label>
            <Input
              value={newCompetitor.name}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
              placeholder="e.g., Competitor Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Brand/Product</label>
            <Input
              value={newCompetitor.brand}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, brand: e.target.value })}
              placeholder="e.g., CRM Pro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Threat Level</label>
            <select
              value={newCompetitor.threat_level}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, threat_level: e.target.value as Competitor['threat_level'] })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddCompetitor}>Add Competitor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
