import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/lib/types/database';
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
  Banknote,
  User,
  ChevronDown,
  Edit,
  Trash2,
  FileText,
  Wrench,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { useSharedData, SupportTicket } from '@/context/SharedDataContext';
import { formatName, applyProperCase } from '@/lib/textFormat';
import { supabase } from '@/lib/supabase';

interface SalesHubProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  brands?: {
    id: string;
    name: string;
  }[] | null;
  categories?: {
    id: string;
    name: string;
  }[] | null;
}

interface Business {
  id: string;
  name: string;
  contactPerson: string | null;
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
  townCity?: string;
  others?: string[];
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
// const demoCompanies: Company[] = [];

export const Customers: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { getCustomerFinancialMetrics, customers: contextCustomers, setSupportTickets, supportTickets } = useSharedData();
  const navigate = useNavigate();

  // Load businesses from localStorage or use context customers or empty array
  const [companies, setCompanies] = useState<Business[]>(() => {
    const saved = localStorage.getItem('copcca-customers');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 ? parsed : contextCustomers.map(c => ({
      id: c.id,
      name: c.name,
      contactPerson: c.name,
      status: c.status,
      customer_type: 'active' as const,
      health_score: 80,
      churn_risk: 20,
      upsell_potential: 30,
      email: c.email,
      phone: c.phone,
      website: '',
      townCity: '',
      others: [],
      total_revenue: 0,
      purchases: 0,
      avg_order_value: 0,
      last_purchase: new Date().toISOString().split('T')[0],
      tier: 'bronze' as const,
      sentiment: 'neutral' as const,
      feedback_count: 0,
      jtbd: '',
      pain_points: [],
      feedback_history: [],
      priority_actions: []
    }));
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [townCityFilter, setTownCityFilter] = useState('all');
  const [isTownCityDropdownOpen, setIsTownCityDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPainPointModal, setShowPainPointModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showJTBDModal, setShowJTBDModal] = useState(false);
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showScheduleDemoModal, setShowScheduleDemoModal] = useState(false);
  const [showEnableAnalyticsModal, setShowEnableAnalyticsModal] = useState(false);
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);
  const [showSetReminderModal, setShowSetReminderModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [escalateFeedback, setEscalateFeedback] = useState<Business['feedback_history'][number] | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Business | null>(null);
  const [salesHubProducts, setSalesHubProducts] = useState<SalesHubProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'feedback' | 'pain-points' | 'ai-insights'>(
    (localStorage.getItem('copcca-customer-modal-active-tab') as 'overview' | 'performance' | 'feedback' | 'pain-points' | 'ai-insights' | null) || 'overview'
  );
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    townCity: '',
    others: [] as string[],
  });
  const [currentOther, setCurrentOther] = useState('');
  const [feedbackData, setFeedbackData] = useState({
    type: 'positive' as 'positive' | 'negative' | 'neutral',
    comment: '',
    category: '',
  });
  const [painPointData, setPainPointData] = useState('');
  const [escalateNote, setEscalateNote] = useState('');
  const [escalatePriority, setEscalatePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Load companies from database on mount
  useEffect(() => {
    const loadCompaniesFromDatabase = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        // Query ONLY customer companies (exclude user's own company)
        // is_own_company flag distinguishes between user's company and their customers
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('created_by', userData.user.id)
          .eq('is_own_company', false)  // ← Only load customer companies, not user's own company
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Convert database companies to the format expected by the component
          const formattedCompanies: Business[] = data.map((c: Database['public']['Tables']['companies']['Row']) => ({
            id: c.id,
            name: c.name,
            contactPerson: '',
            status: c.status,
            customer_type: 'active' as const,
            health_score: c.health_score || 80,
            churn_risk: 20,
            upsell_potential: 30,
            email: c.email,
            phone: c.phone,
            website: c.website || '',
            townCity: '',
            others: [],
            total_revenue: 0,
            purchases: 0,
            avg_order_value: 0,
            last_purchase: new Date().toISOString().split('T')[0],
            tier: 'bronze' as const,
            sentiment: (c.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral',
            feedback_count: 0,
            jtbd: c.jtbd || '',
            pain_points: [],
            feedback_history: [],
            priority_actions: []
          }));
          setCompanies(formattedCompanies);
        }
      } catch (error) {
        // Don't log AbortErrors - they're expected during navigation/remounts
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error loading companies from database:', error);
        }
        // Fallback to localStorage if database fails
        const saved = localStorage.getItem('copcca-customers');
        if (saved) {
          setCompanies(JSON.parse(saved));
        }
      }
    };

    loadCompaniesFromDatabase();
  }, []);

  // Save companies to localStorage whenever companies change
  useEffect(() => {
    localStorage.setItem('copcca-customers', JSON.stringify(companies));
  }, [companies]);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('copcca-customer-modal-active-tab', activeTab);
  }, [activeTab]);

  // Load Sales Hub products
  useEffect(() => {
    const loadSalesHubProducts = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const { data: userProfile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', userData.user.id)
          .single();

        if (!userProfile?.company_id) return;

        const { data: salesProducts } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            price,
            stock_quantity,
            brands (id, name),
            categories (id, name)
          `)
          .eq('company_id', userProfile.company_id)
          .order('name');

        if (salesProducts) {
          setSalesHubProducts(salesProducts as SalesHubProduct[]);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error loading Sales Hub products:', error);
        }
      }
    };

    loadSalesHubProducts();
  }, []);

  const getCustomerTypeColor = (type: string) => {
    const colors = {
      lead: 'bg-blue-100 text-blue-700 border-blue-300',
      active: 'bg-green-100 text-green-700 border-green-300',
      vip: 'bg-purple-100 text-purple-700 border-purple-300',
      'at-risk': 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[type as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getPredictedNextPurchase = (customer: Business) => {
    const financialMetrics = getCustomerFinancialMetrics(customer.id);
    const tier = financialMetrics.tier;
    
    // Logic based on customer tier and revenue
    if (tier === 'platinum') {
      return {
        timeframe: 'Within 30 days',
        product: 'Custom Enterprise Solution',
        value: '₦2.5M',
        confidence: '92%'
      };
    } else if (tier === 'gold') {
      return {
        timeframe: 'Within 21 days',
        product: 'Premium Plan Upgrade',
        value: '₦1.2M',
        confidence: '85%'
      };
    } else if (tier === 'silver') {
      return {
        timeframe: 'Within 14 days',
        product: 'Professional Plan',
        value: '₦650K',
        confidence: '78%'
      };
    } else {
      return {
        timeframe: 'Within 7 days',
        product: 'Starter Plan',
        value: '₦150K',
        confidence: '65%'
      };
    }
  };

  const getCrossSellSuggestion = (customer: Business) => {
    const financialMetrics = getCustomerFinancialMetrics(customer.id);
    const purchases = financialMetrics.purchases;
    const tier = financialMetrics.tier;
    
    // Logic based on purchase history and tier
    if (purchases >= 3 && tier === 'platinum') {
      return {
        suggestion: 'Executive Training Program + Consulting Services',
        probability: '94%',
        value: '₦1.8M'
      };
    } else if (purchases >= 2 && tier === 'gold') {
      return {
        suggestion: 'Advanced Analytics Dashboard + Support Package',
        probability: '87%',
        value: '₦950K'
      };
    } else if (purchases >= 1) {
      return {
        suggestion: 'Premium Support Package + Training',
        probability: '76%',
        value: '₦450K'
      };
    } else {
      return {
        suggestion: 'Onboarding Package + Basic Support',
        probability: '68%',
        value: '₦180K'
      };
    }
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
    const newCompany: Business = {
      id: Date.now().toString(),
      ...formData,
      status: 'prospect',
      health_score: 75,
      customer_type: 'lead',
      churn_risk: 20,
      upsell_potential: 50,
      total_revenue: 0,
      purchases: 0,
      avg_order_value: 0,
      last_purchase: new Date().toISOString(),
      sentiment: 'neutral',
      tier: 'bronze',
      feedback_count: 0,
      jtbd: 'New customer onboarding',
      pain_points: [],
      feedback_history: [],
      priority_actions: ['Initial contact'],
    };
    setCompanies([newCompany, ...companies]);
    toast.success('Customer added successfully');
    setShowModal(false);
    setFormData({ name: '', contactPerson: '', email: '', phone: '', website: '', townCity: '', others: [] });
    setCurrentOther('');
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCompanies(companies.filter(c => c.id !== customerId));
    toast.success('Customer deleted successfully');
  };

  const handleEditCustomer = (customer: Business) => {
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      website: customer.website || '',
      townCity: customer.townCity || '',
      others: customer.others || [],
    });
    setCurrentOther('');
    setShowModal(true);
    // Note: In a real app, you'd want to track which customer is being edited
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesPerformance = true;
    let matchesTownCity = true;

    if (performanceFilter !== 'all') {
      switch (performanceFilter) {
        case 'high':
          matchesPerformance = (company.health_score || 0) > 80;
          break;
        case 'medium':
          matchesPerformance = (company.health_score || 0) >= 60 && (company.health_score || 0) <= 80;
          break;
        case 'low':
          matchesPerformance = (company.health_score || 0) < 60;
          break;
        case 'vip':
          matchesPerformance = company.customer_type === 'vip';
          break;
        case 'at-risk':
          matchesPerformance = company.customer_type === 'at-risk';
          break;
      }
    }

    if (townCityFilter !== 'all') {
      matchesTownCity = company.townCity === townCityFilter;
    }

    return matchesSearch && matchesPerformance && matchesTownCity;
  });

  const uniqueTownCities = Array.from(new Set(companies.map(c => c.townCity).filter(Boolean))).sort() as string[];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Customer 360°</h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Complete view of all your customers</p>
        </div>
        <div className="flex gap-2">
          <Button 
            icon={FileText} 
            variant="outline"
            onClick={() => navigate('/app/support')}
            className="text-sm md:text-base"
          >
            <span className="hidden sm:inline">View All Support </span>Tickets
          </Button>
          <Button 
            icon={Wrench} 
            variant="outline"
            onClick={() => {
              setSelectedCustomer(null);
              setShowCreateTicketModal(true);
            }}
            className="text-sm md:text-base"
          >
            <span className="hidden sm:inline">New Support </span>Ticket
          </Button>
          <Button icon={Plus} onClick={() => setShowModal(true)} className="text-sm md:text-base">
            <span className="hidden sm:inline">Add </span>Customer
          </Button>
        </div>
      </div>

      {/* Info Banner - Removed per user request */}

      {/* Search */}
      <Input
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
      />

      {/* Customers Count */}
      <div className="flex items-center gap-4 text-sm mb-4">
        <span className="text-slate-600">
          Total Customers: <strong className="text-slate-900">{filteredCompanies.length}</strong>
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <Button
          variant={performanceFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('all')}
        >
          All
        </Button>
        <Button
          variant={performanceFilter === 'high' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('high')}
        >
          High Performance
        </Button>
        <Button
          variant={performanceFilter === 'medium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('medium')}
        >
          Medium Performance
        </Button>
        <Button
          variant={performanceFilter === 'low' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('low')}
        >
          Low Performance
        </Button>
        <Button
          variant={performanceFilter === 'vip' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('vip')}
        >
          VIP
        </Button>
        <Button
          variant={performanceFilter === 'at-risk' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('at-risk')}
        >
          At-Risk
        </Button>

        {/* Town/City Dropdown */}
        <div className="relative town-city-dropdown">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsTownCityDropdownOpen(!isTownCityDropdownOpen)}
            className="flex items-center gap-1"
          >
            <span className="text-sm">
              {townCityFilter === 'all' ? 'All Cities' : townCityFilter}
            </span>
            <ChevronDown size={14} />
          </Button>
          {isTownCityDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 min-w-[120px]">
              <button
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                  townCityFilter === 'all' ? 'bg-slate-100 font-medium' : ''
                }`}
                onClick={() => {
                  setTownCityFilter('all');
                  setIsTownCityDropdownOpen(false);
                }}
              >
                All Cities
              </button>
              {uniqueTownCities.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500">
                  No town/city data yet
                </div>
              ) : (
                uniqueTownCities.map((city) => (
                  <button
                    key={city}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                      townCityFilter === city ? 'bg-slate-100 font-medium' : ''
                    }`}
                    onClick={() => {
                      setTownCityFilter(city);
                      setIsTownCityDropdownOpen(false);
                    }}
                  >
                    {city}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-4">
        {filteredCompanies.map((company) => {
          const getBorderColor = () => {
            switch (company.customer_type) {
              case 'vip': return 'border-purple-600';
              case 'at-risk': return 'border-red-600';
              case 'active': return 'border-green-600';
              default: return 'border-blue-600';
            }
          };

          // Check if customer profile is incomplete
          const isIncomplete = !company.email || !company.phone || company.contactPerson === 'N/A' || !company.contactPerson;
          const missingFields = [];
          if (!company.email) missingFields.push('Email');
          if (!company.phone) missingFields.push('Phone');
          if (!company.contactPerson || company.contactPerson === 'N/A') missingFields.push('Contact Person');

          return (
            <Card 
              key={company.id} 
              hover 
              className={`cursor-pointer border-2 ${getBorderColor()}`}
              onClick={() => navigate(`/app/customers/${company.id}`)}
            >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r flex-shrink-0 ${
                  company.customer_type === 'vip' ? 'from-purple-600 to-pink-600' :
                  company.customer_type === 'at-risk' ? 'from-red-600 to-orange-600' :
                  company.customer_type === 'active' ? 'from-green-600 to-emerald-600' :
                  'from-blue-600 to-cyan-600'
                } flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{formatName(company.name).charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm md:text-base truncate">{formatName(company.name)}</h3>
                    {isIncomplete && (
                      <div className="group relative">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div className="absolute left-0 top-6 hidden group-hover:block z-10 w-48 p-2 bg-slate-900 text-white text-xs rounded shadow-lg">
                          <p className="font-semibold mb-1">Incomplete Profile</p>
                          <p className="text-slate-300">Missing: {missingFields.join(', ')}</p>
                          <p className="text-slate-400 mt-1">Click Edit to add details</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 truncate">{company.contactPerson || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getCustomerTypeColor(company.customer_type)}`}>
                  {company.customer_type.toUpperCase()}
                </span>
                {isIncomplete && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
                    Needs Info
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              <Button variant="outline" size="sm" className="justify-center">
                Health: {company.health_score}
              </Button>
              <Button variant="outline" size="sm" className="justify-center">
                Churn: {company.churn_risk}%
              </Button>
              <Button variant="outline" size="sm" className="justify-center">
                Upsell: {company.upsell_potential}%
              </Button>
              <Button variant="outline" size="sm" className="justify-center">
                Revenue: {formatCurrency(company.total_revenue / 1000000)}M
              </Button>
              <Button variant="outline" size="sm" className="justify-center">
                {company.tier.toUpperCase()}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {company.townCity && (
                  <span className="bg-slate-100 px-2 py-1 rounded">{company.townCity}</span>
                )}
                {company.others && company.others.length > 0 && (
                  <span className="bg-slate-100 px-2 py-1 rounded">
                    Other: {company.others.slice(0, 2).join(', ')}{company.others.length > 2 && ` +${company.others.length - 2} more`}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  icon={Eye}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/customers/${company.id}`);
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
                <Button size="sm" variant="ghost" icon={Edit} onClick={(e) => {
                  e.stopPropagation();
                  handleEditCustomer(company);
                }}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete ${company.name}?`)) {
                    handleDeleteCustomer(company.id);
                  }
                }}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        );
        })}
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Customer"
        headerActions={
          <Button type="submit" form="add-customer-form" size="sm">
            Add Customer
          </Button>
        }
      >
        <form id="add-customer-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Customer Name *"
            placeholder="Acme Corp"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={(e) => setFormData({ ...formData, name: applyProperCase(e.target.value) })}
            required
          />
          <Input
            label="Contact Person *"
            placeholder="John Doe"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            onBlur={(e) => setFormData({ ...formData, contactPerson: applyProperCase(e.target.value) })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="contact@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone *"
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
          <Input
            label="Town/City"
            placeholder="New York"
            value={formData.townCity}
            onChange={(e) => setFormData({ ...formData, townCity: e.target.value })}
            onBlur={(e) => setFormData({ ...formData, townCity: applyProperCase(e.target.value) })}
          />

          {/* Others Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Other Information</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add additional information..."
                value={currentOther}
                onChange={(e) => setCurrentOther(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentOther.trim()) {
                      setFormData({
                        ...formData,
                        others: [...formData.others, currentOther.trim()]
                      });
                      setCurrentOther('');
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  if (currentOther.trim()) {
                    setFormData({
                      ...formData,
                      others: [...formData.others, currentOther.trim()]
                    });
                    setCurrentOther('');
                  }
                }}
                disabled={!currentOther.trim()}
              >
                Add Info
              </Button>
            </div>
            {formData.others.length > 0 && (
              <div className="space-y-2">
                {formData.others.map((other, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <span className="flex-1 text-sm">{other}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          others: formData.others.filter((_, i) => i !== index)
                        });
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => {
            setSelectedCustomer(null);
            localStorage.removeItem('copcca-customer-modal-active-tab');
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
                  <p className="text-slate-600">{selectedCustomer.contactPerson}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" icon={Target} onClick={() => navigate('/app/pipeline')}>Create Deal</Button>
                <Button size="sm" icon={AlertCircle} onClick={() => setShowCreateTicketModal(true)}>Create Support Ticket</Button>
                <Button size="sm" icon={Calendar} onClick={() => setShowAddTaskModal(true)}>Add Task</Button>
                <Button size="sm" icon={Send} onClick={() => setShowEmailModal(true)}>Email</Button>
                <Button size="sm" icon={MessageSquare} onClick={() => setShowWhatsAppModal(true)}>WhatsApp</Button>
                <Button size="sm" variant="secondary" icon={Target} onClick={() => setShowCampaignModal(true)}>Campaign</Button>
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
                    <h3 className="font-bold text-slate-900 mb-4">Contact Information</h3>
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
                      <div className="flex items-center gap-3">
                        <User className="text-purple-600" size={20} />
                        <div>
                          <p className="text-xs text-slate-600">Contact Person</p>
                          <p className="font-medium text-slate-900">{selectedCustomer.contactPerson}</p>
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
                    <h3 className="font-bold text-slate-900 mb-4">AI Risk Scores</h3>
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
                    <h3 className="font-bold text-slate-900 mb-4">Quantitative Data</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(getCustomerFinancialMetrics(selectedCustomer.id).total_revenue / 1000000)}<span className="text-sm ml-1">M</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Total Purchases</p>
                        <p className="text-2xl font-bold text-slate-900">{getCustomerFinancialMetrics(selectedCustomer.id).purchases}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Avg Order Value</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(getCustomerFinancialMetrics(selectedCustomer.id).avg_order_value / 1000)}<span className="text-sm ml-1">K</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Last Purchase</p>
                        <p className="text-lg font-bold text-slate-900">{new Date(selectedCustomer.last_purchase).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <span className="text-sm text-slate-600">Customer Tier</span>
                      <span className={`font-bold uppercase text-xl ${getTierColor(getCustomerFinancialMetrics(selectedCustomer.id).tier)}`}>
                        {getCustomerFinancialMetrics(selectedCustomer.id).tier}
                      </span>
                    </div>
                  </Card>

                  {/* Qualitative Data */}
                  <Card className="border-l-4 border-purple-500">
                    <h3 className="font-bold text-slate-900 mb-4">Qualitative Data</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-700">Jobs To Be Done (JTBD)</p>
                          <Button size="md" variant="default" icon={Edit} onClick={() => setShowJTBDModal(true)}>Edit JTBD</Button>
                        </div>
                        <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedCustomer.jtbd}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-700">Sentiment</p>
                          <Button size="md" variant="default" icon={Edit} onClick={() => setShowSentimentModal(true)}>Edit Sentiment</Button>
                        </div>
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
                      <h3 className="font-bold text-slate-900">AI Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-slate-900 mb-2">Predicted Next Purchase</p>
                        <p className="text-slate-700">
                          {getPredictedNextPurchase(selectedCustomer).timeframe} • {getPredictedNextPurchase(selectedCustomer).product} • Est. {getPredictedNextPurchase(selectedCustomer).value} • {getPredictedNextPurchase(selectedCustomer).confidence} confidence
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-slate-900 mb-2">Cross-Sell Suggestion</p>
                        <p className="text-slate-700">
                          {getCrossSellSuggestion(selectedCustomer).suggestion} • {getCrossSellSuggestion(selectedCustomer).probability} acceptance probability • Est. {getCrossSellSuggestion(selectedCustomer).value}
                        </p>
                      </div>
                      {selectedCustomer.pain_points && selectedCustomer.pain_points.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-orange-300 border-l-4">
                          <p className="text-sm font-medium text-slate-900 mb-2">Pain Point Focus</p>
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
                      <h3 className="font-bold text-slate-900">Customer Feedback History</h3>
                      <Button size="sm" icon={Plus} onClick={() => setShowFeedbackModal(true)}>Add Feedback</Button>
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
                            <Button 
                              size="sm" 
                              className="mt-3" 
                              onClick={() => {
                                setEscalateFeedback(feedback);
                                setShowEscalateModal(true);
                              }}
                            >
                              Escalate Now
                            </Button>
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">Sentiment Trend</h3>
                      <Button size="sm" variant="secondary" icon={BarChart3} onClick={() => setShowSentimentModal(true)}>View Details</Button>
                    </div>
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
                      <h3 className="font-bold text-slate-900">Customer Pain Points</h3>
                      <Button size="sm" icon={Plus} onClick={() => setShowPainPointModal(true)}>Add Pain Point</Button>
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
                      <h3 className="font-bold text-slate-900">AI Resolution Suggestions</h3>
                    </div>
                    {selectedCustomer.pain_points && selectedCustomer.pain_points.length > 0 ? (
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                          <p className="text-sm font-medium text-slate-900 mb-2">Quick Win</p>
                          <p className="text-slate-700">Automate manual data entry → Reduce time by 65% using AI import tool</p>
                          <Button size="sm" className="mt-3" onClick={() => setShowScheduleDemoModal(true)}>Schedule Demo</Button>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                          <p className="text-sm font-medium text-slate-900 mb-2">Better Reporting</p>
                          <p className="text-slate-700">Enable Advanced Analytics Dashboard → Custom reports in real-time</p>
                          <Button size="sm" className="mt-3" onClick={() => setShowEnableAnalyticsModal(true)}>Enable Now</Button>
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
                        <h3 className="font-bold text-slate-900 text-lg">Priority Actions (Top 3)</h3>
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
                              <Button size="sm" icon={CheckCircle} onClick={() => {
                                setSelectedAction(action);
                                setShowMarkDoneModal(true);
                              }}>
                                Mark Done
                              </Button>
                              <Button size="sm" variant="secondary" icon={Calendar} onClick={() => {
                                setSelectedAction(action);
                                setShowSetReminderModal(true);
                              }}>
                                Set Reminder
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="border-l-4 border-green-500">
                    <h3 className="font-bold text-slate-900 mb-4">AI Insights Summary</h3>
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
                        <Banknote className="text-purple-600 flex-shrink-0 mt-1" size={20} />
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <Modal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setFeedbackData({ type: 'positive', comment: '', category: '' });
          }}
          title="Add Customer Feedback"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            if (selectedCustomer) {
              const newFeedback = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                type: feedbackData.type,
                comment: feedbackData.comment,
                category: feedbackData.category
              };
              setCompanies(companies.map(c => 
                c.id === selectedCustomer.id 
                  ? { ...c, feedback_history: [...(c.feedback_history || []), newFeedback] }
                  : c
              ));
              setSelectedCustomer({
                ...selectedCustomer,
                feedback_history: [...(selectedCustomer.feedback_history || []), newFeedback]
              });
              toast.success('Feedback added successfully!');
              setShowFeedbackModal(false);
              setFeedbackData({ type: 'positive', comment: '', category: '' });
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
              <Button type="button" variant="secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
              <Button type="submit">Add Feedback</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Pain Point Modal */}
      {showPainPointModal && (
        <Modal
          isOpen={showPainPointModal}
          onClose={() => {
            setShowPainPointModal(false);
            setPainPointData('');
          }}
          title="Add Pain Point"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            if (selectedCustomer && painPointData.trim()) {
              setCompanies(companies.map(c => 
                c.id === selectedCustomer.id 
                  ? { ...c, pain_points: [...(c.pain_points || []), painPointData] }
                  : c
              ));
              setSelectedCustomer({
                ...selectedCustomer,
                pain_points: [...(selectedCustomer.pain_points || []), painPointData]
              });
              toast.success('Pain point added successfully!');
              setShowPainPointModal(false);
              setPainPointData('');
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
              <Button type="button" variant="secondary" onClick={() => setShowPainPointModal(false)}>Cancel</Button>
              <Button type="submit">Add Pain Point</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && escalateFeedback && (
        <Modal
          isOpen={showEscalateModal}
          onClose={() => {
            setShowEscalateModal(false);
            setEscalateNote('');
            setEscalatePriority('medium');
            setEscalateFeedback(null);
          }}
          title="Escalate Feedback to Support Team"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            toast.success(`Feedback escalated as ${escalatePriority.toUpperCase()} priority to support team!`);
            setShowEscalateModal(false);
            setEscalateNote('');
            setEscalatePriority('medium');
            setEscalateFeedback(null);
          }} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">Feedback Details</h4>
              <p className="text-sm text-slate-700"><strong>Category:</strong> {escalateFeedback.category}</p>
              <p className="text-sm text-slate-700 mt-1"><strong>Comment:</strong> {escalateFeedback.comment}</p>
              <p className="text-sm text-slate-600 mt-1"><strong>Date:</strong> {new Date(escalateFeedback.date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority Level</label>
              <select
                value={escalatePriority}
                onChange={(e) => setEscalatePriority(e.target.value as typeof escalatePriority)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                required
              >
                <option value="low">🟢 Low - Can wait a few days</option>
                <option value="medium">🟡 Medium - Address within 48 hours</option>
                <option value="high">🟠 High - Needs attention within 24 hours</option>
                <option value="urgent">🔴 Urgent - Immediate action required</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Escalation Note</label>
              <textarea
                value={escalateNote}
                onChange={(e) => setEscalateNote(e.target.value)}
                placeholder="Add context or instructions for the support team..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowEscalateModal(false)}>Cancel</Button>
              <Button type="submit">Escalate to Support Team</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Support Ticket Modal */}
      <Modal
        isOpen={showCreateTicketModal}
        onClose={() => {
          setShowCreateTicketModal(false);
          setSelectedCustomer(null);
        }}
        title="Create Support Ticket"
        size="xl"
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const customerId = formData.get('customer_id') as string;
          const title = formData.get('title') as string;
          const description = formData.get('description') as string;
          const priority = formData.get('priority') as string;
          const productIds = formData.getAll('product_ids') as string[];

          const customer = companies.find(c => c.id === customerId);
          if (!customer && !selectedCustomer) {
            toast.error('Please select a customer');
            return;
          }

          const ticketCustomer = customer || selectedCustomer!;

          // Get product details from Sales Hub (with brands)
          const relatedProducts = productIds
            .map(pid => {
              const product = salesHubProducts.find(p => p.id === pid);
              if (!product) return null;
              
              const brands = Array.isArray(product.brands) && product.brands.length > 0 ? product.brands : [];
              const brandInfo = brands.length > 0 ? ` - ${brands[0].name}` : '';
              return `${product.name} (SKU: ${product.sku})${brandInfo}`;
            })
            .filter(Boolean) as string[];

          const newTicket: SupportTicket = {
            id: `TICK-${String(supportTickets.length + 1).padStart(3, '0')}`,
            customer_id: ticketCustomer.id,
            customer_name: ticketCustomer.name,
            title,
            description,
            status: 'open',
            priority: priority as 'low' | 'medium' | 'high' | 'urgent',
            assigned_to: '',
            created_date: new Date().toISOString().split('T')[0],
            related_products: relatedProducts,
            resolved_date: undefined
          };

          setSupportTickets([...supportTickets, newTicket]);
          toast.success('Support ticket created successfully!');
          setShowCreateTicketModal(false);
          setSelectedCustomer(null);
        }}>
          {/* Customer Information */}
          {selectedCustomer ? (
            <Card className="border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-orange-700 font-medium">Customer Name</p>
                  <p className="text-sm text-orange-900 font-semibold">{selectedCustomer.name}</p>
                </div>
                {selectedCustomer.email && (
                  <div>
                    <p className="text-xs text-orange-700 font-medium">Email</p>
                    <p className="text-sm text-orange-900">{selectedCustomer.email}</p>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div>
                    <p className="text-xs text-orange-700 font-medium">Phone</p>
                    <p className="text-sm text-orange-900">{selectedCustomer.phone}</p>
                  </div>
                )}
                {selectedCustomer.townCity && (
                  <div>
                    <p className="text-xs text-orange-700 font-medium">Town/City</p>
                    <p className="text-sm text-orange-900">{selectedCustomer.townCity}</p>
                  </div>
                )}
              </div>
              
              {/* Show customer's previous tickets */}
              {(() => {
                const customerTickets = supportTickets.filter(t => t.customer_id === selectedCustomer.id);
                if (customerTickets.length > 0) {
                  return (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <p className="text-xs text-orange-700 font-medium mb-2">
                        ⚠️ Customer History: {customerTickets.length} previous ticket{customerTickets.length > 1 ? 's' : ''}
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {customerTickets.slice(-3).map(ticket => (
                          <div key={ticket.id} className="text-xs bg-white/60 rounded px-2 py-1">
                            <span className="font-medium text-orange-900">{ticket.title}</span>
                            <span className="text-orange-600 ml-2">• {ticket.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </Card>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Customer *</label>
              <select 
                name="customer_id" 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                required
                onChange={(e) => {
                  const customer = companies.find(c => c.id === e.target.value);
                  if (customer) {
                    setSelectedCustomer(customer);
                  }
                }}
              >
                <option value="">Choose a customer...</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} 
                    {company.email && ` (${company.email})`}
                    {company.phone && ` • ${company.phone}`}
                    {company.townCity && ` • ${company.townCity}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input name="title" label="Ticket Title *" placeholder="Brief description of the issue" required />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
            <textarea 
              name="description"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[120px]" 
              placeholder="Detailed description of the customer's issue or request..."
              required
            />
          </div>

          {/* Product Selection with SKU and Brand */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Related Products (Optional)
            </label>
            <select
              name="product_ids"
              multiple
              size={6}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            >
              {salesHubProducts.length === 0 ? (
                <option disabled>No products available</option>
              ) : (
                salesHubProducts.map(product => {
                  // Calculate how many times this product had issues with this customer
                  const productIssueCount = selectedCustomer 
                    ? supportTickets.filter(t => 
                        t.customer_id === selectedCustomer.id && 
                        t.related_products?.some(rp => rp.includes(product.sku))
                      ).length
                    : 0;

                  const brandInfo = Array.isArray(product.brands) && product.brands.length > 0 
                    ? ` - ${product.brands[0].name}` 
                    : '';
                  
                  const issueWarning = productIssueCount > 0 
                    ? ` ⚠️ ${productIssueCount} previous issue${productIssueCount > 1 ? 's' : ''}` 
                    : '';

                  return (
                    <option
                      key={product.id}
                      value={product.id}
                      className={productIssueCount > 0 ? 'bg-red-50 font-semibold' : ''}
                    >
                      {product.name} (SKU: {product.sku}){brandInfo}{issueWarning}
                    </option>
                  );
                })
              )}
            </select>
            <p className="text-xs text-slate-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple products</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority *</label>
              <select name="priority" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => {
              setShowCreateTicketModal(false);
              setSelectedCustomer(null);
            }}>Cancel</Button>
            <Button type="submit" icon={AlertCircle}>Create Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* JTBD Modal */}
      {selectedCustomer && (
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
                .eq('id', selectedCustomer.id);

              if (error) throw error;
              
              // Update the selected customer state and close modal
              setSelectedCustomer(prev => prev ? { ...prev, jtbd } : null);
              setShowJTBDModal(false);
              toast.success('JTBD updated successfully!');
            } catch (error) {
              console.error('Error updating JTBD:', error);
              toast.error('Failed to update JTBD. Please try again.');
            }
          }}>
            <Card className="border-l-4 border-purple-500 bg-purple-50">
              <p className="text-sm text-purple-900"><strong>Customer:</strong> {selectedCustomer.name}</p>
              <p className="text-sm text-purple-900"><strong>Current JTBD:</strong> {selectedCustomer.jtbd}</p>
            </Card>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Jobs To Be Done (JTBD)</label>
              <textarea 
                name="jtbd"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[120px]" 
                placeholder="Describe what the customer is trying to achieve..."
                defaultValue={selectedCustomer.jtbd}
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

      {/* Sentiment Modal */}
      {selectedCustomer && (
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
                .eq('id', selectedCustomer.id);

              if (error) throw error;

              setSelectedCustomer(prev => prev ? { ...prev, sentiment } : null);
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
                  defaultValue={selectedCustomer.sentiment}
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

      {/* Add Task Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          title="Add Task"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const title = formData.get('title') as string;
            const description = formData.get('description') as string;
            const dueDate = formData.get('dueDate') as string;
            const priority = formData.get('priority') as string;

            // Save task to localStorage for After Sales integration
            const existingTasks = JSON.parse(localStorage.getItem('copcca-tasks') || '[]');
            const newTask = {
              id: `TASK-${String(existingTasks.length + 1).padStart(3, '0')}`,
              title,
              description,
              status: 'todo',
              priority: priority.toLowerCase(),
              assigned_to: 'Current User',
              assigned_by: 'Current User',
              linked_to: {
                type: 'customer',
                id: selectedCustomer.id,
                name: selectedCustomer.name
              },
              created_at: new Date().toISOString(),
              due_date: dueDate,
              completed_at: null,
              ai_priority_score: 50,
              ai_suggested_priority: priority.toLowerCase(),
              is_overdue: false,
              days_overdue: 0,
              estimated_hours: 1,
              actual_hours: 0,
              tags: ['customer-task'],
              feedback: []
            };
            
            localStorage.setItem('copcca-tasks', JSON.stringify([...existingTasks, newTask]));
            toast.success('Task created successfully and added to After Sales!');
            setShowAddTaskModal(false);
          }}>
            <Card className="border-l-4 border-blue-500 bg-blue-50">
              <p className="text-sm text-blue-900"><strong>Customer:</strong> {selectedCustomer.name}</p>
            </Card>
            <Input name="title" label="Task Title" placeholder="Follow up on pricing discussion" required />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea name="description" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[100px]" placeholder="Task details..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input name="dueDate" type="date" label="Due Date" required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select name="priority" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none">
                  <option>Low Priority</option>
                  <option>Medium Priority</option>
                  <option>High Priority</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowAddTaskModal(false)}>Cancel</Button>
              <Button type="submit" icon={Calendar}>Create Task</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Email Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          title="Send Email"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            toast.success(`Email sent to ${selectedCustomer.name}!`);
            setShowEmailModal(false);
          }}>
            <Card className="border-l-4 border-green-500 bg-green-50">
              <p className="text-sm text-green-900"><strong>To:</strong> {selectedCustomer.name} ({selectedCustomer.email})</p>
            </Card>
            <Input label="Subject" placeholder="Quick follow-up on our meeting" required />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
              <textarea className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[180px]" placeholder="Hi [Name],\n\nThank you for..." required />
            </div>
            <Card>
              <h3 className="font-bold text-slate-900 mb-2">Quick Templates</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" size="sm">Follow-up</Button>
                <Button type="button" variant="secondary" size="sm">Thank You</Button>
                <Button type="button" variant="secondary" size="sm">Check-in</Button>
                <Button type="button" variant="secondary" size="sm">Meeting Request</Button>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
              <Button type="submit" icon={Send}>Send Email</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* WhatsApp Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          title="Send WhatsApp Message"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const phone = selectedCustomer.phone || '+234';
            const formData = new FormData(e.currentTarget);
            const message = String(formData.get('message') || '');
            window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
            toast.success('Opening WhatsApp...');
            setShowWhatsAppModal(false);
          }}>
            <Card className="border-l-4 border-green-600 bg-green-50">
              <p className="text-sm text-green-900"><strong>To:</strong> {selectedCustomer.name}</p>
              <p className="text-xs text-green-700 mt-1">Phone: {selectedCustomer.phone}</p>
            </Card>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
              <textarea name="message" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[150px]" placeholder="Hi! Hope you're doing well..." required />
            </div>
            <Card>
              <h3 className="font-bold text-slate-900 mb-2">Quick Messages</h3>
              <div className="space-y-2">
                <Button type="button" variant="secondary" size="sm" className="w-full text-left justify-start">Quick check-in</Button>
                <Button type="button" variant="secondary" size="sm" className="w-full text-left justify-start">Share update</Button>
                <Button type="button" variant="secondary" size="sm" className="w-full text-left justify-start">Answer question</Button>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowWhatsAppModal(false)}>Cancel</Button>
              <Button type="submit" icon={MessageSquare}>Send via WhatsApp</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Campaign Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={showCampaignModal}
          onClose={() => setShowCampaignModal(false)}
          title="Add to Campaign"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            toast.success(`${selectedCustomer.name} added to campaign successfully!`);
            setShowCampaignModal(false);
          }}>
            <Card className="border-l-4 border-purple-500 bg-purple-50">
              <p className="text-sm text-purple-900"><strong>Customer:</strong> {selectedCustomer.name}</p>
              <p className="text-xs text-purple-700 mt-1">Type: {selectedCustomer.customer_type}</p>
            </Card>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Campaign</label>
              <select className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none" required>
                <option value="">Choose a campaign...</option>
                <option>Q1 2026 Product Launch</option>
                <option>Customer Appreciation Month</option>
                <option>Upsell Premium Features</option>
                <option>Re-engagement Campaign</option>
                <option>New Year Promotion</option>
              </select>
            </div>
            <Card>
              <h3 className="font-bold text-slate-900 mb-3">Recommended Campaigns</h3>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">Premium Upgrade Campaign</p>
                  <p className="text-xs text-slate-600">Based on customer behavior & tier</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">Industry-Specific Webinar</p>
                  <p className="text-xs text-slate-600">Matches customer industry</p>
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
              <Button type="submit" icon={Target}>Add to Campaign</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Demo Modal */}
      <Modal isOpen={showScheduleDemoModal} onClose={() => setShowScheduleDemoModal(false)} title="Schedule Solution Demo" size="lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          toast.success('Demo scheduled successfully! Calendar invite sent.');
          setShowScheduleDemoModal(false);
        }}>
          <div className="space-y-4">
            <p className="text-slate-600">Schedule a personalized demo to show automated data entry solution</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date" type="date" required />
              <Input label="Time" type="time" defaultValue="14:00" required />
            </div>
            <Input label="Duration" type="select" required>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">90 minutes</option>
            </Input>
            <textarea 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              placeholder="Additional notes or requirements..."
              rows={3}
            />
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowScheduleDemoModal(false)}>Cancel</Button>
              <Button type="submit">Schedule Demo</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Enable Analytics Modal */}
      <Modal isOpen={showEnableAnalyticsModal} onClose={() => setShowEnableAnalyticsModal(false)} title="Enable Advanced Analytics" size="lg">
        <div className="space-y-4">
          <p className="text-slate-600">Grant access to Advanced Analytics Dashboard with custom reporting</p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-bold text-slate-900 mb-2">Features Included:</h4>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>✓ Real-time custom reports</li>
              <li>✓ Advanced data visualization</li>
              <li>✓ Export capabilities</li>
              <li>✓ Scheduled report delivery</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowEnableAnalyticsModal(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('Advanced Analytics enabled successfully!');
              setShowEnableAnalyticsModal(false);
            }}>Enable Analytics</Button>
          </div>
        </div>
      </Modal>

      {/* Mark Done Modal */}
      <Modal isOpen={showMarkDoneModal} onClose={() => setShowMarkDoneModal(false)} title="Mark Action Complete" size="lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          toast.success('Action marked as complete!');
          setShowMarkDoneModal(false);
          setSelectedAction('');
        }}>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-medium text-slate-900">Action:</p>
              <p className="text-slate-700">{selectedAction}</p>
            </div>
            <textarea 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              placeholder="Add completion notes or outcome..."
              rows={4}
              required
            />
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowMarkDoneModal(false)}>Cancel</Button>
              <Button type="submit" icon={CheckCircle}>Mark Complete</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Set Reminder Modal */}
      <Modal isOpen={showSetReminderModal} onClose={() => setShowSetReminderModal(false)} title="Set Reminder" size="lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          toast.success(`Reminder set for ${reminderDate} at ${reminderTime}`);
          setShowSetReminderModal(false);
          setSelectedAction('');
          setReminderDate('');
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
              <Button type="button" size="sm" variant="secondary" onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setReminderDate(tomorrow.toISOString().split('T')[0]);
                setReminderTime('09:00');
              }}>Tomorrow 9 AM</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                setReminderDate(nextWeek.toISOString().split('T')[0]);
                setReminderTime('09:00');
              }}>Next Week</Button>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowSetReminderModal(false)}>Cancel</Button>
              <Button type="submit" icon={Calendar}>Set Reminder</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
