import React, { useState, useCallback } from 'react';
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  city?: string;  // Town/City
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

// Helper functions to calculate derived fields based on Sales Hub data
const calculateHealthScore = (totalPurchases: number, lastPurchaseDate: string, totalRevenue: number): number => {
  let score = 50; // Base score

  // Factor 1: Purchase frequency (0-30 points)
  if (totalPurchases >= 10) score += 30;
  else if (totalPurchases >= 5) score += 20;
  else if (totalPurchases >= 2) score += 10;
  else if (totalPurchases === 1) score += 5;

  // Factor 2: Recency of last purchase (0-40 points)
  if (lastPurchaseDate) {
    const daysSinceLastPurchase = Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastPurchase <= 7) score += 40;  // Within a week
    else if (daysSinceLastPurchase <= 30) score += 30; // Within a month
    else if (daysSinceLastPurchase <= 90) score += 20; // Within 3 months
    else if (daysSinceLastPurchase <= 180) score += 10; // Within 6 months
  }

  // Factor 3: Revenue contribution (0-30 points)
  if (totalRevenue >= 50000000) score += 30; // 50M+
  else if (totalRevenue >= 10000000) score += 25; // 10M+
  else if (totalRevenue >= 5000000) score += 20; // 5M+
  else if (totalRevenue >= 1000000) score += 15; // 1M+
  else if (totalRevenue >= 500000) score += 10; // 500K+
  else if (totalRevenue > 0) score += 5;

  return Math.max(0, Math.min(100, score));
};

const calculateChurnRisk = (healthScore: number, totalPurchases: number, lastPurchaseDate: string): number => {
  let risk = 0;

  // Factor 1: Low health score increases risk
  if (healthScore < 30) risk += 50;
  else if (healthScore < 50) risk += 30;
  else if (healthScore < 70) risk += 10;

  // Factor 2: Inactivity increases risk
  if (lastPurchaseDate) {
    const daysSinceLastPurchase = Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastPurchase > 180) risk += 40; // 6+ months
    else if (daysSinceLastPurchase > 90) risk += 25; // 3+ months
    else if (daysSinceLastPurchase > 60) risk += 15; // 2+ months
  } else if (totalPurchases === 0) {
    risk += 50; // Never purchased
  }

  // Factor 3: Low purchase count
  if (totalPurchases === 0) risk += 10;
  else if (totalPurchases === 1) risk += 5;

  return Math.max(0, Math.min(100, risk));
};

const calculateUpsellPotential = (healthScore: number, totalPurchases: number, avgOrderValue: number, _totalRevenue: number): number => {
  let potential = 0;

  // Factor 1: High health score = good upsell potential
  if (healthScore >= 80) potential += 40;
  else if (healthScore >= 60) potential += 30;
  else if (healthScore >= 40) potential += 15;

  // Factor 2: Active customer (multiple purchases)
  if (totalPurchases >= 5) potential += 30;
  else if (totalPurchases >= 3) potential += 20;
  else if (totalPurchases >= 2) potential += 10;

  // Factor 3: Good average order value
  if (avgOrderValue >= 10000000) potential += 30; // 10M+ per order
  else if (avgOrderValue >= 5000000) potential += 20; // 5M+ per order
  else if (avgOrderValue >= 1000000) potential += 10; // 1M+ per order

  return Math.max(0, Math.min(100, potential));
};

const calculateCustomerType = (healthScore: number, totalRevenue: number): 'lead' | 'active' | 'vip' | 'at-risk' => {
  if (healthScore >= 80 && totalRevenue > 10000000) return 'vip';
  if (healthScore >= 60) return 'active';
  if (healthScore <= 30) return 'at-risk';
  return 'lead';
};

const calculateTier = (totalRevenue: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  if (totalRevenue >= 50000000) return 'platinum'; // 50M+
  if (totalRevenue >= 10000000) return 'gold';     // 10M+
  if (totalRevenue >= 5000000) return 'silver';    // 5M+
  return 'bronze';
};

// AI Recommendation: Predict next purchase timeframe based on actual purchase patterns
const predictNextPurchaseTimeframe = (purchases: number, lastPurchase: string, churnRisk: number): string => {
  if (purchases === 0) return 'No purchase history';
  if (!lastPurchase) return 'Unknown';
  
  const daysSinceLastPurchase = Math.floor((Date.now() - new Date(lastPurchase).getTime()) / (1000 * 60 * 60 * 24));
  
  // Low churn risk customers purchase more frequently
  if (churnRisk < 20) {
    if (daysSinceLastPurchase <= 14) return 'Within 7 days';
    return 'Within 14 days';
  } else if (churnRisk < 40) {
    if (daysSinceLastPurchase <= 30) return 'Within 21 days';
    return 'Within 30 days';
  } else if (churnRisk < 60) {
    return 'Within 45 days';
  } else {
    return 'Within 60+ days (re-engagement needed)';
  }
};

// AI Recommendation: Suggest next product based on tier and actual purchase behavior
const suggestNextProduct = (tier: string, purchases: number, avgOrderValue: number, totalRevenue: number): string => {
  if (purchases === 0) return 'Starter Package (initial purchase)';
  
  // Analyze spending capacity
  const isHighSpender = avgOrderValue > 1000000; // Over 1M avg
  const isMediumSpender = avgOrderValue > 500000; // Over 500K avg
  
  // Tier-based suggestions with spending consideration
  if (tier === 'platinum') {
    if (isHighSpender) return 'Enterprise Suite Expansion';
    return 'Premium Module Add-on';
  } else if (tier === 'gold') {
    if (isHighSpender) return 'Platinum Tier Upgrade + Premium Features';
    if (purchases >= 5) return 'Advanced Integration Package';
    return 'Gold Plan Enhancement';
  } else if (tier === 'silver') {
    if (isMediumSpender && purchases >= 3) return 'Gold Tier Upgrade';
    if (purchases >= 5) return 'Professional Services Bundle';
    return 'Silver Plan Add-ons';
  } else { // bronze
    if (purchases >= 3 && avgOrderValue > 300000) return 'Silver Tier Upgrade';
    if (purchases >= 2) return 'Additional User Licenses';
    return 'Basic Support Package';
  }
};

// AI Recommendation: Estimate next purchase value based on actual data
const estimateNextPurchaseValue = (avgOrderValue: number, upsellPotential: number, purchases: number): number => {
  if (purchases === 0) return 0;
  
  // Base estimate on average order value
  let estimate = avgOrderValue;
  
  // Apply upsell multiplier (upsell_potential is 0-100)
  const upsellMultiplier = 1 + (upsellPotential / 100) * 0.5; // Max 50% increase
  estimate *= upsellMultiplier;
  
  // High-frequency customers tend to increase spend
  if (purchases >= 10) {
    estimate *= 1.15; // 15% increase for loyal customers
  } else if (purchases >= 5) {
    estimate *= 1.08; // 8% increase
  }
  
  return Math.round(estimate);
};

// AI Recommendation: Cross-sell suggestion based on tier and purchase history
const suggestCrossSell = (tier: string, purchases: number, healthScore: number, totalRevenue: number): string => {
  if (purchases === 0) return 'Onboarding + Initial Training Session';
  
  // High-value customers get premium suggestions
  if (totalRevenue >= 10000000) {
    if (healthScore >= 80) return 'Dedicated Account Manager + Priority Support';
    return 'Strategic Consulting Package';
  }
  
  // Tier-based cross-sell
  if (tier === 'platinum') {
    if (purchases >= 10) return 'Custom Development + White-label Solution';
    return 'Advanced Analytics + API Integration';
  } else if (tier === 'gold') {
    if (healthScore >= 70) return 'Premium Training Program + Certification';
    return 'Advanced Reporting + Automation Tools';
  } else if (tier === 'silver') {
    if (purchases >= 3) return 'Professional Support Package + Extended SLA';
    return 'Team Training + Best Practices Workshop';
  } else { // bronze
    if (purchases >= 2) return 'Standard Support Plan + Documentation Access';
    return 'Getting Started Training + Email Support';
  }
};

// AI Recommendation: Calculate acceptance probability based on real metrics
const calculateAcceptanceProbability = (healthScore: number, upsellPotential: number, purchases: number): number => {
  let probability = 0;
  
  // Health score contribution (0-50 points)
  probability += (healthScore / 100) * 50;
  
  // Upsell potential contribution (0-30 points)
  probability += (upsellPotential / 100) * 30;
  
  // Purchase history contribution (0-20 points)
  if (purchases >= 10) probability += 20;
  else if (purchases >= 5) probability += 15;
  else if (purchases >= 3) probability += 10;
  else if (purchases >= 1) probability += 5;
  
  return Math.max(10, Math.min(95, Math.round(probability))); // Cap between 10-95%
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
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);  // Quick Note modal
  const [quickNoteText, setQuickNoteText] = useState('');  // Quick Note input
  const [customerNotes, setCustomerNotes] = useState<Array<{id: string; note_text: string; created_at: string}>>([]);  // Customer notes from DB
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
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; type: string; status: string }>>([]);

  // Function to analyze customer data and generate JTBD and sentiment
  const analyzeAndUpdateCustomerInsights = useCallback(async (customer: Business) => {
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
  }, [supabaseReady, setCustomerData]);

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

  // Load customer data from Supabase
  React.useEffect(() => {
    const loadCustomerData = async () => {
      if (!id || !supabaseReady) {
        return;
      }

      try {
        // Removed setLoading(true) - show UI immediately
        setError(null);

        // PARALLEL API CALLS - fetch company, feedback data, and customer notes
        const [companyResult, feedbackResult, notesResult] = await Promise.all([
          supabase.from('companies').select('*').eq('id', id).single(),
          supabase.from('customer_feedback').select('id, type, rating, feedback_text, created_at').eq('company_id', id).order('created_at', { ascending: false }),
          supabase.from('customer_notes').select('id, note_text, created_at').eq('company_id', id).order('created_at', { ascending: false }).limit(10)
        ]);

        if (companyResult.error) {
          console.error('Error fetching company:', companyResult.error);
          setError('Failed to load customer data');
          return;
        }

        if (!companyResult.data) {
          setError('Customer not found');
          return;
        }

        const company = companyResult.data;
        const feedbackData = feedbackResult.error ? [] : (feedbackResult.data || []);
        const notesData = notesResult.error ? [] : (notesResult.data || []);
        
        // Set customer notes
        setCustomerNotes(notesData);
        
        // Try to find matching sales hub customer by name/email
        // Note: companies and sales_hub_customers are separate entities with no direct FK relationship
        let totalRevenue = 0;
        let totalPurchases = 0;
        let avgOrderValue = 0;
        let lastPurchaseDate = '';
        
        // Attempt to find sales hub customer by matching company name or email
        const salesHubCustomerResult = await supabase
          .from('sales_hub_customers')
          .select('id')
          .or(`name.eq.${company.name},email.eq.${company.email}`)
          .limit(1)
          .maybeSingle();
        
        if (!salesHubCustomerResult.error && salesHubCustomerResult.data) {
          const salesHubCustomerId = salesHubCustomerResult.data.id;
          
          const ordersResult = await supabase
            .from('sales_hub_orders')
            .select('total_amount, created_at, status')
            .eq('customer_id', salesHubCustomerId)
            .in('status', ['completed', 'pending'])
            .order('created_at', { ascending: false });
          
          if (!ordersResult.error && ordersResult.data) {
            const orders = ordersResult.data;
            totalPurchases = orders.length;
            totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
            avgOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
            
            if (orders.length > 0) {
              const mostRecentOrder = orders[0];
              lastPurchaseDate = new Date(mostRecentOrder.created_at).toLocaleDateString();
            }
          }
        }

        // Calculate performance metrics from Sales Hub data
        const healthScore = calculateHealthScore(totalPurchases, lastPurchaseDate, totalRevenue);
        const churnRisk = calculateChurnRisk(healthScore, totalPurchases, lastPurchaseDate);
        const upsellPotential = calculateUpsellPotential(healthScore, totalPurchases, avgOrderValue, totalRevenue);
        const customerType = calculateCustomerType(healthScore, totalRevenue);
        const tier = calculateTier(totalRevenue);

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
          city: company.city,  // Town/City from database
          status: company.status,
          health_score: healthScore, // Calculated from Sales Hub data
          annual_revenue: company.annual_revenue,
          employee_count: company.employee_count,
          jtbd: company.jtbd,
          sentiment: (company.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral',
          feedback_count: company.feedback_count || 0,
          pain_points: company.pain_points || [],
          feedback_history: feedbackData.map((fb: FeedbackRow) => ({
            id: fb.id,
            date: fb.created_at,
            type: (fb.rating >= 4 ? 'positive' : fb.rating <= 2 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
            comment: fb.feedback_text || '',
            category: fb.type || 'general'
          })),
          // Use calculated metrics from Sales Hub data
          customer_type: customerType,
          churn_risk: churnRisk,
          upsell_potential: upsellPotential,
          total_revenue: totalRevenue,
          purchases: totalPurchases,
          avg_order_value: avgOrderValue,
          last_purchase: lastPurchaseDate,
          tier: tier,
          contactPerson: company.address || null,  // Contact person stored in address field
          priority_actions: [] // Would need to be calculated
        };

        setCustomerData(customer);

        // Analyze and update JTBD and sentiment if needed
        analyzeAndUpdateCustomerInsights(customer);

      } catch (err) {
        console.error('Error loading customer data:', err);
        setError('Failed to load customer data');
      }
    };

    loadCustomerData();
  }, [id, supabaseReady, analyzeAndUpdateCustomerInsights]);

  // Load marketing campaigns for campaign modal
  React.useEffect(() => {
    const loadCampaigns = async () => {
      if (!supabaseReady) return;

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const { data, error } = await supabase
          .from('marketing_campaigns')
          .select('id, name, type, status')
          .eq('created_by', userData.user.id)
          .in('status', ['planned', 'active'])
          .order('name');

        if (error) throw error;
        if (data) setCampaigns(data);
      } catch (err) {
        console.error('Error loading campaigns:', err);
      }
    };

    loadCampaigns();
  }, [supabaseReady]);

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

  // Removed blocking loading screen - show error state only if there's an error
  if (error) {
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

  // Show minimal loading state (not blank page)
  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-slate-200 rounded w-48 mb-6"></div>
            <div className="h-64 bg-slate-200 rounded mb-6"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
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
        {/* Back Button */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/app/customers')}>
            <ArrowLeft className="mr-2" size={16} />
            Back to Customers
          </Button>
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

          <button 
            onClick={() => navigate('/app/pipeline', { state: { filterCustomerId: customer.id, filterCustomerName: customer.name } })}
            className="text-center hover:bg-white hover:shadow-md transition-all rounded-lg p-2 cursor-pointer group"
            title="View all deals in Pipeline"
          >
            <div className="text-2xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{totalDeals}</div>
            <div className="text-sm text-slate-600 group-hover:text-primary-500 transition-colors">Total Deals</div>
          </button>

          <button 
            onClick={() => navigate('/app/pipeline', { state: { filterCustomerId: customer.id, filterCustomerName: customer.name, filterStage: 'closed-won' } })}
            className="text-center hover:bg-white hover:shadow-md transition-all rounded-lg p-2 cursor-pointer group"
            title="View won deals in Pipeline"
          >
            <div className="text-2xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">{wonDeals}</div>
            <div className="text-sm text-slate-600 group-hover:text-green-500 transition-colors">Won Deals</div>
          </button>

          <button 
            onClick={() => setActiveTab('invoices')}
            className="text-center hover:bg-white hover:shadow-md transition-all rounded-lg p-2 cursor-pointer group"
            title="View invoices"
          >
            <div className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{totalInvoices}</div>
            <div className="text-sm text-slate-600 group-hover:text-blue-500 transition-colors">Total Invoices</div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border overflow-x-auto">
          {([
            { id: 'overview' as const, label: 'Overview', count: null },
            { id: 'performance' as const, label: 'Performance', count: null },
            { id: 'feedback' as const, label: 'Feedback', count: customer.feedback_count },
            { id: 'pain-points' as const, label: 'Pain Points', count: customer.pain_points?.length || 0 },
            { id: 'ai-insights' as const, label: 'AI Insights', count: null },
            { id: 'deals' as const, label: 'Deals', count: totalDeals },
            { id: 'invoices' as const, label: 'Invoices', count: totalInvoices },
            { id: 'support' as const, label: 'Support', count: fallbackTickets.length },
          ]).map((tab) => (
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
                {customer.city && (
                  <div className="flex items-center gap-3">
                    <Building2 className="text-slate-400" size={16} />
                    <span className="text-sm">{customer.city}</span>
                  </div>
                )}
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

            {/* Quick Notes */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quick Notes</h3>
                <Button 
                  size="sm" 
                  onClick={() => setShowQuickNoteModal(true)}
                >
                  + Add Note
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customerNotes.length > 0 ? (
                  customerNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-700 mb-2">{note.note_text}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(note.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No notes yet. Add your first note!</p>
                )}
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
                    {predictNextPurchaseTimeframe(customer.purchases || 0, customer.last_purchase || '', customer.churn_risk || 0)} •
                    {suggestNextProduct(customer.tier || 'bronze', customer.purchases || 0, customer.avg_order_value || 0, customer.total_revenue || 0)} •
                    Est. {formatCurrency(estimateNextPurchaseValue(customer.avg_order_value || 0, customer.upsell_potential || 0, customer.purchases || 0))}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-slate-900 mb-2">Cross-Sell Suggestion</p>
                  <p className="text-slate-700">
                    {suggestCrossSell(customer.tier || 'bronze', customer.purchases || 0, customer.health_score || 0, customer.total_revenue || 0)} •
                    {calculateAcceptanceProbability(customer.health_score || 0, customer.upsell_potential || 0, customer.purchases || 0)}% acceptance probability
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Support Tickets for {customer.name}</h3>
            </div>
            {fallbackTickets.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="mx-auto mb-3 opacity-20" size={48} />
                <p className="text-slate-600 mb-4">No support tickets found for this customer.</p>
                <Button 
                  onClick={() => {
                    setTicketData({
                      title: '',
                      description: `Issue reported by ${customer.name}`,
                      priority: 'medium',
                      category: ''
                    });
                    setShowCreateTicketModal(true);
                  }}
                  icon={Plus}
                >
                  Create First Ticket
                </Button>
              </div>
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

    {/* Quick Note Modal */}
    {showQuickNoteModal && (
      <Modal
        isOpen={showQuickNoteModal}
        onClose={() => {
          setShowQuickNoteModal(false);
          setQuickNoteText('');
        }}
        title="Add Quick Note"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (customer && supabaseReady && quickNoteText.trim()) {
            try {
              const { data: userData } = await supabase.auth.getUser();
              if (!userData?.user) {
                toast.error('You must be logged in');
                return;
              }

              // Save note to database
              const { data: newNote, error } = await supabase
                .from('customer_notes')
                .insert({
                  company_id: customer.id,
                  note_text: quickNoteText.trim(),
                  created_by: userData.user.id
                })
                .select()
                .single();

              if (error) {
                console.error('Error saving note:', error);
                toast.error('Failed to save note');
                return;
              }

              // Update local state
              setCustomerNotes([newNote, ...customerNotes]);
              toast.success('Note added successfully!');
              setShowQuickNoteModal(false);
              setQuickNoteText('');
            } catch (err) {
              console.error('Error adding note:', err);
              toast.error('Failed to add note');
            }
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Note</label>
            <textarea
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder="Enter your note about this customer..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              required
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1">Timestamp will be added automatically</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => {
              setShowQuickNoteModal(false);
              setQuickNoteText('');
            }}>Cancel</Button>
            <Button type="submit">Add Note</Button>
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
        <form onSubmit={async (e) => {
          e.preventDefault();
          
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData?.user) {
              toast.error('Authentication required');
              return;
            }

            // Save to campaign_leads table
            const { error } = await supabase
              .from('campaign_leads')
              .insert({
                campaign_id: campaignData.campaignId,
                company_id: customer.id,
                notes: campaignData.notes,
                created_by: userData.user.id,
              });

            if (error) throw error;

            toast.success(`${customer.name} added to campaign successfully!`);
            setShowCampaignModal(false);
            setCampaignData({ campaignId: '', notes: '' });
          } catch (err) {
            console.error('Error adding to campaign:', err);
            toast.error('Failed to add customer to campaign');
          }
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Campaign</label>
              {campaigns.length > 0 ? (
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={campaignData.campaignId}
                  onChange={(e) => setCampaignData({ ...campaignData, campaignId: e.target.value })}
                  required
                >
                  <option value="">Choose a campaign...</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} ({campaign.type} - {campaign.status})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-slate-600 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  No active campaigns available. Create a campaign in the Marketing module first.
                </div>
              )}
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
              <Button type="submit" icon={Target} disabled={campaigns.length === 0 || !campaignData.campaignId}>
                Add to Campaign
              </Button>
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
        title={`Create Support Ticket - ${customer.name}`}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          toast.success(`Support ticket "${ticketData.title}" created for ${customer.name}!`);
          setShowCreateTicketModal(false);
          setTicketData({ title: '', description: '', priority: 'medium', category: '' });
        }}>
          <div className="space-y-4">
            {/* Customer Info Display */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Customer Information</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="font-medium">Name:</span> {customer.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {customer.email || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {customer.phone || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Tier:</span> {customer.tier?.toUpperCase()}
                </div>
              </div>
            </div>
            
            <Input 
              label="Ticket Title" 
              value={ticketData.title}
              onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
              required 
              placeholder="Brief description of the issue"
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