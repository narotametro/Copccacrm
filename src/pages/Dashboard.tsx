
import { TrendingUp, Users, Banknote, Target, BarChart3, Activity, Sparkles, Globe } from 'lucide-react';
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
  
  // Sales today state
  const [salesToday, setSalesToday] = useState<number>(0);
  const [salesFilter, setSalesFilter] = useState<'today' | 'week' | 'month'>('today');
  const [showQuickSales, setShowQuickSales] = useState(false);
  
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
        
        // Fetch sales today based on filter
        const now = new Date();
        let startDate: Date;
        
        switch (salesFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }
        
        const { data: salesData, error: salesError } = await supabase
          .from('invoices')
          .select('total_amount, status, created_at')
          .eq('status', 'paid')
          .gte('created_at', startDate.toISOString());
        
        if (!salesError && salesData) {
          const sales = salesData.reduce((sum: number, invoice: any) => sum + (invoice.total_amount || 0), 0);
          setSalesToday(sales);
        }
        
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

      {/* Sales Today Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-primary-600" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Sales Today</h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={salesFilter}
                onChange={(e) => setSalesFilter(e.target.value as 'today' | 'week' | 'month')}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-slate-900 mb-2">{loading ? '...' : formatCurrency(salesToday)}</p>
            <p className="text-slate-600">
              {salesFilter === 'today' ? 'Today' : salesFilter === 'week' ? 'This Week' : 'This Month'}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Quick Sales</h3>
            <Button
              onClick={() => setShowQuickSales(!showQuickSales)}
              size="sm"
              variant="outline"
            >
              {showQuickSales ? 'Hide' : 'Show'}
            </Button>
          </div>
          {showQuickSales && (
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/app/sales-hub')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                🛒 Open Sales Hub
              </Button>
              <Button
                onClick={() => navigate('/app/customers')}
                variant="outline"
                className="w-full"
              >
                👥 Quick Customer Add
              </Button>
              <Button
                onClick={() => navigate('/app/products')}
                variant="outline"
                className="w-full"
              >
                📦 Manage Products
              </Button>
              <Button
                onClick={() => navigate('/app/reports')}
                variant="outline"
                className="w-full"
              >
                📊 View Reports
              </Button>
            </div>
          )}
        </Card>
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
    </div>
  );
};

export default Dashboard;
