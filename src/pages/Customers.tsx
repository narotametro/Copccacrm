import React, { useState } from 'react';
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Globe,
  Eye,
  MessageSquare,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Brain,
  Send,
  Linkedin,
  Twitter,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  customer_type: 'lead' | 'active' | 'vip' | 'at-risk';
  health_score: number | null;
  churn_risk: number;
  upsell_potential: number;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin?: string;
  twitter?: string;
  total_revenue: number;
  purchases: number;
  avg_order_value: number;
  last_purchase: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  sentiment: 'positive' | 'neutral' | 'negative';
  feedback_count: number;
  jtbd: string;
  pain_points: string[];
  feedback_history: {
    id: string;
    date: string;
    type: 'positive' | 'negative' | 'neutral';
    comment: string;
    category: string;
  }[];
  priority_actions: string[];
}

// Demo data
const demoCompanies: Company[] = [
  { 
    id: '1', 
    name: 'Acme Corp', 
    industry: 'Technology', 
    status: 'active',
    customer_type: 'vip',
    health_score: 85, 
    churn_risk: 12,
    upsell_potential: 78,
    email: 'contact@acme.com', 
    phone: '+234 801 234 5678', 
    website: 'acme.com',
    linkedin: 'linkedin.com/company/acme',
    twitter: '@acmecorp',
    total_revenue: 5200000,
    purchases: 24,
    avg_order_value: 216667,
    last_purchase: '2026-01-05',
    tier: 'platinum',
    sentiment: 'positive',
    feedback_count: 12,
    jtbd: 'Need scalable enterprise software solution',
    pain_points: ['Manual data entry taking too much time', 'Need better reporting capabilities', 'Integration with existing tools'],
    feedback_history: [
      { id: '1', date: '2026-01-05', type: 'positive', comment: 'Love the new AI features!', category: 'Product' },
      { id: '2', date: '2026-01-03', type: 'negative', comment: 'Dashboard loading slowly', category: 'Performance' },
      { id: '3', date: '2025-12-28', type: 'positive', comment: 'Excellent customer support', category: 'Support' }
    ],
    priority_actions: ['Upsell premium support package', 'Schedule quarterly review', 'Share new features roadmap']
  },
  { 
    id: '2', 
    name: 'GlobalTech Inc', 
    industry: 'Software', 
    status: 'active',
    customer_type: 'active',
    health_score: 92, 
    churn_risk: 8,
    upsell_potential: 85,
    email: 'info@globaltech.com', 
    phone: '+234 802 345 6789', 
    website: 'globaltech.com',
    linkedin: 'linkedin.com/company/globaltech',
    total_revenue: 3800000,
    purchases: 18,
    avg_order_value: 211111,
    last_purchase: '2026-01-04',
    tier: 'gold',
    sentiment: 'positive',
    feedback_count: 8,
    jtbd: 'Streamline operations and reduce costs',
    priority_actions: ['Present enterprise upgrade', 'Share case study', 'Introduce account manager'],
    pain_points: ['Slow response times during peak hours', 'Need mobile app support'],
    feedback_history: [
      { id: '1', date: '2025-12-15', type: 'positive', comment: 'Great customer service experience', category: 'Support' },
      { id: '2', date: '2025-11-30', type: 'neutral', comment: 'Features are good but need more customization', category: 'Product' }
    ]
  },
  { 
    id: '3', 
    name: 'MegaCorp Ltd', 
    industry: 'Manufacturing', 
    status: 'active',
    customer_type: 'at-risk',
    health_score: 58, 
    churn_risk: 72,
    upsell_potential: 35,
    email: 'sales@megacorp.com', 
    phone: '+234 803 456 7890', 
    website: 'megacorp.com',
    total_revenue: 1200000,
    purchases: 8,
    avg_order_value: 150000,
    last_purchase: '2025-11-20',
    tier: 'silver',
    sentiment: 'negative',
    feedback_count: 5,
    jtbd: 'Improve supply chain efficiency',
    priority_actions: ['URGENT: Call within 24h', 'Offer discount/incentive', 'Address recent complaints'],
    pain_points: ['System crashes frequently', 'Expensive pricing', 'Poor documentation'],
    feedback_history: [
      { id: '1', date: '2025-11-25', type: 'negative', comment: 'Too many system outages last month', category: 'Reliability' },
      { id: '2', date: '2025-11-18', type: 'negative', comment: 'Support team takes too long to respond', category: 'Support' }
    ]
  },
  { 
    id: '4', 
    name: 'StartupX', 
    industry: 'Fintech', 
    status: 'active',
    customer_type: 'lead',
    health_score: 65, 
    churn_risk: 45,
    upsell_potential: 62,
    email: 'hello@startupx.io', 
    phone: '+234 804 567 8901', 
    website: 'startupx.io',
    twitter: '@startupx',
    total_revenue: 450000,
    purchases: 3,
    avg_order_value: 150000,
    last_purchase: '2025-12-28',
    tier: 'bronze',
    sentiment: 'neutral',
    feedback_count: 2,
    jtbd: 'Launch MVP quickly with limited resources',
    priority_actions: ['Follow up on trial', 'Share success stories', 'Offer onboarding session'],
    pain_points: ['Steep learning curve for team'],
    feedback_history: [
      { id: '1', date: '2025-12-20', type: 'neutral', comment: 'Good features but needs better onboarding', category: 'Onboarding' }
    ]
  },
];

export const Customers: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(demoCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'feedback' | 'pain-points' | 'ai-insights'>('overview');
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    email: '',
    phone: '',
    website: '',
  });

  const getCustomerTypeColor = (type: string) => {
    const colors = {
      lead: 'bg-blue-100 text-blue-700 border-blue-300',
      active: 'bg-green-100 text-green-700 border-green-300',
      vip: 'bg-purple-100 text-purple-700 border-purple-300',
      'at-risk': 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[type as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'text-orange-600',
      silver: 'text-slate-400',
      gold: 'text-yellow-500',
      platinum: 'text-purple-600',
    };
    return colors[tier as keyof typeof colors] || 'text-slate-600';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === 'positive') return <ThumbsUp className="text-green-600" size={16} />;
    if (sentiment === 'negative') return <ThumbsDown className="text-red-600" size={16} />;
    return <MessageSquare className="text-slate-600" size={16} />;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCompany: any = {
      id: Date.now().toString(),
      ...formData,
      status: 'prospect',
      health_score: 75,
      customer_type: 'B2B',
      churn_risk: 'low',
      upsell_potential: 'medium',
      total_revenue: 0,
      last_interaction: new Date().toISOString(),
      next_action: 'Initial contact',
      sentiment: 'neutral',
      satisfaction_score: 0,
      open_tickets: 0,
      resolved_tickets: 0,
      avg_resolution_time: 0,
      active_projects: 0,
      upcoming_renewals: 0,
    };
    setCompanies([newCompany, ...companies]);
    toast.success('Customer added successfully');
    setShowModal(false);
    setFormData({ name: '', industry: '', email: '', phone: '', website: '' });
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Customer 360°</h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Complete view of all your customers</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)} className="text-sm md:text-base">
          <span className="hidden sm:inline">Add </span>Customer
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
      />

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredCompanies.map((company) => (
          <Card 
            key={company.id} 
            hover 
            className="cursor-pointer"
            onClick={() => setSelectedCustomer(company)}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r flex-shrink-0 ${
                  company.customer_type === 'vip' ? 'from-purple-600 to-pink-600' :
                  company.customer_type === 'at-risk' ? 'from-red-600 to-orange-600' :
                  company.customer_type === 'active' ? 'from-green-600 to-emerald-600' :
                  'from-blue-600 to-cyan-600'
                } flex items-center justify-center`}>
                  <Building2 className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm md:text-base truncate">{company.name}</h3>
                  <p className="text-xs md:text-sm text-slate-600 truncate">{company.industry || 'N/A'}</p>
                </div>
              </div>
              <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getCustomerTypeColor(company.customer_type)}`}>
                {company.customer_type.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-slate-600">Health Score</span>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-20 md:w-24 bg-slate-200 rounded-full h-1.5 md:h-2">
                    <div
                      className={`h-1.5 md:h-2 rounded-full ${
                        (company.health_score || 0) > 80 ? 'bg-green-500' :
                        (company.health_score || 0) > 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${company.health_score}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 text-xs md:text-sm">{company.health_score}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-slate-600">Churn Risk</span>
                <span className={`font-semibold ${
                  company.churn_risk > 60 ? 'text-red-600' :
                  company.churn_risk > 30 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {company.churn_risk}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Upsell Potential</span>
                <span className={`font-semibold ${
                  company.upsell_potential > 70 ? 'text-green-600' :
                  company.upsell_potential > 50 ? 'text-blue-600' :
                  'text-slate-600'
                }`}>
                  {company.upsell_potential}%
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-slate-600">Total Revenue</span>
                <span className="font-bold text-slate-900">₦{(company.total_revenue / 1000000).toFixed(1)}M</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Tier</span>
                <span className={`font-bold uppercase text-sm ${getTierColor(company.tier)}`}>
                  {company.tier}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button 
                size="sm" 
                variant="ghost" 
                icon={Eye}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCustomer(company);
                }}
              >
                View
              </Button>
              <Button size="sm" variant="ghost" icon={Mail} onClick={(e) => {
                e.stopPropagation();
                toast.success(`Email sent to ${company.name}`);
              }}>
                Email
              </Button>
              <Button size="sm" variant="ghost" icon={Phone} onClick={(e) => {
                e.stopPropagation();
                toast.success(`Calling ${company.name}...`);
              }}>
                Call
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="Acme Corp"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Industry"
            placeholder="Technology"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="contact@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone"
            placeholder="+1 234 567 8900"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Website"
            placeholder="https://example.com"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Customer</Button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => {
            setSelectedCustomer(null);
            setActiveTab('overview');
          }}
          title={selectedCustomer.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header with Quick Actions */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${
                  selectedCustomer.customer_type === 'vip' ? 'from-purple-600 to-pink-600' :
                  selectedCustomer.customer_type === 'at-risk' ? 'from-red-600 to-orange-600' :
                  selectedCustomer.customer_type === 'active' ? 'from-green-600 to-emerald-600' :
                  'from-blue-600 to-cyan-600'
                } flex items-center justify-center shadow-lg`}>
                  <Building2 className="text-white" size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCustomerTypeColor(selectedCustomer.customer_type)}`}>
                      {selectedCustomer.customer_type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600">{selectedCustomer.industry}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" icon={Calendar} onClick={() => toast.success('Task added')}>Add Task</Button>
                <Button size="sm" icon={Send} onClick={() => toast.success('Email sent')}>Email</Button>
                <Button size="sm" icon={MessageSquare} onClick={() => toast.success('WhatsApp opened')}>WhatsApp</Button>
                <Button size="sm" variant="secondary" icon={Target} onClick={() => toast.success('Added to campaign')}>Campaign</Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 overflow-x-auto">
              <div className="flex gap-4 md:gap-6 min-w-max">
                {(['overview', 'performance', 'feedback', 'pain-points', 'ai-insights'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-2 font-medium transition-colors relative text-sm md:text-base whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-primary-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'performance' && 'Performance'}
                    {tab === 'feedback' && 'Feedback'}
                    {tab === 'pain-points' && 'Pain Points'}
                    {tab === 'ai-insights' && 'AI Insights'}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <Card>
                    <h3 className="font-bold text-slate-900 mb-4">📞 Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="text-primary-600" size={20} />
                        <div>
                          <p className="text-xs text-slate-600">Email</p>
                          <p className="font-medium text-slate-900">{selectedCustomer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="text-green-600" size={20} />
                        <div>
                          <p className="text-xs text-slate-600">Phone</p>
                          <p className="font-medium text-slate-900">{selectedCustomer.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="text-blue-600" size={20} />
                        <div>
                          <p className="text-xs text-slate-600">Website</p>
                          <p className="font-medium text-slate-900">{selectedCustomer.website}</p>
                        </div>
                      </div>
                      {selectedCustomer.linkedin && (
                        <div className="flex items-center gap-3">
                          <Linkedin className="text-blue-700" size={20} />
                          <div>
                            <p className="text-xs text-slate-600">LinkedIn</p>
                            <p className="font-medium text-slate-900">{selectedCustomer.linkedin}</p>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.twitter && (
                        <div className="flex items-center gap-3">
                          <Twitter className="text-sky-500" size={20} />
                          <div>
                            <p className="text-xs text-slate-600">Twitter</p>
                            <p className="font-medium text-slate-900">{selectedCustomer.twitter}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* AI Risk Scores */}
                  <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
                    <h3 className="font-bold text-slate-900 mb-4">🤖 AI Risk Scores</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Health Score</span>
                          <span className="font-bold text-lg">{selectedCustomer.health_score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              (selectedCustomer.health_score || 0) > 80 ? 'bg-green-500' :
                              (selectedCustomer.health_score || 0) > 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${selectedCustomer.health_score}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Churn Risk</span>
                          <span className={`font-bold text-lg ${
                            selectedCustomer.churn_risk > 60 ? 'text-red-600' :
                            selectedCustomer.churn_risk > 30 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {selectedCustomer.churn_risk}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              selectedCustomer.churn_risk > 60 ? 'bg-red-500' :
                              selectedCustomer.churn_risk > 30 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${selectedCustomer.churn_risk}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Upsell Potential</span>
                          <span className={`font-bold text-lg ${
                            selectedCustomer.upsell_potential > 70 ? 'text-green-600' :
                            selectedCustomer.upsell_potential > 50 ? 'text-blue-600' :
                            'text-slate-600'
                          }`}>
                            {selectedCustomer.upsell_potential}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              selectedCustomer.upsell_potential > 70 ? 'bg-green-500' :
                              selectedCustomer.upsell_potential > 50 ? 'bg-blue-500' :
                              'bg-slate-500'
                            }`}
                            style={{ width: `${selectedCustomer.upsell_potential}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* PERFORMANCE TAB */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {/* Quantitative Data */}
                  <Card className="border-l-4 border-primary-500">
                    <h3 className="font-bold text-slate-900 mb-4">📊 Quantitative Data</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-900">₦{(selectedCustomer.total_revenue / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Total Purchases</p>
                        <p className="text-2xl font-bold text-slate-900">{selectedCustomer.purchases}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Avg Order Value</p>
                        <p className="text-2xl font-bold text-slate-900">₦{(selectedCustomer.avg_order_value / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Last Purchase</p>
                        <p className="text-lg font-bold text-slate-900">{new Date(selectedCustomer.last_purchase).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <span className="text-sm text-slate-600">Customer Tier</span>
                      <span className={`font-bold uppercase text-xl ${getTierColor(selectedCustomer.tier)}`}>
                        {selectedCustomer.tier}
                      </span>
                    </div>
                  </Card>

                  {/* Qualitative Data */}
                  <Card className="border-l-4 border-purple-500">
                    <h3 className="font-bold text-slate-900 mb-4">💬 Qualitative Data</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Jobs To Be Done (JTBD)</p>
                        <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedCustomer.jtbd}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Sentiment</p>
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(selectedCustomer.sentiment)}
                          <span className={`font-semibold capitalize ${
                            selectedCustomer.sentiment === 'positive' ? 'text-green-600' :
                            selectedCustomer.sentiment === 'negative' ? 'text-red-600' :
                            'text-slate-600'
                          }`}>
                            {selectedCustomer.sentiment}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Feedback Count</p>
                        <p className="text-2xl font-bold text-slate-900">{selectedCustomer.feedback_count} responses</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Pain Points Identified</p>
                        <p className="text-2xl font-bold text-red-600">{selectedCustomer.pain_points?.length || 0}</p>
                      </div>
                    </div>
                  </Card>

                  {/* AI Output */}
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="text-green-600" size={24} />
                      <h3 className="font-bold text-slate-900">🤖 AI Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-slate-900 mb-2">💡 Predicted Next Purchase</p>
                        <p className="text-slate-700">Within 14 days • Enterprise Plan Upgrade • Est. ₦850K</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-slate-900 mb-2">🎯 Cross-Sell Suggestion</p>
                        <p className="text-slate-700">Premium Support Package + Training Program • 87% acceptance probability</p>
                      </div>
                      {selectedCustomer.pain_points && selectedCustomer.pain_points.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-orange-300 border-l-4">
                          <p className="text-sm font-medium text-slate-900 mb-2">⚠️ Pain Point Focus</p>
                          <p className="text-slate-700">Address "{selectedCustomer.pain_points[0]}" to improve satisfaction by 23%</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* FEEDBACK TAB */}
              {activeTab === 'feedback' && (
                <div className="space-y-6">
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">📝 Customer Feedback History</h3>
                      <Button size="sm" icon={Plus} onClick={() => toast.success('Feedback form opened - Ready to collect customer input')}>Add Feedback</Button>
                    </div>
                    <div className="space-y-3">
                      {selectedCustomer.feedback_history && selectedCustomer.feedback_history.length > 0 ? (
                        selectedCustomer.feedback_history.map((feedback) => (
                          <div 
                            key={feedback.id} 
                            className={`p-4 border rounded-lg ${
                              feedback.type === 'positive' ? 'bg-green-50 border-green-200' :
                              feedback.type === 'negative' ? 'bg-red-50 border-red-200' :
                              'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                {feedback.type === 'positive' ? (
                                  <ThumbsUp className="text-green-600" size={16} />
                                ) : feedback.type === 'negative' ? (
                                  <ThumbsDown className="text-red-600" size={16} />
                                ) : (
                                  <MessageSquare className="text-slate-600" size={16} />
                                )}
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  feedback.type === 'positive' ? 'bg-green-200 text-green-800' :
                                  feedback.type === 'negative' ? 'bg-red-200 text-red-800' :
                                  'bg-slate-200 text-slate-800'
                                }`}>
                                  {feedback.type.toUpperCase()}
                                </span>
                                <span className="text-xs font-medium text-slate-700">{feedback.category}</span>
                              </div>
                              <span className="text-xs text-slate-600">{new Date(feedback.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-700">{feedback.comment}</p>
                            {feedback.type === 'negative' && (
                              <Button size="sm" className="mt-3" onClick={() => toast.success('Escalated to support team')}>
                                Escalate Now
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                          <p>No feedback history available</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="border-l-4 border-blue-500">
                    <h3 className="font-bold text-slate-900 mb-4">📈 Sentiment Trend</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-20">Last 3mo</span>
                        <div className="flex-1 flex items-center gap-1">
                          {[1, 1, 1, 0, 0, -1, 1, 1, 0, 1].map((s, i) => (
                            <div
                              key={i}
                              className={`h-8 flex-1 rounded ${
                                s === 1 ? 'bg-green-500' :
                                s === 0 ? 'bg-slate-300' :
                                'bg-red-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
                        <span>Dec 2025</span>
                        <span>Jan 2026</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* PAIN POINTS TAB */}
              {activeTab === 'pain-points' && (
                <div className="space-y-6">
                  <Card className="border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">⚠️ Customer Pain Points</h3>
                      <Button size="sm" icon={Plus} onClick={() => toast.success('Pain point form opened')}>Add Pain Point</Button>
                    </div>
                    {selectedCustomer.pain_points && selectedCustomer.pain_points.length > 0 ? (
                      <ul className="space-y-3">
                        {selectedCustomer.pain_points.map((pain, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="flex-1 text-slate-900 pt-0.5">{pain}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <AlertCircle size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No pain points identified</p>
                      </div>
                    )}
                  </Card>

                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="text-purple-600" size={24} />
                      <h3 className="font-bold text-slate-900">🤖 AI Resolution Suggestions</h3>
                    </div>
                    {selectedCustomer.pain_points && selectedCustomer.pain_points.length > 0 ? (
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                          <p className="text-sm font-medium text-slate-900 mb-2">💡 Quick Win</p>
                          <p className="text-slate-700">Automate manual data entry → Reduce time by 65% using AI import tool</p>
                          <Button size="sm" className="mt-3" onClick={() => toast.success('Solution demo scheduled')}>Schedule Demo</Button>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                          <p className="text-sm font-medium text-slate-900 mb-2">📊 Better Reporting</p>
                          <p className="text-slate-700">Enable Advanced Analytics Dashboard → Custom reports in real-time</p>
                          <Button size="sm" className="mt-3" onClick={() => toast.success('Analytics access granted')}>Enable Now</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm">No pain points to resolve. Great customer health!</p>
                    )}
                  </Card>
                </div>
              )}

              {/* AI INSIGHTS TAB */}
              {activeTab === 'ai-insights' && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center">
                        <Brain className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">🎯 Priority Actions (Top 3)</h3>
                        <p className="text-sm text-slate-600">AI-recommended actions for {selectedCustomer.name}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedCustomer.priority_actions.map((action, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border-l-4 border-primary-500 hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 mb-2">{action}</p>
                            <div className="flex gap-2">
                              <Button size="sm" icon={CheckCircle} onClick={() => toast.success('Action marked as done')}>
                                Mark Done
                              </Button>
                              <Button size="sm" variant="secondary" icon={Calendar} onClick={() => toast.success('Reminder set')}>
                                Set Reminder
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="border-l-4 border-green-500">
                    <h3 className="font-bold text-slate-900 mb-4">💡 AI Insights Summary</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Target className="text-green-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-slate-900 mb-1">Best Time to Contact</p>
                          <p className="text-sm text-slate-700">Tuesday-Thursday, 10 AM - 2 PM (based on engagement history)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <BarChart3 className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-slate-900 mb-1">Engagement Pattern</p>
                          <p className="text-sm text-slate-700">High email response rate (85%), prefers detailed technical documentation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-slate-900 mb-1">Revenue Potential</p>
                          <p className="text-sm text-slate-700">Est. ₦2.4M additional revenue possible within 6 months via upsell</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
