import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Brain, Shield, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CompetitiveDeal {
  id: string;
  deal_name: string;
  customer: string;
  competitors: string[];
  our_strengths: string[];
  competitor_strengths: string[];
  ai_risk_score: number;
  ai_risk_level: 'low' | 'medium' | 'high' | 'critical';
  ai_recommendations: string[];
  differentiation_strategy: string;
  win_probability: number;
}

const initialDeals: CompetitiveDeal[] = [
  {
    id: '1',
    deal_name: 'Global Manufacturing CRM',
    customer: 'Acme Industries',
    competitors: ['Salesforce', 'Microsoft Dynamics'],
    our_strengths: [
      'Manufacturing-specific features',
      'Compliance certification (ISO/FDA)',
      'Faster implementation (6 weeks vs 12 weeks)',
      'Lower total cost of ownership',
    ],
    competitor_strengths: [
      'Brand recognition',
      'Larger ecosystem',
      'More integrations',
    ],
    ai_risk_score: 35,
    ai_risk_level: 'medium',
    ai_recommendations: [
      'Emphasize compliance certification - critical requirement for customer',
      'Arrange site visit to similar manufacturing customer',
      'Offer proof of concept with compliance audit',
      'Position as specialized vs generalist',
    ],
    differentiation_strategy: 'Vertical specialization + compliance expertise',
    win_probability: 65,
  },
  {
    id: '2',
    deal_name: 'Tech Startup Growth Platform',
    customer: 'StartupX',
    competitors: ['HubSpot', 'Pipedrive'],
    our_strengths: [
      'Better scalability architecture',
      'Real-time collaboration features',
      'Superior AI capabilities',
      'Flexible pricing for growth',
    ],
    competitor_strengths: [
      'Established market presence',
      'More content/resources',
      'Simpler initial setup',
    ],
    ai_risk_score: 55,
    ai_risk_level: 'high',
    ai_recommendations: [
      'Demo scalability with live performance test',
      'Showcase AI features that competitors lack',
      'Provide growth-stage customer references',
      'Offer extended trial with full features',
    ],
    differentiation_strategy: 'Technical superiority + growth-stage focus',
    win_probability: 48,
  },
  {
    id: '3',
    deal_name: 'Regional Services Automation',
    customer: 'Pro Services Co',
    competitors: ['Zoho', 'Monday.com'],
    our_strengths: [
      'Services-specific templates',
      'Excellent customer support',
      'Easy migration process',
      'Competitive pricing',
    ],
    competitor_strengths: [
      'Lower price point',
      'Simpler interface',
      'More marketing presence',
    ],
    ai_risk_score: 25,
    ai_risk_level: 'low',
    ai_recommendations: [
      'Emphasize ROI and efficiency gains',
      'Offer free migration and setup',
      'Provide side-by-side feature comparison',
      'Schedule demo with similar customer testimonial',
    ],
    differentiation_strategy: 'Value + service quality',
    win_probability: 72,
  },
];

interface CompetitiveDealPositioningProps {
  onBack: () => void;
}

export const CompetitiveDealPositioning: React.FC<CompetitiveDealPositioningProps> = ({ onBack }) => {
  const [deals, setDeals] = useState<CompetitiveDeal[]>(initialDeals);
  const [form, setForm] = useState({
    deal_name: '',
    customer: '',
    competitors: '',
    our_strengths: '',
    competitor_strengths: '',
    ai_risk_score: '',
    ai_risk_level: 'medium',
    ai_recommendations: '',
    differentiation_strategy: '',
    win_probability: '',
  });

  const avgRisk = Math.round(
    deals.reduce((sum, deal) => sum + deal.ai_risk_score, 0) / (deals.length || 1)
  );
  const avgWinProb = Math.round(
    deals.reduce((sum, deal) => sum + deal.win_probability, 0) / (deals.length || 1)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deal_name || !form.customer) return;

    const newDeal: CompetitiveDeal = {
      id: crypto.randomUUID(),
      deal_name: form.deal_name,
      customer: form.customer,
      competitors: form.competitors ? form.competitors.split(',').map((c) => c.trim()).filter(Boolean) : [],
      our_strengths: form.our_strengths ? form.our_strengths.split(',').map((s) => s.trim()).filter(Boolean) : [],
      competitor_strengths: form.competitor_strengths ? form.competitor_strengths.split(',').map((s) => s.trim()).filter(Boolean) : [],
      ai_risk_score: Number(form.ai_risk_score) || 0,
      ai_risk_level: form.ai_risk_level as CompetitiveDeal['ai_risk_level'],
      ai_recommendations: form.ai_recommendations ? form.ai_recommendations.split(',').map((r) => r.trim()).filter(Boolean) : [],
      differentiation_strategy: form.differentiation_strategy || 'Not specified',
      win_probability: Number(form.win_probability) || 0,
    };

    setDeals((prev) => [newDeal, ...prev]);
    setForm({
      deal_name: '',
      customer: '',
      competitors: '',
      our_strengths: '',
      competitor_strengths: '',
      ai_risk_score: '',
      ai_risk_level: 'medium',
      ai_recommendations: '',
      differentiation_strategy: '',
      win_probability: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="outline" icon={ArrowLeft} onClick={onBack}>
        Back to Strategy
      </Button>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-blue-600" size={20} />
            <span className="text-xs text-slate-600">Competitive Deals</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{deals.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-green-600" size={20} />
            <span className="text-xs text-slate-600">Avg Win Probability</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgWinProb}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-orange-600" size={20} />
            <span className="text-xs text-slate-600">Avg Risk Score</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgRisk}/100</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="text-purple-600" size={20} />
            <span className="text-xs text-slate-600">AI Insights</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{deals.length * 4}</div>
        </Card>
      </div>

      {/* Competitive Deals */}
      <div className="space-y-4">
        {deals.map((deal) => (
          <Card key={deal.id} className="p-5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{deal.deal_name}</h3>
                <p className="text-sm text-slate-600">{deal.customer}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">{deal.win_probability}%</div>
                <div className="text-xs text-slate-600">Win Probability</div>
              </div>
            </div>

            {/* Competitors */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">Competing Against</div>
              <div className="flex flex-wrap gap-2">
                {deal.competitors.map((comp, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {comp}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Risk Assessment */}
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="text-purple-600" size={20} />
                  <span className="text-sm font-medium text-purple-900">AI Risk Assessment</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  deal.ai_risk_level === 'low' ? 'bg-green-100 text-green-700' :
                  deal.ai_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  deal.ai_risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {deal.ai_risk_level.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        deal.ai_risk_level === 'low' ? 'bg-green-500' :
                        deal.ai_risk_level === 'medium' ? 'bg-yellow-500' :
                        deal.ai_risk_level === 'high' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${deal.ai_risk_score}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-purple-900">{deal.ai_risk_score}/100</span>
              </div>
            </div>

            {/* Strengths Comparison */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-green-700 mb-2">
                  <TrendingUp size={14} />
                  <span>Our Strengths</span>
                </div>
                <div className="space-y-1">
                  {deal.our_strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-sm text-slate-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-red-700 mb-2">
                  <AlertTriangle size={14} />
                  <span>Competitor Strengths</span>
                </div>
                <div className="space-y-1">
                  {deal.competitor_strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-sm text-slate-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">AI Recommendations</div>
              <div className="space-y-2">
                {deal.ai_recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                    <Brain className="text-blue-600 flex-shrink-0 mt-0.5" size={14} />
                    <span className="text-sm text-blue-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Differentiation Strategy */}
            <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
              <div className="text-xs font-medium text-purple-900 mb-1">Differentiation Strategy</div>
              <p className="text-sm text-purple-700 font-medium">{deal.differentiation_strategy}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Add Competitive Deal</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAdd}>
          <Input
            label="Deal Name"
            value={form.deal_name}
            onChange={(e) => setForm({ ...form, deal_name: e.target.value })}
            required
          />
          <Input
            label="Customer"
            value={form.customer}
            onChange={(e) => setForm({ ...form, customer: e.target.value })}
            required
          />
          <Input
            label="Competitors (comma separated)"
            value={form.competitors}
            onChange={(e) => setForm({ ...form, competitors: e.target.value })}
          />
          <Input
            label="Our Strengths (comma separated)"
            value={form.our_strengths}
            onChange={(e) => setForm({ ...form, our_strengths: e.target.value })}
          />
          <Input
            label="Competitor Strengths (comma separated)"
            value={form.competitor_strengths}
            onChange={(e) => setForm({ ...form, competitor_strengths: e.target.value })}
          />
          <Input
            label="Win Probability (%)"
            type="number"
            value={form.win_probability}
            onChange={(e) => setForm({ ...form, win_probability: e.target.value })}
          />
          <Input
            label="AI Risk Score (0-100)"
            type="number"
            value={form.ai_risk_score}
            onChange={(e) => setForm({ ...form, ai_risk_score: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">AI Risk Level</label>
            <select
              value={form.ai_risk_level}
              onChange={(e) => setForm({ ...form, ai_risk_level: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <Input
            label="AI Recommendations (comma separated)"
            value={form.ai_recommendations}
            onChange={(e) => setForm({ ...form, ai_recommendations: e.target.value })}
          />
          <Input
            label="Differentiation Strategy"
            value={form.differentiation_strategy}
            onChange={(e) => setForm({ ...form, differentiation_strategy: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Add Deal</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
