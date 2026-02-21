
import { TrendingUp, TrendingDown, Users, Banknote, Target, BarChart3, Activity, Globe, ShoppingCart, Calendar, ChevronUp, ChevronDown, Sparkles, ArrowUp, ArrowDown, ArrowRight, Minus, Equal } from 'lucide-react';
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
  const [filteredRevenue, setFilteredRevenue] = useState<number>(0);
  const [revenuePeriod, setRevenuePeriod] = useState<string>('all');
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
  
  // Sales date selector state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDateSales, setSelectedDateSales] = useState<number>(0);
  const [selectedDateExpenses, setSelectedDateExpenses] = useState<number>(0);
  const [selectedDateNetProfit, setSelectedDateNetProfit] = useState<number>(0);
  const [selectedDateGrowth, setSelectedDateGrowth] = useState<number>(0);
  const [selectedDateExpensesGrowth, setSelectedDateExpensesGrowth] = useState<number>(0);
  const [selectedDateNetProfitGrowth, setSelectedDateNetProfitGrowth] = useState<number>(0);
  
  // Floating button state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  // Sales pipeline state
  const [pipelineData, setPipelineData] = useState<Array<{
    stage: string;
    count: number;
    color: string;
  }>>([]);
  
  // Removed useIntegratedKPIData hook as we're fetching data directly
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get current user first
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        
        // PARALLEL API CALLS - much faster!
        const [
          invoicesResult,
          salesHubOrdersResult,
          companiesResult,
          dealsResult,
          allDealsResult,
          recentDealsResult,
          recentCompaniesResult
        ] = await Promise.all([
          supabase.from('invoices').select('total_amount, status').eq('status', 'paid').eq('created_by', userData.user.id),
          supabase.from('sales_hub_orders').select('total_amount').eq('created_by', userData.user.id),
          supabase.from('companies').select('id, status').eq('created_by', userData.user.id).eq('is_own_company', false),
          supabase.from('deals').select('id, stage').eq('stage', 'won').eq('created_by', userData.user.id),
          supabase.from('deals').select('stage').eq('created_by', userData.user.id),
          supabase.from('deals').select('title, created_at, stage').eq('created_by', userData.user.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('companies').select('name, created_at').eq('created_by', userData.user.id).eq('is_own_company', false).order('created_at', { ascending: false }).limit(2)
        ]);
        
        // Process revenue from both invoices AND sales hub orders
        let totalRev = 0;
        if (!invoicesResult.error && invoicesResult.data) {
          totalRev += invoicesResult.data.reduce((sum: number, invoice: InvoiceRow) => sum + (invoice.total_amount || 0), 0);
        }
        if (!salesHubOrdersResult.error && salesHubOrdersResult.data) {
          totalRev += salesHubOrdersResult.data.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        }
        setTotalRevenue(totalRev);
        setFilteredRevenue(totalRev); // Initialize filtered revenue
        
        // Process active customers
        if (!companiesResult.error && companiesResult.data) {
          setActiveCustomers(companiesResult.data.length);
        }
        
        // Process deals won
        if (!dealsResult.error && dealsResult.data) {
          setDealsWon(dealsResult.data.length);
        }
        
        // Calculate growth rate based on revenue comparison
        // Compare current month vs previous month
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        
        // Fetch current month revenue
        const [currentMonthInvoices, currentMonthOrders] = await Promise.all([
          supabase
            .from('invoices')
            .select('total_amount')
            .eq('status', 'paid')
            .eq('created_by', userData.user.id)
            .gte('created_at', currentMonthStart.toISOString()),
          supabase
            .from('sales_hub_orders')
            .select('total_amount')
            .eq('created_by', userData.user.id)
            .gte('created_at', currentMonthStart.toISOString())
        ]);
        
        let currentMonthRevenue = 0;
        if (!currentMonthInvoices.error && currentMonthInvoices.data) {
          currentMonthRevenue += currentMonthInvoices.data.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
        }
        if (!currentMonthOrders.error && currentMonthOrders.data) {
          currentMonthRevenue += currentMonthOrders.data.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        }
        
        // Fetch last month revenue
        const [lastMonthInvoices, lastMonthOrders] = await Promise.all([
          supabase
            .from('invoices')
            .select('total_amount')
            .eq('status', 'paid')
            .eq('created_by', userData.user.id)
            .gte('created_at', lastMonthStart.toISOString())
            .lte('created_at', lastMonthEnd.toISOString()),
          supabase
            .from('sales_hub_orders')
            .select('total_amount')
            .eq('created_by', userData.user.id)
            .gte('created_at', lastMonthStart.toISOString())
            .lte('created_at', lastMonthEnd.toISOString())
        ]);
        
        let lastMonthRevenue = 0;
        if (!lastMonthInvoices.error && lastMonthInvoices.data) {
          lastMonthRevenue += lastMonthInvoices.data.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
        }
        if (!lastMonthOrders.error && lastMonthOrders.data) {
          lastMonthRevenue += lastMonthOrders.data.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        }
        
        // Calculate percentage growth
        if (lastMonthRevenue > 0) {
          const growth = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
          setGrowthRate(Math.round(growth * 10) / 10); // Round to 1 decimal place
        } else if (currentMonthRevenue > 0) {
          setGrowthRate(100); // 100% growth if we had no revenue last month but have some now
        } else {
          setGrowthRate(0); // 0% growth if no revenue in either month
        }
        
        // Process pipeline data
        if (!allDealsResult.error && allDealsResult.data) {
          const stages = [
            { stage: 'lead', label: 'Lead', color: 'bg-slate-500' },
            { stage: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
            { stage: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
            { stage: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
            { stage: 'won', label: 'Won', color: 'bg-green-500' }
          ];
          
          const pipeline = stages.map(s => ({
            stage: s.label,
            count: allDealsResult.data.filter((d: any) => d.stage === s.stage).length,
            color: s.color
          }));
          
          setPipelineData(pipeline);
        }
        
        // Build recent activities
        const activities: Array<{
          type: string;
          title: string;
          description: string;
          time: string;
          color: string;
        }> = [];
        
        if (!recentDealsResult.error && recentDealsResult.data) {
          recentDealsResult.data.forEach((deal: DealRow) => {
            activities.push({
              type: deal.stage === 'won' ? 'deal_won' : 'deal_created',
              title: deal.stage === 'won' ? 'New deal closed' : 'New deal created',
              description: deal.title,
              time: new Date(deal.created_at).toLocaleString(),
              color: deal.stage === 'won' ? 'green' : 'blue'
            });
          });
        }
        
        if (!recentCompaniesResult.error && recentCompaniesResult.data) {
          recentCompaniesResult.data.forEach((company: CompanyRow) => {
            activities.push({
              type: 'company_added',
              title: 'Customer added',
              description: company.name,
              time: new Date(company.created_at).toLocaleString(),
              color: 'blue'
            });
          });
        }
        
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setRecentActivities(activities.slice(0, 3));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Filter revenue based on selected period
  useEffect(() => {
    const filterRevenueByPeriod = async () => {
      if (revenuePeriod === 'all') {
        setFilteredRevenue(totalRevenue);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const now = new Date();
        let startDate: Date;

        switch (revenuePeriod) {
          case 'january':
          case 'february':
          case 'march':
          case 'april':
          case 'may':
          case 'june':
          case 'july':
          case 'august':
          case 'september':
          case 'october':
          case 'november':
          case 'december':
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
            const monthIndex = monthNames.indexOf(revenuePeriod);
            startDate = new Date(now.getFullYear(), monthIndex, 1);
            const endDate = new Date(now.getFullYear(), monthIndex + 1, 0, 23, 59, 59);
            
            const [monthInvoices, monthOrders] = await Promise.all([
              supabase
                .from('invoices')
                .select('total_amount')
                .eq('status', 'paid')
                .eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString()),
              supabase
                .from('sales_hub_orders')
                .select('total_amount')
                .eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
            ]);
            
            const monthRevenue = (monthInvoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0) +
                                  (monthOrders.data?.reduce((sum, ord) => sum + (ord.total_amount || 0), 0) || 0);
            setFilteredRevenue(monthRevenue);
            break;

          case 'q1':
            startDate = new Date(now.getFullYear(), 0, 1);
            const endQ1 = new Date(now.getFullYear(), 3, 0, 23, 59, 59);
            const [q1Invoices, q1Orders] = await Promise.all([
              supabase.from('invoices').select('total_amount').eq('status', 'paid').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endQ1.toISOString()),
              supabase.from('sales_hub_orders').select('total_amount').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endQ1.toISOString())
            ]);
            setFilteredRevenue(
              (q1Invoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0) +
              (q1Orders.data?.reduce((sum, ord) => sum + (ord.total_amount || 0), 0) || 0)
            );
            break;

          case 'q2':
            startDate = new Date(now.getFullYear(), 3, 1);
            const endQ2 = new Date(now.getFullYear(), 6, 0, 23, 59, 59);
            const [q2Invoices, q2Orders] = await Promise.all([
              supabase.from('invoices').select('total_amount').eq('status', 'paid').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endQ2.toISOString()),
              supabase.from('sales_hub_orders').select('total_amount').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endQ2.toISOString())
            ]);
            setFilteredRevenue(
              (q2Invoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0) +
              (q2Orders.data?.reduce((sum, ord) => sum + (ord.total_amount || 0), 0) || 0)
            );
            break;

          case 'q3':
            startDate = new Date(now.getFullYear(), 6, 1);
            const endQ3 = new Date(now.getFullYear(), 9, 0, 23, 59, 59);
            const [q3Invoices, q3Orders] = await Promise.all([
              supabase.from('invoices').select('total_amount').eq('status', 'paid').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endQ3.toISOString()),
              supabase.from('sales_hub_orders').select('total_amount').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endQ3.toISOString())
            ]);
            setFilteredRevenue(
              (q3Invoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0) +
              (q3Orders.data?.reduce((sum, ord) => sum + (ord.total_amount || 0), 0) || 0)
            );
            break;

          case 'q4':
            startDate = new Date(now.getFullYear(), 9, 1);
            const endQ4 = new Date(now.getFullYear(), 12, 0, 23, 59, 59);
            const [q4Invoices, q4Orders] = await Promise.all([
              supabase.from('invoices').select('total_amount').eq('status', 'paid').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endQ4.toISOString()),
              supabase.from('sales_hub_orders').select('total_amount').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endQ4.toISOString())
            ]);
            setFilteredRevenue(
              (q4Invoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0) +
              (q4Orders.data?.reduce((sum, ord) => sum + (ord.total_amount || 0), 0) || 0)
            );
            break;

          case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            const [sixMonthInvoices, sixMonthOrders] = await Promise.all([
              supabase.from('invoices').select('total_amount').eq('status', 'paid').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', now.toISOString()),
              supabase.from('sales_hub_orders').select('total_amount').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', now.toISOString())
            ]);
            setFilteredRevenue(
              (sixMonthInvoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0) +
              (sixMonthOrders.data?.reduce((sum, ord) => sum + (ord.total_amount || 0), 0) || 0)
            );
            break;

          case 'annual':
            startDate = new Date(now.getFullYear(), 0, 1);
            const endYear = new Date(now.getFullYear(), 12, 0, 23, 59, 59);
            const [annualInvoices, annualOrders] = await Promise.all([
              supabase.from('invoices').select('total_amount').eq('status', 'paid').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endYear.toISOString()),
              supabase.from('sales_hub_orders').select('total_amount').eq('created_by', userData.user.id)
                .gte('created_at', startDate.toISOString()).lte('created_at', endYear.toISOString())
            ]);
            setFilteredRevenue(
              (annualInvoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0) +
              (annualOrders.data?.reduce((sum, ord) => sum + (ord.total_amount || 0), 0) || 0)
            );
            break;

          default:
            setFilteredRevenue(totalRevenue);
        }
      } catch (error) {
        console.error('Error filtering revenue:', error);
        setFilteredRevenue(totalRevenue);
      }
    };

    filterRevenueByPeriod();
  }, [revenuePeriod, totalRevenue]);

  const fetchSalesForDate = async (date: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        return;
      }

      // Create date range for the selected date (start of day to end of day)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Fetch sales for the selected date from sales_hub_orders
      const { data: dateOrders, error: dateOrdersError } = await supabase
        .from('sales_hub_orders')
        .select('total_amount, created_at')
        .eq('created_by', userData.user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (!dateOrdersError && dateOrders) {
        const sales = dateOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        setSelectedDateSales(sales);
        
        // Fetch expenses from the expenses table for the selected date
        const { data: dateExpenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('expense_date', date);
        
        const expenses = !expensesError && dateExpenses
          ? dateExpenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0)
          : 0;
        setSelectedDateExpenses(expenses);
        
        // Calculate net profit
        const netProfit = sales - expenses;
        setSelectedDateNetProfit(netProfit);
        
        // Calculate growth compared to previous day
        const prevDay = new Date(date);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = prevDay.toISOString().split('T')[0];
        const prevStart = new Date(prevDay);
        prevStart.setHours(0, 0, 0, 0);
        const prevEnd = new Date(prevDay);
        prevEnd.setHours(23, 59, 59, 999);
        
        const { data: prevOrders, error: prevError } = await supabase
          .from('sales_hub_orders')
          .select('total_amount')
          .eq('created_by', userData.user.id)
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString());
        
        // Fetch previous day expenses
        const { data: prevExpensesData, error: prevExpensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('created_by', userData.user.id)
          .eq('expense_date', prevDayStr);
        
        const prevExpenses = !prevExpensesError && prevExpensesData
          ? prevExpensesData.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0)
          : 0;
        
        if (!prevError && prevOrders) {
          const prevSales = prevOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
          const prevNetProfit = prevSales - prevExpenses;
          
          // Sales growth
          const growth = prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : 0;
          setSelectedDateGrowth(growth);
          
          // Expenses growth
          const expensesGrowth = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
          setSelectedDateExpensesGrowth(expensesGrowth);
          
          // Net profit growth
          const netProfitGrowth = prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0;
          setSelectedDateNetProfitGrowth(netProfitGrowth);
        } else {
          setSelectedDateGrowth(0);
          setSelectedDateExpensesGrowth(0);
          setSelectedDateNetProfitGrowth(0);
        }
      } else {
        setSelectedDateSales(0);
        setSelectedDateExpenses(0);
        setSelectedDateNetProfit(0);
        setSelectedDateGrowth(0);
        setSelectedDateExpensesGrowth(0);
        setSelectedDateNetProfitGrowth(0);
      }
    } catch (error) {
      console.error('Error fetching sales for date:', error);
      setSelectedDateSales(0);
      setSelectedDateExpenses(0);
      setSelectedDateNetProfit(0);
      setSelectedDateGrowth(0);
      setSelectedDateExpensesGrowth(0);
      setSelectedDateNetProfitGrowth(0);
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
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Banknote className="text-green-600" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <p className="text-lg font-bold text-slate-900 break-words">{formatCurrency(filteredRevenue)}</p>
                </div>
              </div>
            </div>
            <select
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Time</option>
              <optgroup label="Monthly">
                <option value="january">January</option>
                <option value="february">February</option>
                <option value="march">March</option>
                <option value="april">April</option>
                <option value="may">May</option>
                <option value="june">June</option>
                <option value="july">July</option>
                <option value="august">August</option>
                <option value="september">September</option>
                <option value="october">October</option>
                <option value="november">November</option>
                <option value="december">December</option>
              </optgroup>
              <optgroup label="Quarterly">
                <option value="q1">Q1 (Jan-Mar)</option>
                <option value="q2">Q2 (Apr-Jun)</option>
                <option value="q3">Q3 (Jul-Sep)</option>
                <option value="q4">Q4 (Oct-Dec)</option>
              </optgroup>
              <optgroup label="Other">
                <option value="6months">Last 6 Months</option>
                <option value="annual">Annual (This Year)</option>
              </optgroup>
            </select>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Customers</p>
              <p className="text-2xl font-bold text-slate-900">{activeCustomers.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-slate-900">{dealsWon}</p>
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
              <p className="text-2xl font-bold text-slate-900">{`+${growthRate}%`}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Track Money Flow */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="mb-4">
          <div>
            <h3 className="text-xl font-bold">Quick Track Money Flow</h3>
            <p className="text-blue-100">Real-time financial overview</p>
          </div>
        </div>
        
        {/* Date Selector */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 mb-4">
          <label className="block text-sm text-blue-100 mb-2">Check Previous Days</label>
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-200" size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="flex-1 bg-white/20 border border-white/30 rounded px-3 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
          </div>
        </div>
        
        {/* Money Flow Cards */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-4">

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            {/* Money IN (Sales) */}
            <div className="flex-1 max-w-[200px]">
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-green-300 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Money IN</p>
                      <p className="text-[9px] text-slate-500">Sales</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                    selectedDateGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedDateGrowth >= 0 ? (
                      <ArrowUp className="h-2.5 w-2.5" />
                    ) : (
                      <ArrowDown className="h-2.5 w-2.5" />
                    )}
                    <span className="text-[10px] font-bold">{selectedDateGrowth >= 0 ? '+' : ''}{selectedDateGrowth.toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(selectedDateSales)}
                </p>
              </div>
            </div>

            {/* Minus Arrow */}
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-5 w-5 text-blue-200 hidden md:block" />
              <ArrowDown className="h-5 w-5 text-blue-200 md:hidden" />
              <Minus className="h-5 w-5 text-white font-bold" />
            </div>

            {/* Money OUT (Expenses) */}
            <div className="flex-1 max-w-[200px]">
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-red-300 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide">Money OUT</p>
                      <p className="text-[9px] text-slate-500">Expenses</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                    selectedDateExpensesGrowth >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedDateExpensesGrowth >= 0 ? (
                      <ArrowUp className="h-2.5 w-2.5" />
                    ) : (
                      <ArrowDown className="h-2.5 w-2.5" />
                    )}
                    <span className="text-[10px] font-bold">{selectedDateExpensesGrowth >= 0 ? '+' : ''}{selectedDateExpensesGrowth.toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-xl font-bold text-red-700">
                  {formatCurrency(selectedDateExpenses)}
                </p>
              </div>
            </div>

            {/* Equals Arrow */}
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-5 w-5 text-blue-200 hidden md:block" />
              <ArrowDown className="h-5 w-5 text-blue-200 md:hidden" />
              <Equal className="h-5 w-5 text-white font-bold" />
            </div>

            {/* NET PROFIT */}
            <div className="flex-1 max-w-[200px]">
              <div className={`bg-white rounded-xl p-4 shadow-md border-2 ${
                selectedDateNetProfit >= 0 
                  ? 'border-emerald-400 hover:border-emerald-500' 
                  : 'border-orange-400 hover:border-orange-500'
              } hover:shadow-lg transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <div className={`p-1.5 rounded-lg ${
                      selectedDateNetProfit >= 0 ? 'bg-emerald-100' : 'bg-orange-100'
                    }`}>
                      <Banknote className={`h-4 w-4 ${
                        selectedDateNetProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                        selectedDateNetProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'
                      }`}>Net {selectedDateNetProfit >= 0 ? 'PROFIT' : 'LOSS'}</p>
                      <p className="text-[9px] text-slate-500">Bottom Line</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                    selectedDateNetProfitGrowth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedDateNetProfitGrowth >= 0 ? (
                      <ArrowUp className="h-2.5 w-2.5" />
                    ) : (
                      <ArrowDown className="h-2.5 w-2.5" />
                    )}
                    <span className="text-[10px] font-bold">{selectedDateNetProfitGrowth >= 0 ? '+' : ''}{selectedDateNetProfitGrowth.toFixed(0)}%</span>
                  </div>
                </div>
                <p className={`text-xl font-bold ${
                  selectedDateNetProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'
                }`}>
                  {formatCurrency(selectedDateNetProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="mt-3 pt-3 border-t border-white/20 text-center">
            <p className="text-sm text-blue-100">
              <span className="font-semibold">Financial Health:</span> 
              {selectedDateNetProfit >= 0 ? (
                <span className="text-green-300 font-bold ml-2">
                  Profitable ({selectedDateSales > 0 ? ((selectedDateNetProfit / selectedDateSales) * 100).toFixed(1) : '0'}% margin)
                </span>
              ) : (
                <span className="text-orange-300 font-bold ml-2">
                  Operating at Loss
                </span>
              )}
            </p>
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
          <div className="h-64 flex flex-col justify-end gap-2">
            {pipelineData.length > 0 ? (
              <div className="flex items-end justify-around h-full gap-2 px-4">
                {pipelineData.map((item, index) => {
                  const maxCount = Math.max(...pipelineData.map(d => d.count), 1);
                  const heightPercent = (item.count / maxCount) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-sm font-bold text-slate-700">{item.count}</div>
                      <div 
                        className={`w-full ${item.color} rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer`}
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        title={`${item.stage}: ${item.count} deals`}
                      ></div>
                      <div className="text-xs text-slate-600 text-center font-medium">{item.stage}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <BarChart3 className="mx-auto mb-2 opacity-50" size={32} />
                  <p>No pipeline data yet</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-primary-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
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
