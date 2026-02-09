
import { TrendingUp, Users, Banknote, Target, BarChart3, Activity, Globe, ShoppingCart, Calendar, Brain, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCurrency, currencies } from '@/context/CurrencyContext';
import { formatName } from '@/lib/textFormat';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/types/database';

type InvoiceRow = Pick<Database['public']['Tables']['invoices']['Row'], 'total_amount' | 'status'>;
type DealRow = Pick<Database['public']['Tables']['deals']['Row'], 'title' | 'created_at' | 'stage'>;
type CompanyRow = Pick<Database['public']['Tables']['companies']['Row'], 'name' | 'created_at'>;

const Dashboard = () => {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const displayName = formatName(profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
  const { currency, setCurrency, formatCurrency } = useCurrency();
  
  // Real data state
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [activeCustomers, setActiveCustomers] = useState<number>(0);
  const [dealsWon, setDealsWon] = useState<number>(0);
  const [growthRate, setGrowthRate] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<Array<{
    type: string;
    title: string;
    description: string;
    time: string;
    color: string;
  }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Sales date selector state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDateSales, setSelectedDateSales] = useState<number>(0);
  const [selectedDateGrowth, setSelectedDateGrowth] = useState<number>(0);
  const [dateLoading, setDateLoading] = useState<boolean>(false);
  
  // Floating button state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  // Removed useIntegratedKPIData hook as we're fetching data directly
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch total revenue from invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('total_amount, status')
          .eq('status', 'paid');
        
        if (!invoicesError && invoices) {
          const revenue = invoices.reduce((sum: number, invoice: InvoiceRow) => sum + (invoice.total_amount || 0), 0);
          setTotalRevenue(revenue);
        }
        
        // Fetch active customers from companies
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, status')
          .eq('status', 'active');
        
        if (!companiesError && companies) {
          setActiveCustomers(companies.length);
        }
        
        // Fetch deals won
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('id, stage')
          .eq('stage', 'won');
        
        if (!dealsError && deals) {
          setDealsWon(deals.length);
        }
        
        // Calculate growth rate (simplified - compare current vs previous month)
        // For now, use a static value or calculate from available data
        setGrowthRate(12.5);
        
        // Fetch recent activities
        const activities: Array<{
          type: string;
          title: string;
          description: string;
          time: string;
          color: string;
        }> = [];
        
        // Recent deals
        const { data: recentDeals, error: recentDealsError } = await supabase
          .from('deals')
          .select('title, created_at, stage')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (!recentDealsError && recentDeals) {
          recentDeals.forEach((deal: DealRow) => {
            activities.push({
              type: deal.stage === 'won' ? 'deal_won' : 'deal_created',
              title: deal.stage === 'won' ? 'New deal closed' : 'New deal created',
              description: deal.title,
              time: new Date(deal.created_at).toLocaleString(),
              color: deal.stage === 'won' ? 'green' : 'blue'
            });
          });
        }
        
        // Recent companies
        const { data: recentCompanies, error: recentCompaniesError } = await supabase
          .from('companies')
          .select('name, created_at')
          .order('created_at', { ascending: false })
          .limit(2);
        
        if (!recentCompaniesError && recentCompanies) {
          recentCompanies.forEach((company: CompanyRow) => {
            activities.push({
              type: 'company_added',
              title: 'Customer added',
              description: company.name,
              time: new Date(company.created_at).toLocaleString(),
              color: 'blue'
            });
          });
        }
        
        // Sort activities by time (most recent first) and take top 3
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setRecentActivities(activities.slice(0, 3));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty/default values when data fetch fails
        setTotalRevenue(0);
        setActiveCustomers(0);
        setDealsWon(0);
        setGrowthRate(0);
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const fetchSalesForDate = async (date: string) => {
    try {
      setDateLoading(true);
      
      // Create date range for the selected date (start of day to end of day)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Fetch sales for the selected date
      const { data: dateInvoices, error: dateInvoicesError } = await supabase
        .from('invoices')
        .select('total_amount, status, created_at')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (!dateInvoicesError && dateInvoices) {
        const sales = dateInvoices.reduce((sum: number, invoice: any) => sum + (invoice.total_amount || 0), 0);
        setSelectedDateSales(sales);
        
        // Calculate growth compared to previous day
        const prevDay = new Date(date);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevStart = new Date(prevDay);
        prevStart.setHours(0, 0, 0, 0);
        const prevEnd = new Date(prevDay);
        prevEnd.setHours(23, 59, 59, 999);
        
        const { data: prevInvoices, error: prevError } = await supabase
          .from('invoices')
          .select('total_amount, status')
          .eq('status', 'paid')
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString());
        
        if (!prevError && prevInvoices) {
          const prevSales = prevInvoices.reduce((sum: number, invoice: any) => sum + (invoice.total_amount || 0), 0);
          const growth = prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : 0;
          setSelectedDateGrowth(growth);
        } else {
          setSelectedDateGrowth(0);
        }
      } else {
        setSelectedDateSales(0);
        setSelectedDateGrowth(0);
      }
    } catch (error) {
      console.error('Error fetching sales for date:', error);
      setSelectedDateSales(0);
      setSelectedDateGrowth(0);
    } finally {
      setDateLoading(false);
    }
  };

  // Fetch sales when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSalesForDate(selectedDate);
    }
  }, [selectedDate]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-300" size={32} />
            <div>
              <h2 className="text-2xl font-bold">Welcome Back, {displayName}! 👋</h2>
              <p className="text-primary-100">Here's what's happening with your business today - {formattedDate}</p>
            </div>
          </div>
          {/* Currency Selector */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <Globe className="text-white" size={18} />
            <select
              value={currency.code}
              onChange={(e) => {
                const selected = currencies.find(c => c.code === e.target.value);
                if (selected) setCurrency(selected);
              }}
              className="bg-transparent text-white font-medium outline-none cursor-pointer"
            >
              <optgroup label="Major Currencies" className="bg-slate-800 text-white">
                {currencies.filter(c => ['USD', 'GBP', 'EUR'].includes(c.code)).map(c => (
                  <option key={c.code} value={c.code} className="bg-slate-800 text-white">
                    {c.symbol} {c.code} - {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="African Currencies" className="bg-slate-800 text-white">
                {currencies.filter(c => !['USD', 'GBP', 'EUR'].includes(c.code)).map(c => (
                  <option key={c.code} value={c.code} className="bg-slate-800 text-white">
                    {c.symbol} {c.code} - {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            onClick={() => navigate('/app/customers')}
          >
            Customers
          </Button>
          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            onClick={() => navigate('/app/pipeline')}
          >
            Pipeline
          </Button>
          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            onClick={() => navigate('/app/reports')}
          >
            Reports
          </Button>
          <Button 
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            onClick={() => navigate('/app/kpi-tracking')}
          >
            KPI
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">🏠 Dashboard</h1>
        <p className="text-slate-600 mt-1">Your CRM performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Banknote className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Customers</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : activeCustomers.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Deals Won</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : dealsWon}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Growth Rate</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : `+${growthRate}%`}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Command Center */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="text-yellow-300" size={28} />
          <div>
            <h3 className="text-xl font-bold">🧠 AI Command Center</h3>
            <p className="text-blue-100">Smart insights to boost your sales today</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Today */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-100">Sales Today</span>
              <span className={`text-sm font-medium ${selectedDateGrowth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {dateLoading ? '...' : `${selectedDateGrowth >= 0 ? '+' : ''}${selectedDateGrowth.toFixed(1)}%`}
              </span>
            </div>
            <p className="text-2xl font-bold">{dateLoading ? '...' : formatCurrency(selectedDateSales)}</p>
          </div>
          
          {/* Date Selector */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <label className="block text-sm text-blue-100 mb-2">Check Previous Days</label>
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-200" size={18} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-primary-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900">Sales Pipeline</h3>
          </div>
          <div className="h-64 flex items-center justify-center text-slate-500">
            Chart will be implemented here
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-primary-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-slate-500 py-4">Loading activities...</div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                    <p className="text-xs text-slate-600">{activity.description}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-4">No recent activities</div>
            )}
          </div>
        </Card>
      </div>

      {/* Floating Sales Hub Panel */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className={`bg-blue-500 rounded-lg shadow-lg border-0 transition-all duration-300 overflow-hidden ${
          isExpanded ? 'w-64 h-20' : 'w-16 h-16'
        }`}>
          {isExpanded ? (
            // Expanded state
            <div className="flex items-center justify-between p-4 h-full">
              <div className="flex items-center gap-3 flex-1">
                <ShoppingCart className="text-white" size={24} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Quick Sales</span>
                  <span className="text-xs text-blue-100">Add to Cart</span>
                </div>
              </div>
              <Button
                className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center"
                onClick={() => setIsExpanded(false)}
                title="Collapse"
              >
                <ChevronDown className="text-white" size={16} />
              </Button>
            </div>
          ) : (
            // Collapsed state
            <div className="flex items-center justify-center h-full">
              <Button
                className="h-12 w-12 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center"
                onClick={() => setIsExpanded(true)}
                title="Expand Quick Sales"
              >
                <ChevronUp className="text-white" size={20} />
              </Button>
            </div>
          )}
          
          {/* Invisible overlay for expanded click area */}
          {isExpanded && (
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => {
                navigate('/app/sales-hub');
                localStorage.setItem('salesHubActiveSubsection', 'products');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
