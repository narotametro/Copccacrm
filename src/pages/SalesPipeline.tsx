import React, { useState } from 'react';
import {
  Plus,
  DollarSign,
  Target,
  AlertTriangle,
  Award,
  Brain,
  Zap,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  company_id: string;
  companies?: { name: string };
  
  // AI Scoring
  ai_probability: number; // 0-100
  ai_confidence: 'low' | 'medium' | 'high';
  
  // Competitive Intelligence
  competitors_in_play: string[];
  primary_competitor: string | null;
  competitive_advantage: string;
  
  // Next Best Action
  next_action: string;
  action_priority: 'low' | 'medium' | 'high' | 'urgent';
  action_deadline: string;
  
  // Deal Context
  contact_name: string;
  last_contact: string;
  days_in_stage: number;
  estimated_close_date: string;
  
  // Win/Loss Factors
  win_factors: string[];
  risk_factors: string[];
}

const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
const stageColors: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700 border-slate-300',
  qualified: 'bg-blue-100 text-blue-700 border-blue-300',
  proposal: 'bg-purple-100 text-purple-700 border-purple-300',
  negotiation: 'bg-orange-100 text-orange-700 border-orange-300',
  'closed-won': 'bg-green-100 text-green-700 border-green-300',
  'closed-lost': 'bg-red-100 text-red-700 border-red-300',
};

// Demo data with AI scoring
const demoDeals: Deal[] = [
  {
    id: '1',
    title: 'Enterprise CRM License',
    value: 85000,
    stage: 'negotiation',
    company_id: '1',
    companies: { name: 'Acme Corp' },
    ai_probability: 82,
    ai_confidence: 'high',
    competitors_in_play: ['Salesforce', 'HubSpot'],
    primary_competitor: 'Salesforce',
    competitive_advantage: 'Lower price, better support, AI features',
    next_action: 'Schedule final pricing discussion with CFO',
    action_priority: 'urgent',
    action_deadline: '2026-01-09',
    contact_name: 'Sarah Johnson',
    last_contact: '2026-01-06',
    days_in_stage: 8,
    estimated_close_date: '2026-01-15',
    win_factors: ['Strong champion (Sarah)', 'Budget approved', 'Pain point identified'],
    risk_factors: ['Competitor offering discount', 'Legal review pending']
  },
  {
    id: '2',
    title: 'Cloud Migration Project',
    value: 120000,
    stage: 'proposal',
    company_id: '2',
    companies: { name: 'GlobalTech Inc' },
    ai_probability: 65,
    ai_confidence: 'medium',
    competitors_in_play: ['Microsoft', 'Zoho'],
    primary_competitor: 'Microsoft',
    competitive_advantage: 'African market expertise, local support',
    next_action: 'Send customized ROI analysis',
    action_priority: 'high',
    action_deadline: '2026-01-10',
    contact_name: 'David Chen',
    last_contact: '2026-01-05',
    days_in_stage: 12,
    estimated_close_date: '2026-01-25',
    win_factors: ['Large budget', 'Urgency to migrate', 'Multiple decision makers engaged'],
    risk_factors: ['Complex approval process', 'Competitor has existing relationship']
  },
  {
    id: '3',
    title: 'Marketing Automation Suite',
    value: 45000,
    stage: 'qualified',
    company_id: '3',
    companies: { name: 'MegaCorp Ltd' },
    ai_probability: 55,
    ai_confidence: 'medium',
    competitors_in_play: ['HubSpot', 'Marketo'],
    primary_competitor: 'HubSpot',
    competitive_advantage: 'Better integration with local payment systems',
    next_action: 'Schedule product demo with marketing team',
    action_priority: 'medium',
    action_deadline: '2026-01-12',
    contact_name: 'Linda Wang',
    last_contact: '2026-01-04',
    days_in_stage: 5,
    estimated_close_date: '2026-02-01',
    win_factors: ['Growing fast', 'Need better analytics'],
    risk_factors: ['Limited budget', 'Evaluating 3 vendors']
  },
  {
    id: '4',
    title: 'Sales Training Program',
    value: 15000,
    stage: 'lead',
    company_id: '4',
    companies: { name: 'StartupX' },
    ai_probability: 35,
    ai_confidence: 'low',
    competitors_in_play: ['Unknown'],
    primary_competitor: null,
    competitive_advantage: 'SMB-focused pricing and support',
    next_action: 'Follow up on initial inquiry, qualify budget',
    action_priority: 'low',
    action_deadline: '2026-01-14',
    contact_name: 'Mike Brown',
    last_contact: '2026-01-02',
    days_in_stage: 3,
    estimated_close_date: '2026-02-15',
    win_factors: ['Growing sales team', 'Open to new solutions'],
    risk_factors: ['Startup budget constraints', 'Not urgent']
  },
  {
    id: '5',
    title: 'API Integration Package',
    value: 32000,
    stage: 'closed-won',
    company_id: '5',
    companies: { name: 'TechFlow Systems' },
    ai_probability: 100,
    ai_confidence: 'high',
    competitors_in_play: [],
    primary_competitor: null,
    competitive_advantage: 'Technical expertise, fast implementation',
    next_action: 'Begin onboarding process',
    action_priority: 'high',
    action_deadline: '2026-01-08',
    contact_name: 'Alex Rivera',
    last_contact: '2026-01-07',
    days_in_stage: 1,
    estimated_close_date: '2026-01-07',
    win_factors: ['Strong technical fit', 'Competitive pricing', 'Fast response time'],
    risk_factors: []
  },
  {
    id: '6',
    title: 'Analytics Dashboard',
    value: 28000,
    stage: 'closed-lost',
    company_id: '6',
    companies: { name: 'DataCorp' },
    ai_probability: 0,
    ai_confidence: 'high',
    competitors_in_play: ['Tableau'],
    primary_competitor: 'Tableau',
    competitive_advantage: 'None - they chose enterprise solution',
    next_action: 'Send feedback survey, stay in touch for future',
    action_priority: 'low',
    action_deadline: '2026-01-20',
    contact_name: 'Emma Davis',
    last_contact: '2026-01-05',
    days_in_stage: 2,
    estimated_close_date: '',
    win_factors: [],
    risk_factors: ['Went with enterprise vendor', 'Price too high', 'Lacked advanced features']
  },
];

export const SalesPipeline: React.FC = () => {
  const [deals] = useState<Deal[]>(demoDeals);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const getDealsByStage = (stage: string) => {
    return deals.filter((deal) => deal.stage === stage);
  };

  const getTotalValue = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0);
  };

  const getAvgProbability = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    if (stageDeals.length === 0) return 0;
    return Math.round(stageDeals.reduce((sum, deal) => sum + deal.ai_probability, 0) / stageDeals.length);
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-blue-600';
    if (probability >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      low: 'bg-slate-100 text-slate-700 border-slate-300',
    };
    return colors[priority as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  // Win/Loss Analysis
  const wonDeals = deals.filter(d => d.stage === 'closed-won');
  const lostDeals = deals.filter(d => d.stage === 'closed-lost');
  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
  const avgDealSize = deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0;
  const forecastRevenue = deals
    .filter(d => !d.stage.startsWith('closed'))
    .reduce((sum, d) => sum + (d.value * d.ai_probability / 100), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">📊 Sales Pipeline (AI)</h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">AI-powered deal scoring and competitive intelligence</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)} className="text-sm md:text-base">Add Deal</Button>
      </div>

      {/* AI Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="border-l-4 border-primary-500">
          <Brain className="text-primary-600 mb-1 md:mb-2" size={20} />
          <p className="text-xs md:text-sm text-slate-600">AI Forecast</p>
          <p className="text-xl md:text-2xl font-bold text-primary-600">₦{(forecastRevenue / 1000).toFixed(0)}K</p>
        </Card>
        <Card className="border-l-4 border-green-500">
          <Award className="text-green-600 mb-1 md:mb-2" size={20} />
          <p className="text-xs md:text-sm text-slate-600">Win Rate</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">{winRate}%</p>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <DollarSign className="text-blue-600 mb-1 md:mb-2" size={20} />
          <p className="text-xs md:text-sm text-slate-600">Avg Deal Size</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600">₦{(avgDealSize / 1000).toFixed(0)}K</p>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <Target className="text-orange-600 mb-1 md:mb-2" size={20} />
          <p className="text-xs md:text-sm text-slate-600">Active Deals</p>
          <p className="text-xl md:text-2xl font-bold text-orange-600">{deals.filter(d => !d.stage.startsWith('closed')).length}</p>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <Shield className="text-purple-600 mb-1 md:mb-2" size={20} />
          <p className="text-xs md:text-sm text-slate-600">At Risk</p>
          <p className="text-xl md:text-2xl font-bold text-purple-600">
            {deals.filter(d => d.action_priority === 'urgent' && !d.stage.startsWith('closed')).length}
          </p>
        </Card>
      </div>

      {/* Kanban Board with AI Scoring */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="inline-flex lg:grid lg:grid-cols-6 gap-3 md:gap-4 min-w-full lg:min-w-0">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage);
          const totalValue = getTotalValue(stage);
          const avgProb = getAvgProbability(stage);

          return (
            <div key={stage} className="w-72 lg:w-auto flex-shrink-0 lg:flex-shrink">
              <Card className="h-full">
                <div className="mb-4 pb-3 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 capitalize">
                      {stage === 'closed-won' ? '✅ Won' :
                       stage === 'closed-lost' ? '❌ Lost' :
                       stage}
                    </h3>
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-bold">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">₦{(totalValue / 1000).toFixed(0)}K</span>
                    {!stage.startsWith('closed') && (
                      <span className={`font-bold ${getProbabilityColor(avgProb)}`}>
                        {avgProb}% avg
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 bg-white border-2 border-slate-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedDeal(deal)}
                    >
                      {/* Deal Header */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 text-sm leading-tight flex-1">
                          {deal.title}
                        </h4>
                        {!deal.stage.startsWith('closed') && (
                          <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded border ${getPriorityColor(deal.action_priority)}`}>
                            {deal.action_priority === 'urgent' ? '🔥' : ''}
                            {deal.action_priority.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mb-2">{deal.companies?.name}</p>

                      {/* AI Probability */}
                      {!deal.stage.startsWith('closed') && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-600">AI Probability</span>
                            <span className={`text-xs font-bold ${getProbabilityColor(deal.ai_probability)}`}>
                              {deal.ai_probability}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                deal.ai_probability >= 75 ? 'bg-green-500' :
                                deal.ai_probability >= 50 ? 'bg-blue-500' :
                                deal.ai_probability >= 25 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${deal.ai_probability}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Competitor Indicator */}
                      {deal.primary_competitor && (
                        <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-xs text-orange-900 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            <span className="font-bold">vs {deal.primary_competitor}</span>
                          </p>
                        </div>
                      )}

                      {/* Value & Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center text-sm font-bold text-slate-900">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ₦{(deal.value / 1000).toFixed(0)}K
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          icon={Eye}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeal(deal);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
        </div>
      </div>

      {/* Detailed Deal Modal */}
      {selectedDeal && (
        <Modal
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          title={selectedDeal.title}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedDeal.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${stageColors[selectedDeal.stage]}`}>
                    {selectedDeal.stage === 'closed-won' ? '✅ WON' :
                     selectedDeal.stage === 'closed-lost' ? '❌ LOST' :
                     selectedDeal.stage.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-600">{selectedDeal.companies?.name}</p>
                <p className="text-sm text-slate-500">Contact: {selectedDeal.contact_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Deal Value</p>
                <p className="text-3xl font-bold text-green-600">₦{(selectedDeal.value / 1000).toFixed(0)}K</p>
              </div>
            </div>

            {/* AI Scoring */}
            {!selectedDeal.stage.startsWith('closed') && (
              <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center">
                    <Brain className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">🤖 AI Win Probability</h3>
                    <p className="text-sm text-slate-600">Based on historical data & current signals</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Probability Score</span>
                    <span className={`text-2xl font-bold ${getProbabilityColor(selectedDeal.ai_probability)}`}>
                      {selectedDeal.ai_probability}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full flex items-center justify-end pr-2 ${
                        selectedDeal.ai_probability >= 75 ? 'bg-green-500' :
                        selectedDeal.ai_probability >= 50 ? 'bg-blue-500' :
                        selectedDeal.ai_probability >= 25 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${selectedDeal.ai_probability}%` }}
                    >
                      <span className="text-xs font-bold text-white">{selectedDeal.ai_probability}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Confidence</p>
                    <p className="font-bold text-slate-900 capitalize">{selectedDeal.ai_confidence}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Days in Stage</p>
                    <p className="font-bold text-slate-900">{selectedDeal.days_in_stage} days</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Est. Close</p>
                    <p className="font-bold text-slate-900 text-xs">
                      {new Date(selectedDeal.estimated_close_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Next Best Action */}
            {!selectedDeal.stage.startsWith('closed') && (
              <Card className={`border-l-4 ${
                selectedDeal.action_priority === 'urgent' ? 'border-red-500 bg-red-50' :
                selectedDeal.action_priority === 'high' ? 'border-orange-500 bg-orange-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start gap-3">
                  <Zap className={`flex-shrink-0 mt-1 ${
                    selectedDeal.action_priority === 'urgent' ? 'text-red-600' :
                    selectedDeal.action_priority === 'high' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} size={24} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900">⚡ Next Best Action</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(selectedDeal.action_priority)}`}>
                        {selectedDeal.action_priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-800 mb-2">{selectedDeal.next_action}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} className="text-slate-600" />
                      <span className="text-slate-600">
                        Deadline: <span className="font-bold">{new Date(selectedDeal.action_deadline).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => toast.success('Action marked as complete')}>
                        Complete Action
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => toast.success('Reminder set')}>
                        Set Reminder
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Competitive Intelligence */}
            {selectedDeal.competitors_in_play.length > 0 && (
              <Card className="border-l-4 border-orange-500">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="text-orange-600" size={20} />
                  🎯 Competitive Intelligence
                </h3>
                
                {selectedDeal.primary_competitor && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-3">
                    <p className="text-sm font-bold text-orange-900 mb-1">Primary Competitor:</p>
                    <p className="text-lg font-bold text-orange-700">{selectedDeal.primary_competitor}</p>
                  </div>
                )}

                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">All Competitors in Play:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDeal.competitors_in_play.map((comp, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-bold text-green-900 mb-1">💪 Your Competitive Advantage:</p>
                  <p className="text-sm text-green-800">{selectedDeal.competitive_advantage}</p>
                </div>
              </Card>
            )}

            {/* Win/Loss Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDeal.win_factors.length > 0 && (
                <Card className="border-l-4 border-green-500">
                  <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle size={20} />
                    Win Factors
                  </h3>
                  <ul className="space-y-2">
                    {selectedDeal.win_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {selectedDeal.risk_factors.length > 0 && (
                <Card className="border-l-4 border-red-500">
                  <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <XCircle size={20} />
                    Risk Factors
                  </h3>
                  <ul className="space-y-2">
                    {selectedDeal.risk_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                        <span className="text-red-600 font-bold">⚠</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Deal Timeline */}
            <Card>
              <h3 className="font-bold text-slate-900 mb-3">📅 Deal Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Last Contact</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedDeal.last_contact).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Days in Current Stage</span>
                  <span className="font-bold text-slate-900">{selectedDeal.days_in_stage} days</span>
                </div>
                {selectedDeal.estimated_close_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Estimated Close Date</span>
                    <span className="font-bold text-slate-900">
                      {new Date(selectedDeal.estimated_close_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </Modal>
      )}

      {/* Add Deal Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Deal"
        size="lg"
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          toast.success('Deal added successfully! AI is analyzing...');
          setShowAddModal(false);
        }}>
          <p className="text-sm text-slate-600">AI will automatically score and provide recommendations</p>
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Deal Title" placeholder="Enterprise License" required />
            <Input label="Company Name" placeholder="Acme Corp" required />
            <Input label="Deal Value (₦)" placeholder="50000" type="number" required />
            <Input label="Contact Name" placeholder="Sarah Johnson" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Deal & Get AI Score</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
