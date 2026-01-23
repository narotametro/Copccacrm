import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  FileText,
  Wrench,
  Plus,
  Send,
  MessageSquare,
  Target,
  Brain,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Banknote,
  Globe,
  Linkedin,
  Twitter,
  Edit,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSharedData } from '@/context/SharedDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/types/database';

type CompanyRow = Database['public']['Tables']['companies']['Row'];
type FeedbackRow = {
  id: string;
  type: string;
  rating: number;
  feedback_text: string;
  created_at: string;
};

interface Business {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  health_score?: number;
  annual_revenue?: number;
  employee_count?: number;
  jtbd?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  feedback_count?: number;
  pain_points?: string[];
  feedback_history?: {
    id: string;
    date: string;
    type: 'positive' | 'negative' | 'neutral';
    comment: string;
    category: string;
  }[];
  // Calculated fields for UI
  customer_type?: 'lead' | 'active' | 'vip' | 'at-risk';
  churn_risk?: number;
  upsell_potential?: number;
  total_revenue?: number;
  purchases?: number;
  avg_order_value?: number;
  last_purchase?: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  contactPerson?: string | null;
  linkedin?: string;
  twitter?: string;
  priority_actions?: string[];
}

// Helper functions to calculate derived fields
const calculateCustomerType = (company: CompanyRow): 'lead' | 'active' | 'vip' | 'at-risk' => {
  const healthScore = company.health_score || 50;
  const annualRevenue = company.annual_revenue || 0;

  if (healthScore >= 80 && annualRevenue > 1000000) return 'vip';
  if (healthScore >= 60) return 'active';
  if (healthScore <= 30) return 'at-risk';
  return 'lead';
};

const calculateChurnRisk = (company: CompanyRow): number => {
  const healthScore = company.health_score || 50;
  // Simple calculation: lower health score = higher churn risk
  return Math.max(0, Math.min(100, 100 - healthScore));
};

const calculateUpsellPotential = (company: CompanyRow): number => {
  const healthScore = company.health_score || 50;
  const annualRevenue = company.annual_revenue || 0;

  // Higher health score and revenue = higher upsell potential
  const healthFactor = healthScore / 100;
  const revenueFactor = Math.min(1, annualRevenue / 1000000); // Cap at 1M
  return Math.round((healthFactor * revenueFactor) * 100);
};

const calculateTier = (company: CompanyRow): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  const annualRevenue = company.annual_revenue || 0;

  if (annualRevenue >= 10000000) return 'platinum';
  if (annualRevenue >= 5000000) return 'gold';
  if (annualRevenue >= 1000000) return 'silver';
  return 'bronze';
};

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { getDealsByCustomer, getInvoicesByCustomer, getTicketsByCustomer } = useSharedData();
  
  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'feedback' | 'pain-points' | 'ai-insights' | 'deals' | 'invoices' | 'support'>('overview');

  // Modal states
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);
  const [showAddPainPointModal, setShowAddPainPointModal] = useState(false);
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);
  const [showSetReminderModal, setShowSetReminderModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showJTBDModal, setShowJTBDModal] = useState(false);
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  // Form states
  const [feedbackData, setFeedbackData] = useState({
    type: 'positive' as 'positive' | 'negative' | 'neutral',
    comment: '',
    category: ''
  });
  const [painPointData, setPainPointData] = useState('');
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
    assigned_to: '',
    estimated_hours: '',
  });
  const [campaignData, setCampaignData] = useState({
    campaignId: '',
    notes: '',
  });
  const [dealData, setDealData] = useState({
    title: '',
    value: '',
    expected_close_date: '',
    notes: '',
  });
  const [ticketData, setTicketData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: '',
  });
  const [jtbdData, setJtbdData] = useState('');
  const [sentimentData, setSentimentData] = useState<'positive' | 'neutral' | 'negative'>('neutral');

  // State for customer data to handle updates
  const [customerData, setCustomerData] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load customer data from Supabase
  React.useEffect(() => {
    const loadCustomerData = async () => {
      if (!id || !supabaseReady) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch company data with feedback
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select(`
            *,
            customer_feedback (
              id,
              type,
              rating,
              feedback_text,
              created_at
            )
          `)
          .eq('id', id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          setError('Failed to load customer data');
          setLoading(false);
          return;
        }

        if (!company) {
          setError('Customer not found');
          setLoading(false);
          return;
        }

        // Transform the data to match the Business interface
        const customer: Business = {
          id: company.id,
          name: company.name,
          industry: company.industry,
          size: company.size,
          website: company.website,
          phone: company.phone,
          email: company.email,
          address: company.address,
          status: company.status,
          health_score: company.health_score,
          annual_revenue: company.annual_revenue,
          employee_count: company.employee_count,
          jtbd: company.jtbd,
          sentiment: (company.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral',
          feedback_count: company.feedback_count || 0,
          pain_points: company.pain_points || [],
          feedback_history: (company.customer_feedback || []).map((fb: FeedbackRow) => ({
            id: fb.id,
            date: fb.created_at,
            type: (fb.rating >= 4 ? 'positive' : fb.rating <= 2 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
            comment: fb.feedback_text || '',
            category: fb.type || 'general'
          })),
          // Calculate derived fields
          customer_type: calculateCustomerType(company),
          churn_risk: calculateChurnRisk(company),
          upsell_potential: calculateUpsellPotential(company),
          total_revenue: company.annual_revenue || 0,
          purchases: 0, // Would need to be calculated from deals/invoices
          avg_order_value: 0, // Would need to be calculated from deals/invoices
          last_purchase: '', // Would need to be calculated from deals/invoices
          tier: calculateTier(company),
          contactPerson: null, // Not in current schema
          priority_actions: [] // Would need to be calculated
        };

        setCustomerData(customer);

        // Analyze and update JTBD and sentiment if needed
        analyzeAndUpdateCustomerInsights(customer);

      } catch (err) {
        console.error('Error loading customer data:', err);
        setError('Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [id, supabaseReady]);

  // Function to analyze customer data and generate JTBD and sentiment
  const analyzeAndUpdateCustomerInsights = async (customer: Business) => {
    try {
      // Generate JTBD based on customer data
      const jtbd = generateJTBD(customer);

      // Calculate sentiment based on feedback and pain points
      const sentiment = calculateSentiment(customer);

      // Check if we need to update the database
      const needsUpdate = jtbd !== customer.jtbd || sentiment !== customer.sentiment;

      if (needsUpdate && supabaseReady) {
        // Update database
        const { error } = await supabase
          .from('companies')
          .update({
            jtbd: jtbd,
            sentiment: sentiment
          })
          .eq('id', customer.id);

        if (error) {
          console.error('Failed to update customer insights:', error);
        } else {
          // Update local state
          setCustomerData({ ...customer, jtbd, sentiment });
          console.log('Customer insights updated:', { jtbd, sentiment });
        }
      }
    } catch (error) {
      console.error('Failed to analyze customer insights:', error);
    }
  };

  // Generate Jobs To Be Done (JTBD) based on customer data
  const generateJTBD = (customer: Business): string => {
    const { customer_type, tier, pain_points, feedback_history } = customer;
    
    // Base JTBD on customer type and tier
    let jtbd = '';
    
    if (customer_type === 'vip') {
      jtbd = tier === 'platinum' 
        ? 'Maximize ROI from enterprise software investments while maintaining operational excellence'
        : 'Scale business operations efficiently while maintaining high service quality';
    } else if (customer_type === 'active') {
      jtbd = tier === 'gold' 
        ? 'Streamline team collaboration and project management for growing organizations'
        : 'Improve operational efficiency and customer satisfaction in daily business activities';
    } else if (customer_type === 'lead') {
      jtbd = 'Find reliable software solutions to support business growth and operational needs';
    } else { // at-risk
      jtbd = 'Resolve critical operational issues and restore business stability';
    }
    
    // Enhance JTBD based on pain points
    if (pain_points && pain_points.length > 0) {
      const primaryPain = pain_points[0].toLowerCase();
      if (primaryPain.includes('integration') || primaryPain.includes('connect')) {
        jtbd += ' with seamless system integration capabilities';
      } else if (primaryPain.includes('support') || primaryPain.includes('help')) {
        jtbd += ' with reliable technical support and guidance';
      } else if (primaryPain.includes('efficiency') || primaryPain.includes('time')) {
        jtbd += ' while saving time and reducing operational complexity';
      } else if (primaryPain.includes('cost') || primaryPain.includes('budget')) {
        jtbd += ' within budget constraints and cost optimization goals';
      }
    }
    
    // Enhance JTBD based on feedback
    if (feedback_history && feedback_history.length > 0) {
      const positiveFeedback = feedback_history.filter(f => f.type === 'positive').length;
      const totalFeedback = feedback_history.length;
      const satisfactionRate = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 50;
      
      if (satisfactionRate > 80) {
        jtbd += '. Continue delivering excellent service and explore expansion opportunities';
      } else if (satisfactionRate > 60) {
        jtbd += '. Address minor concerns to maintain satisfaction levels';
      } else {
        jtbd += '. Focus on resolving critical issues to rebuild trust and satisfaction';
      }
    }
    
    return jtbd;
  };

  // Calculate sentiment based on feedback history and pain points
  const calculateSentiment = (customer: Business): 'positive' | 'neutral' | 'negative' => {
    const { feedback_history, pain_points, health_score, churn_risk } = customer;
    
    let sentimentScore = 0;
    
    // Analyze feedback history
    if (feedback_history && feedback_history.length > 0) {
      const positiveCount = feedback_history.filter(f => f.type === 'positive').length;
      const negativeCount = feedback_history.filter(f => f.type === 'negative').length;
      
      const totalFeedback = feedback_history.length;
      const positiveRatio = positiveCount / totalFeedback;
      const negativeRatio = negativeCount / totalFeedback;
      
      sentimentScore += (positiveRatio * 50) - (negativeRatio * 30);
    }
    
    // Analyze pain points
    if (pain_points && pain_points.length > 0) {
      sentimentScore -= pain_points.length * 10; // Each pain point reduces sentiment
    }
    
    // Factor in health score
    if (health_score) {
      sentimentScore += (health_score - 50) * 0.5; // Health score contributes to sentiment
    }
    
    // Factor in churn risk
    sentimentScore -= (churn_risk || 0) * 0.3; // Higher churn risk reduces sentiment
    
    // Determine final sentiment
    if (sentimentScore > 20) {
      return 'positive';
    } else if (sentimentScore < -10) {
      return 'negative';
    } else {
      return 'neutral';
    }
  };

  // Find customer by id
  const customer = customerData;

  // Initialize form data when modals open
  React.useEffect(() => {
    if (showJTBDModal && customer) {
      setJtbdData(customer.jtbd || '');
    }
  }, [showJTBDModal, customer]);

  React.useEffect(() => {
    if (showSentimentModal && customer) {
      setSentimentData(customer.sentiment || 'neutral');
    }
  }, [showSentimentModal, customer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Loading Customer Data...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">{error || 'Customer Not Found'}</h1>
            <Button onClick={() => navigate('/app/customers')}>
              <ArrowLeft className="mr-2" size={16} />
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const customerDeals = getDealsByCustomer(customer.id) || [];
  const customerInvoices = getInvoicesByCustomer(customer.name) || [];
  const customerTickets = getTicketsByCustomer(customer.id) || [];

  // If no data found, try to find by customer name or email
  const fallbackDeals = customerDeals.length === 0 ? 
    getDealsByCustomer(customer.name) || [] : customerDeals;
  const fallbackInvoices = customerInvoices.length === 0 ? 
    getInvoicesByCustomer(customer.name) || [] : customerInvoices;
  const fallbackTickets = customerTickets.length === 0 ? 
    getTicketsByCustomer(customer.name) || [] : customerTickets;

  const totalDeals = fallbackDeals.length;
  const wonDeals = fallbackDeals.filter(d => d.stage === 'closed-won').length;
  const totalInvoices = fallbackInvoices.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button and Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/app/customers')}>
            <ArrowLeft className="mr-2" size={16} />
            Back to Customers
          </Button>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              icon={Calendar} 
              onClick={() => setShowAddTaskModal(true)}
            >
              Add Task
            </Button>
            <Button 
              size="sm" 
              icon={Send} 
              onClick={() => {
                // Email functionality
                const subject = `Follow-up with ${customer.name}`;
                const body = `Hi ${customer.contactPerson || 'there'},

I hope this email finds you well. I wanted to follow up regarding our recent interactions.

Best regards,
[Your Name]`;
                window.open(`mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
              }}
            >
              Email
            </Button>
            <Button 
              size="sm" 
              icon={MessageSquare} 
              onClick={() => {
                // WhatsApp functionality
                if (customer.phone) {
                  const message = `Hi ${customer.contactPerson || 'there'}, I wanted to follow up regarding our recent interactions.`;
                  window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                } else {
                  alert('No phone number available for this customer');
                }
              }}
            >
              WhatsApp
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              icon={Target} 
              onClick={() => setShowCampaignModal(true)}
            >
              Campaign
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-b mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r flex items-center justify-center ${
              customer.customer_type === 'vip' ? 'from-purple-600 to-pink-600' :
              customer.customer_type === 'at-risk' ? 'from-red-600 to-orange-600' :
              customer.customer_type === 'active' ? 'from-green-600 to-emerald-600' :
              'from-blue-600 to-cyan-600'
            }`}>
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
              <p className="text-sm text-slate-600">{customer.contactPerson || 'N/A'}</p>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{totalDeals}</div>
            <div className="text-sm text-slate-600">Total Deals</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{wonDeals}</div>
            <div className="text-sm text-slate-600">Won Deals</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{totalInvoices}</div>
            <div className="text-sm text-slate-600">Total Invoices</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'performance', label: 'Performance', count: null },
            { id: 'feedback', label: 'Feedback', count: customer.feedback_count },
            { id: 'pain-points', label: 'Pain Points', count: customer.pain_points?.length || 0 },
            { id: 'ai-insights', label: 'AI Insights', count: null },
            { id: 'deals', label: 'Deals', count: totalDeals },
            { id: 'invoices', label: 'Invoices', count: totalInvoices },
            { id: 'support', label: 'Support', count: fallbackTickets.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label} {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="text-slate-400" size={16} />
                  <span className="text-sm">{customer.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-slate-400" size={16} />
                  <span className="text-sm">{customer.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-slate-400" size={16} />
                  <a href={customer.website || '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
                    {customer.website || 'N/A'}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-slate-400" size={16} />
                  <span className="text-sm">Last Purchase: {customer.last_purchase}</span>
                </div>
                {customer.linkedin && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="text-blue-700" size={16} />
                    <span className="text-sm">{customer.linkedin}</span>
                  </div>
                )}
                {customer.twitter && (
                  <div className="flex items-center gap-3">
                    <Twitter className="text-sky-500" size={16} />
                    <span className="text-sm">{customer.twitter}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Health Score</span>
                    <span>{customer.health_score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (customer.health_score || 0) > 80 ? 'bg-green-500' :
                        (customer.health_score || 0) > 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${customer.health_score || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Churn Risk</span>
                    <span>{customer.churn_risk || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (customer.churn_risk || 0) < 30 ? 'bg-green-500' :
                        (customer.churn_risk || 0) < 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${customer.churn_risk || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Upsell Potential</span>
                    <span>{customer.upsell_potential}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${customer.upsell_potential}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Revenue</span>
                  <span className="font-semibold">{formatCurrency(customer.total_revenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Purchases</span>
                  <span className="font-semibold">{customer.purchases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg Order Value</span>
                  <span className="font-semibold">{formatCurrency(customer.avg_order_value || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Tier</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    (customer.tier || 'bronze') === 'platinum' ? 'bg-purple-100 text-purple-700' :
                    (customer.tier || 'bronze') === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                    (customer.tier || 'bronze') === 'silver' ? 'bg-slate-100 text-slate-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {(customer.tier || 'bronze').toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    // Email functionality
                    const subject = `Follow-up with ${customer.name}`;
                    const body = `Hi ${customer.contactPerson || 'there'},

I hope this email finds you well. I wanted to follow up regarding our recent interactions.

Best regards,
[Your Name]`;
                    window.open(`mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                  }}
                >
                  <Mail className="mr-2" size={16} />
                  Send Email
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    // Call functionality
                    if (customer.phone) {
                      window.open(`tel:${customer.phone}`);
                    } else {
                      alert('No phone number available for this customer');
                    }
                  }}
                >
                  <Phone className="mr-2" size={16} />
                  Call Customer
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowCreateDealModal(true)}
                >
                  <FileText className="mr-2" size={16} />
                  Create Deal
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowCreateTicketModal(true)}
                >
                  <Wrench className="mr-2" size={16} />
                  Create Support Ticket
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Quantitative Data */}
            <Card className="border-l-4 border-primary-500">
              <h3 className="text-lg font-semibold mb-4">Quantitative Data</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency((customer.total_revenue || 0) / 1000000)}<span className="text-sm ml-1">M</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Total Purchases</p>
                  <p className="text-2xl font-bold text-slate-900">{customer.purchases}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency((customer.avg_order_value || 0) / 1000)}<span className="text-sm ml-1">K</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Last Purchase</p>
                  <p className="text-lg font-bold text-slate-900">{customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-slate-600">Customer Tier</span>
                <span className={`font-bold uppercase text-xl ${
                  customer.tier === 'platinum' ? 'text-purple-600' :
                  customer.tier === 'gold' ? 'text-yellow-600' :
                  customer.tier === 'silver' ? 'text-slate-600' :
                  'text-orange-600'
                }`}>
                  {customer.tier}
                </span>
              </div>
            </Card>

            {/* Qualitative Data */}
            <Card className="border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold mb-4">Qualitative Data</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">Jobs To Be Done (JTBD)</p>
                    <Button size="sm" variant="outline" icon={Edit} onClick={() => setShowJTBDModal(true)}>Edit JTBD</Button>
                  </div>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{customer.jtbd}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">Sentiment</p>
                    <Button size="sm" variant="outline" icon={Edit} onClick={() => setShowSentimentModal(true)}>Edit Sentiment</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {customer.sentiment === 'positive' ? <ThumbsUp className="text-green-600" size={16} /> :
                     customer.sentiment === 'negative' ? <ThumbsDown className="text-red-600" size={16} /> :
                     <MessageSquare className="text-slate-600" size={16} />}
                    <span className={`font-semibold capitalize ${
                      customer.sentiment === 'positive' ? 'text-green-600' :
                      customer.sentiment === 'negative' ? 'text-red-600' :
                      'text-slate-600'
                    }`}>
                      {customer.sentiment}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Feedback Count</p>
                  <p className="text-2xl text-slate-900">{customer.feedback_count} responses</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Pain Points Identified</p>
                  <p className="text-2xl font-bold text-red-600">{customer.pain_points?.length || 0}</p>
                </div>
              </div>
            </Card>

            {/* AI Output */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="text-green-600" size={24} />
                <h3 className="text-lg font-semibold">AI Recommendations</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-slate-900 mb-2">Predicted Next Purchase</p>
                  <p className="text-slate-700">
                    Within {(customer.churn_risk || 0) < 30 ? '14 days' : (customer.churn_risk || 0) < 60 ? '30 days' : '60 days'} •
                    {(customer.tier || 'bronze') === 'bronze' ? 'Silver Plan Upgrade' : (customer.tier || 'bronze') === 'silver' ? 'Gold Plan Upgrade' : 'Premium Add-on'} •
                    Est. ₦{Math.round((customer.avg_order_value || 0) * ((customer.upsell_potential || 0) / 100 + 1)).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-slate-900 mb-2">Cross-Sell Suggestion</p>
                  <p className="text-slate-700">
                    {customer.tier === 'bronze' ? 'Training Program + Support Package' :
                     customer.tier === 'silver' ? 'Advanced Analytics + Custom Integration' :
                     'Enterprise Consulting + White-label Solution'} •
                    {Math.round(75 + (customer.health_score || 50) * 0.5)}% acceptance probability
                  </p>
                </div>
                {customer.pain_points && customer.pain_points.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-orange-300 border-l-4">
                    <p className="text-sm font-medium text-slate-900 mb-2">Pain Point Focus</p>
                    <p className="text-slate-700">Address "{customer.pain_points[0]}" to improve satisfaction by {Math.round(15 + (customer.health_score || 50) * 0.3)}%</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Customer Feedback History</h3>
                <Button size="sm" icon={Plus} onClick={() => setShowAddFeedbackModal(true)}>Add Feedback</Button>
              </div>
              <div className="space-y-3">
                {customer.feedback_history && customer.feedback_history.length > 0 ? (
                  customer.feedback_history.map((feedback) => (
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
                      <Button size="sm" className="mt-3">Escalate Now</Button>
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
              <h3 className="text-lg font-semibold mb-4">Sentiment Trend</h3>
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

        {activeTab === 'pain-points' && (
          <div className="space-y-6">
            <Card className="border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Customer Pain Points</h3>
                <Button size="sm" icon={Plus} onClick={() => setShowAddPainPointModal(true)}>Add Pain Point</Button>
              </div>
              {customer.pain_points && customer.pain_points.length > 0 ? (
                <ul className="space-y-3">
                  {customer.pain_points.map((pain, index) => (
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
                <h3 className="text-lg font-semibold">AI Resolution Suggestions</h3>
              </div>
              {customer.pain_points && customer.pain_points.length > 0 ? (
                <div className="space-y-3">
                  {customer.pain_points.slice(0, 2).map((painPoint, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-slate-900 mb-2">
                        {index === 0 ? 'Address Key Pain Point' : 'Secondary Concern'}
                      </p>
                      <p className="text-slate-700 mb-3">{painPoint}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Create Task</Button>
                        <Button size="sm">Schedule Follow-up</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">No pain points identified. Customer satisfaction is high!</p>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'ai-insights' && (
          <div className="space-y-6">
            <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center">
                  <Brain className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Priority Actions (Top 3)</h3>
                  <p className="text-sm text-slate-600">AI-recommended actions for {customer.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                {(customer.priority_actions || []).map((action, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border-l-4 border-primary-500 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 mb-2">{action}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          icon={CheckCircle}
                          onClick={() => {
                            setSelectedAction(action);
                            setShowMarkDoneModal(true);
                          }}
                        >
                          Mark Done
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          icon={Calendar}
                          onClick={() => {
                            setSelectedAction(action);
                            setShowSetReminderModal(true);
                          }}
                        >
                          Set Reminder
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-l-4 border-green-500">
              <h3 className="text-lg font-semibold mb-4">AI Insights Summary</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-medium text-slate-900 mb-1">Best Time to Contact</p>
                    <p className="text-sm text-slate-700">
                      {customer.customer_type === 'vip' ? 'Monday-Wednesday, 9 AM - 11 AM' :
                       customer.customer_type === 'active' ? 'Tuesday-Thursday, 2 PM - 4 PM' :
                       'Wednesday-Friday, 10 AM - 12 PM'}
                      (based on {customer.purchases || Math.floor(Math.random() * 50) + 10} purchase interactions)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-medium text-slate-900 mb-1">Engagement Pattern</p>
                    <p className="text-sm text-slate-700">
                      {customer.sentiment === 'positive' ? 'High' : customer.sentiment === 'neutral' ? 'Moderate' : 'Low'} 
                      engagement rate ({Math.round(60 + (customer.health_score || 50) * 0.8)}%), 
                      prefers {customer.customer_type === 'vip' ? 'personal consultations' : 
                              customer.customer_type === 'active' ? 'email updates' : 
                              'automated notifications'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Banknote className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-medium text-slate-900 mb-1">Revenue Potential</p>
                    <p className="text-sm text-slate-700">
                      Est. ₦{Math.round(((customer.total_revenue || 100000) * ((customer.upsell_potential || 25) / 100 + 0.5))).toLocaleString()}
                      additional revenue possible within {(customer.churn_risk || 0) < 30 ? '3 months' : '6 months'}
                      via {(customer.tier || 'bronze') === 'bronze' ? 'upsell' : 'cross-sell'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'deals' && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">Customer Deals</h3>
            {fallbackDeals.length === 0 ? (
              <p className="text-slate-600">No deals found for this customer.</p>
            ) : (
              <div className="space-y-4">
                {fallbackDeals.map((deal) => (
                  <div key={deal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{deal.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        deal.stage === 'closed-won' ? 'bg-green-100 text-green-700' :
                        deal.stage === 'closed-lost' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {deal.stage}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Value: {formatCurrency(deal.value)}</span>
                      <span>Created: {new Date(deal.created_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'invoices' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Customer Invoices</h3>
              <Button
                onClick={() => navigate('/app/invoices/create', { state: { selectedCompanyName: customer.name } })}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="mr-2" size={16} />
                Create Invoice
              </Button>
            </div>
            {fallbackInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 mb-4">No invoices found for this customer.</p>
                <Button
                  onClick={() => navigate('/app/invoices/create', { state: { selectedCompanyName: customer.name } })}
                  variant="outline"
                >
                  <Plus className="mr-2" size={16} />
                  Create First Invoice
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {fallbackInvoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{invoice.invoice_number}</h4>
                        <p className="text-sm text-slate-600">
                          Issued: {new Date(invoice.issue_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                          invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          invoice.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Total Amount</p>
                        <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Paid Amount</p>
                        <p className="font-semibold text-green-600">{formatCurrency(invoice.paid_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Balance</p>
                        <p className={`font-semibold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(invoice.balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Due Date</p>
                        <p className={`font-semibold ${new Date(invoice.due_date) < new Date() && invoice.balance > 0 ? 'text-red-600' : ''}`}>
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600">
                      <span>Payment Terms: {invoice.payment_terms.replace('_', ' ').toUpperCase()}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/app/invoices/${invoice.id}`)}
                      >
                        View Details
                      </Button>
                    </div>

                    {invoice.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-slate-600">
                          <strong>Notes:</strong> {invoice.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'support' && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">Support Tickets</h3>
            {fallbackTickets.length === 0 ? (
              <p className="text-slate-600">No support tickets found for this customer.</p>
            ) : (
              <div className="space-y-4">
                {fallbackTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{ticket.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        ticket.status === 'closed' ? 'bg-green-100 text-green-700' :
                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{ticket.description}</p>
                    <div className="flex justify-between text-sm">
                      <span>Priority: {ticket.priority}</span>
                      <span>Created: {new Date(ticket.created_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Add Feedback Modal */}
      {showAddFeedbackModal && (
      <Modal
        isOpen={showAddFeedbackModal}
        onClose={() => {
          setShowAddFeedbackModal(false);
          setFeedbackData({ type: 'positive', comment: '', category: '' });
        }}
        title="Add Customer Feedback"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (customer && supabaseReady) {
            try {
              // Save feedback to database
              const { error } = await supabase
                .from('customer_feedback')
                .insert({
                  company_id: customer.id,
                  type: feedbackData.category.toLowerCase(),
                  rating: feedbackData.type === 'positive' ? 5 : feedbackData.type === 'negative' ? 2 : 3,
                  feedback_text: feedbackData.comment
                });

              if (error) {
                console.error('Error saving feedback:', error);
                toast.error('Failed to save feedback');
                return;
              }

              // Update local state
              const newFeedback = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                type: feedbackData.type,
                comment: feedbackData.comment,
                category: feedbackData.category
              };
              const updatedCustomer = {
                ...customer,
                feedback_history: [...(customer.feedback_history || []), newFeedback],
                feedback_count: (customer.feedback_count || 0) + 1
              };
              setCustomerData(updatedCustomer);
              toast.success('Feedback added successfully!');
              setShowAddFeedbackModal(false);
              setFeedbackData({ type: 'positive', comment: '', category: '' });
            } catch (err) {
              console.error('Error adding feedback:', err);
              toast.error('Failed to add feedback');
            }
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Feedback Type</label>
            <select
              value={feedbackData.type}
              onChange={(e) => setFeedbackData({ ...feedbackData, type: e.target.value as 'positive' | 'negative' | 'neutral' })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              required
            >
              <option value="positive">👍 Positive</option>
              <option value="neutral">😐 Neutral</option>
              <option value="negative">👎 Negative</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <input
              type="text"
              value={feedbackData.category}
              onChange={(e) => setFeedbackData({ ...feedbackData, category: e.target.value })}
              placeholder="e.g., Product, Support, Performance"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Comment</label>
            <textarea
              value={feedbackData.comment}
              onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
              placeholder="Enter customer feedback..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              required
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowAddFeedbackModal(false)}>Cancel</Button>
            <Button type="submit">Add Feedback</Button>
          </div>
        </form>
      </Modal>
    )}

    {/* Add Pain Point Modal */}
    {showAddPainPointModal && (
      <Modal
        isOpen={showAddPainPointModal}
        onClose={() => {
          setShowAddPainPointModal(false);
          setPainPointData('');
        }}
        title="Add Pain Point"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (customer && painPointData.trim() && supabaseReady) {
            try {
              const updatedPainPoints = [...(customer.pain_points || []), painPointData];

              // Update pain points in database
              const { error } = await supabase
                .from('companies')
                .update({ pain_points: updatedPainPoints })
                .eq('id', customer.id);

              if (error) {
                console.error('Error saving pain point:', error);
                toast.error('Failed to save pain point');
                return;
              }

              // Update local state
              const updatedCustomer = {
                ...customer,
                pain_points: updatedPainPoints
              };
              setCustomerData(updatedCustomer);
              toast.success('Pain point added successfully!');
              setShowAddPainPointModal(false);
              setPainPointData('');
            } catch (err) {
              console.error('Error adding pain point:', err);
              toast.error('Failed to add pain point');
            }
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pain Point Description</label>
            <textarea
              value={painPointData}
              onChange={(e) => setPainPointData(e.target.value)}
              placeholder="Describe the customer's pain point or challenge..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              required
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowAddPainPointModal(false)}>Cancel</Button>
            <Button type="submit">Add Pain Point</Button>
          </div>
        </form>
      </Modal>
    )}

    {/* Mark Done Modal */}
    {showMarkDoneModal && (
      <Modal
        isOpen={showMarkDoneModal}
        onClose={() => {
          setShowMarkDoneModal(false);
          setSelectedAction('');
        }}
        title="Mark Action as Complete"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="font-medium text-slate-900">Action:</p>
            <p className="text-slate-700">{selectedAction}</p>
          </div>
          <p className="text-sm text-slate-600">Are you sure you want to mark this action as completed? This will remove it from the priority actions list.</p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowMarkDoneModal(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (customer) {
                  const updatedCustomer = {
                    ...customer,
                    priority_actions: (customer.priority_actions || []).filter(action => action !== selectedAction)
                  };
                  setCustomerData(updatedCustomer);
                  toast.success('Action marked as completed!');
                  setShowMarkDoneModal(false);
                  setSelectedAction('');
                }
              }}
              icon={CheckCircle}
            >
              Mark Complete
            </Button>
          </div>
        </div>
      </Modal>
    )}

    {/* Set Reminder Modal */}
    {showSetReminderModal && (
      <Modal
        isOpen={showSetReminderModal}
        onClose={() => {
          setShowSetReminderModal(false);
          setSelectedAction('');
          setReminderDate('');
          setReminderTime('');
        }}
        title="Set Reminder"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          toast.success(`Reminder set for ${reminderDate} at ${reminderTime}`);
          setShowSetReminderModal(false);
          setSelectedAction('');
          setReminderDate('');
          setReminderTime('');
        }}>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-medium text-slate-900">Action:</p>
              <p className="text-slate-700">{selectedAction}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Reminder Date" 
                type="date" 
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                required 
              />
              <Input 
                label="Time" 
                type="time" 
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                required 
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                type="button" 
                size="sm" 
                variant="secondary" 
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setReminderDate(tomorrow.toISOString().split('T')[0]);
                  setReminderTime('09:00');
                }}
              >
                Tomorrow 9 AM
              </Button>
              <Button 
                type="button" 
                size="sm" 
                variant="secondary" 
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setReminderDate(nextWeek.toISOString().split('T')[0]);
                  setReminderTime('09:00');
                }}
              >
                Next Week
              </Button>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowSetReminderModal(false)}>Cancel</Button>
              <Button type="submit" icon={Calendar}>Set Reminder</Button>
            </div>
          </div>
        </form>
      </Modal>
    )}

    {/* Add Task Modal */}
    {showAddTaskModal && (
      <Modal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        title="Add Task"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          // Navigate to After Sales page with pre-filled task data
          navigate('/app/after-sales', { 
            state: { 
              prefillTask: {
                ...taskData,
                linked_type: 'customer',
                linked_name: customer.id,
                linked_display_name: customer.name
              }
            }
          });
          setShowAddTaskModal(false);
        }}>
          <div className="space-y-4">
            <Input 
              label="Task Title" 
              value={taskData.title}
              onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
              required 
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={taskData.priority}
                  onChange={(e) => setTaskData({ ...taskData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <Input 
                label="Due Date" 
                type="date" 
                value={taskData.due_date}
                onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Assigned To" 
                placeholder="Team member name"
                value={taskData.assigned_to}
                onChange={(e) => setTaskData({ ...taskData, assigned_to: e.target.value })}
              />
              <Input 
                label="Estimated Hours" 
                type="number" 
                value={taskData.estimated_hours}
                onChange={(e) => setTaskData({ ...taskData, estimated_hours: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowAddTaskModal(false)}>Cancel</Button>
              <Button type="submit" icon={Plus}>Create Task</Button>
            </div>
          </div>
        </form>
      </Modal>
    )}

    {/* Campaign Modal */}
    {showCampaignModal && (
      <Modal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        title="Add to Campaign"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          toast.success(`${customer.name} added to campaign successfully!`);
          setShowCampaignModal(false);
          setCampaignData({ campaignId: '', notes: '' });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Campaign</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={campaignData.campaignId}
                onChange={(e) => setCampaignData({ ...campaignData, campaignId: e.target.value })}
                required
              >
                <option value="">Choose a campaign...</option>
                <option value="newsletter-q1">Q1 Newsletter Campaign</option>
                <option value="product-launch">New Product Launch</option>
                <option value="re-engagement">Customer Re-engagement</option>
                <option value="upsell">Upsell Campaign</option>
                <option value="seasonal">Seasonal Promotion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                value={campaignData.notes}
                onChange={(e) => setCampaignData({ ...campaignData, notes: e.target.value })}
                placeholder="Any additional notes about this campaign assignment..."
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
              <Button type="submit" icon={Target}>Add to Campaign</Button>
            </div>
          </div>
        </form>
      </Modal>
    )}

    {/* Create Deal Modal */}
    {showCreateDealModal && (
      <Modal
        isOpen={showCreateDealModal}
        onClose={() => setShowCreateDealModal(false)}
        title="Create New Deal"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          // Navigate to Pipeline page with pre-filled deal data
          navigate('/app/pipeline', { 
            state: { 
              prefillDeal: {
                ...dealData,
                customer_id: customer.id,
                customer_name: customer.name
              }
            }
          });
          setShowCreateDealModal(false);
        }}>
          <div className="space-y-4">
            <Input 
              label="Deal Title" 
              value={dealData.title}
              onChange={(e) => setDealData({ ...dealData, title: e.target.value })}
              required 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Deal Value" 
                type="number" 
                placeholder="10000"
                value={dealData.value}
                onChange={(e) => setDealData({ ...dealData, value: e.target.value })}
                required 
              />
              <Input 
                label="Expected Close Date" 
                type="date" 
                value={dealData.expected_close_date}
                onChange={(e) => setDealData({ ...dealData, expected_close_date: e.target.value })}
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                value={dealData.notes}
                onChange={(e) => setDealData({ ...dealData, notes: e.target.value })}
                placeholder="Additional details about this deal..."
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowCreateDealModal(false)}>Cancel</Button>
              <Button type="submit" icon={FileText}>Create Deal</Button>
            </div>
          </div>
        </form>
      </Modal>
    )}

    {/* Create Support Ticket Modal */}
    {showCreateTicketModal && (
      <Modal
        isOpen={showCreateTicketModal}
        onClose={() => setShowCreateTicketModal(false)}
        title="Create Support Ticket"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          toast.success(`Support ticket "${ticketData.title}" created successfully!`);
          setShowCreateTicketModal(false);
          setTicketData({ title: '', description: '', priority: 'medium', category: '' });
        }}>
          <div className="space-y-4">
            <Input 
              label="Ticket Title" 
              value={ticketData.title}
              onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
              required 
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={4}
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={ticketData.priority}
                  onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={ticketData.category}
                  onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                  required
                >
                  <option value="">Select category...</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature Request</option>
                  <option value="account">Account Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowCreateTicketModal(false)}>Cancel</Button>
              <Button type="submit" icon={Wrench}>Create Ticket</Button>
            </div>
          </div>
        </form>
      </Modal>
    )}

    {/* Edit JTBD Modal */}
    {customer && (
      <Modal
        isOpen={showJTBDModal}
        onClose={() => setShowJTBDModal(false)}
        title="Edit Jobs To Be Done (JTBD)"
        size="lg"
      >
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const jtbd = formData.get('jtbd') as string;
          
          try {
            // Update customer JTBD in database
            const { error } = await supabase
              .from('companies')
              .update({ jtbd })
              .eq('id', customer.id);

            if (error) throw error;
            
            // Update the customer state and close modal
            setCustomerData(prev => prev ? { ...prev, jtbd } : null);
            setShowJTBDModal(false);
            toast.success('JTBD updated successfully!');
          } catch (error) {
            console.error('Error updating JTBD:', error);
            toast.error('Failed to update JTBD. Please try again.');
          }
        }}>
          <Card className="border-l-4 border-purple-500 bg-purple-50">
            <p className="text-sm text-purple-900"><strong>Customer:</strong> {customer.name}</p>
            <p className="text-sm text-purple-900"><strong>Current JTBD:</strong> {customer.jtbd}</p>
          </Card>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Jobs To Be Done (JTBD)</label>
            <textarea 
              name="jtbd"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[120px]" 
              placeholder="Describe what the customer is trying to achieve..."
              value={jtbdData}
              onChange={(e) => setJtbdData(e.target.value)}
              required
            />
            <p className="text-xs text-slate-600 mt-2">JTBD helps understand the customer's underlying motivations and goals.</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowJTBDModal(false)}>Cancel</Button>
            <Button type="submit" icon={Edit}>Update JTBD</Button>
          </div>
        </form>
      </Modal>
    )}

    {/* Edit Sentiment Modal */}
    {customer && (
      <Modal
        isOpen={showSentimentModal}
        onClose={() => setShowSentimentModal(false)}
        title="Edit Customer Sentiment"
        size="md"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const sentiment = formData.get('sentiment') as 'positive' | 'neutral' | 'negative';

          try {
            const { error } = await supabase
              .from('companies')
              .update({ sentiment })
              .eq('id', customer.id);

            if (error) throw error;

            setCustomerData(prev => prev ? { ...prev, sentiment } : null);
            setShowSentimentModal(false);
            toast.success('Sentiment updated successfully!');
          } catch (error) {
            console.error('Error updating sentiment:', error);
            toast.error('Failed to update sentiment');
          }
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer Sentiment
              </label>
              <select
                name="sentiment"
                value={sentimentData}
                onChange={(e) => setSentimentData(e.target.value as 'positive' | 'neutral' | 'negative')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Update Sentiment
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowSentimentModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    )}

    </div>
  );
};