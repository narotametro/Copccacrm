
import { TrendingUp, TrendingDown, Users, Banknote, BarChart3, Activity, Globe, ShoppingCart, Calendar, ChevronUp, ChevronDown, Sparkles, ArrowUp, ArrowDown, ArrowRight, Minus, Equal, Eye, EyeOff, DollarSign, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCurrency, currencies } from '@/context/CurrencyContext';
import { formatName } from '@/lib/textFormat';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/types/database';
import { useOptimisticCache } from '@/lib/optimisticCache';

type DealRow = Database['public']['Tables']['deals']['Row'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type ExpenseRow = {
  id: string;
  amount: number;
  expense_date: string;
  created_at: string;
  created_by: string;
};
type SalesHubOrderRow = {
  id: string;
  total_amount: number;
  created_at: string;
  created_by: string;
};
type ProductRow = {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock_level: number | null;
  created_by: string;
};
type DebtRow = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  created_by: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const displayName = formatName(profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
  const { currency, setCurrency, formatCurrency } = useCurrency();
  
  // Revenue period state - defaults to current month
  const [revenuePeriod, setRevenuePeriod] = useState<string>(() => {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
    return currentMonth;
  });
  
  // Sales date selector state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDateSales, setSelectedDateSales] = useState<number>(0);
  const [selectedDateCOGS, setSelectedDateCOGS] = useState<number>(0);
  const [selectedDateGrossProfit, setSelectedDateGrossProfit] = useState<number>(0);
  const [selectedDateGrowth, setSelectedDateGrowth] = useState<number>(0);
  const [selectedDateCOGSGrowth, setSelectedDateCOGSGrowth] = useState<number>(0);
  const [selectedDateGrossProfitGrowth, setSelectedDateGrossProfitGrowth] = useState<number>(0);
  
  // Floating button state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  // KPI boxes visibility state
  const [showRevenue, setShowRevenue] = useState<boolean>(true);
  const [showExpenses, setShowExpenses] = useState<boolean>(true);
  const [showProfit, setShowProfit] = useState<boolean>(true);
  
  // Optimistic caches for instant loading
  const { data: salesHubOrders } = useOptimisticCache<SalesHubOrderRow>({
    table: 'sales_hub_orders',
    query: 'total_amount, created_at',
    queryFilters: user?.id ? [
      { column: 'created_by', operator: 'eq', value: user.id }
    ] : [],
    orderBy: { column: 'created_at', ascending: false },
  });

  const { data: companies } = useOptimisticCache<CompanyRow>({
    table: 'companies',
    query: 'id, name, status, created_at',
    queryFilters: user?.id ? [
      { column: 'is_own_company', operator: 'eq', value: false },
      { column: 'created_by', operator: 'eq', value: user.id }
    ] : [],
    orderBy: { column: 'created_at', ascending: false },
  });

  const { data: deals } = useOptimisticCache<DealRow>({
    table: 'deals',
    query: 'id, title, stage, created_at',
    queryFilters: user?.id ? [
      { column: 'created_by', operator: 'eq', value: user.id }
    ] : [],
    orderBy: { column: 'created_at', ascending: false },
  });

  const { data: expenses } = useOptimisticCache<ExpenseRow>({
    table: 'expenses',
    query: 'id, amount, expense_date, created_at',
    queryFilters: user?.id ? [
      { column: 'created_by', operator: 'eq', value: user.id }
    ] : [],
    orderBy: { column: 'created_at', ascending: false },
  });

  const { data: products } = useOptimisticCache<ProductRow>({
    table: 'products',
    query: 'id, name, stock_quantity, min_stock_level',
    queryFilters: user?.id ? [
      { column: 'created_by', operator: 'eq', value: user.id }
    ] : [],
    orderBy: { column: 'created_at', ascending: false },
  });

  const { data: debts } = useOptimisticCache<DebtRow>({
    table: 'debts',
    query: 'id, amount, status, created_at',
    queryFilters: user?.id ? [
      { column: 'created_by', operator: 'eq', value: user.id }
    ] : [],
    orderBy: { column: 'created_at', ascending: false },
  });

  // Calculate total revenue from Sales Hub orders only (matches Product Analysis)
  const totalRevenue = useMemo(() => {
    const ordersRevenue = salesHubOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    return ordersRevenue;
  }, [salesHubOrders]);

  // Calculate total expenses from cached data
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [expenses]);

  // Calculate filtered revenue by period
  const filteredRevenue = useMemo(() => {
    if (revenuePeriod === 'all') return totalRevenue;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

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
        endDate = new Date(now.getFullYear(), monthIndex + 1, 0, 23, 59, 59);
        break;

      case 'q1':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 3, 0, 23, 59, 59);
        break;

      case 'q2':
        startDate = new Date(now.getFullYear(), 3, 1);
        endDate = new Date(now.getFullYear(), 6, 0, 23, 59, 59);
        break;

      case 'q3':
        startDate = new Date(now.getFullYear(), 6, 1);
        endDate = new Date(now.getFullYear(), 9, 0, 23, 59, 59);
        break;

      case 'q4':
        startDate = new Date(now.getFullYear(), 9, 1);
        endDate = new Date(now.getFullYear(), 12, 0, 23, 59, 59);
        break;

      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = now;
        break;

      case 'annual':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 12, 0, 23, 59, 59);
        break;

      default:
        return totalRevenue;
    }

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const filteredOrders = salesHubOrders.filter(order => {
      const createdTime = new Date(order.created_at).getTime();
      return createdTime >= startTime && createdTime <= endTime;
    });

    const ordersRev = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return ordersRev;
  }, [revenuePeriod, totalRevenue, salesHubOrders]);

  // Calculate filtered expenses by period
  const filteredExpenses = useMemo(() => {
    if (revenuePeriod === 'all') return totalExpenses;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

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
        endDate = new Date(now.getFullYear(), monthIndex + 1, 0, 23, 59, 59);
        break;

      case 'q1':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 3, 0, 23, 59, 59);
        break;

      case 'q2':
        startDate = new Date(now.getFullYear(), 3, 1);
        endDate = new Date(now.getFullYear(), 6, 0, 23, 59, 59);
        break;

      case 'q3':
        startDate = new Date(now.getFullYear(), 6, 1);
        endDate = new Date(now.getFullYear(), 9, 0, 23, 59, 59);
        break;

      case 'q4':
        startDate = new Date(now.getFullYear(), 9, 1);
        endDate = new Date(now.getFullYear(), 12, 0, 23, 59, 59);
        break;

      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = now;
        break;

      case 'annual':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 12, 0, 23, 59, 59);
        break;

      default:
        return totalExpenses;
    }

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const filteredExpensesData = expenses.filter(exp => {
      const expenseTime = new Date(exp.expense_date || exp.created_at).getTime();
      return expenseTime >= startTime && expenseTime <= endTime;
    });

    return filteredExpensesData.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [revenuePeriod, totalExpenses, expenses]);

  // Calculate filtered profit
  const filteredProfit = useMemo(() => {
    return filteredRevenue - filteredExpenses;
  }, [filteredRevenue, filteredExpenses]);

  // Calculate active customers
  const activeCustomers = useMemo(() => companies.length, [companies]);

  // Calculate low stock alerts
  const lowStockProducts = useMemo(() => {
    return products.filter(product => {
      const minLevel = product.min_stock_level || 10; // Default to 10 if not set
      return product.stock_quantity <= minLevel;
    });
  }, [products]);

  const criticalStockProducts = useMemo(() => {
    return products.filter(product => product.stock_quantity === 0);
  }, [products]);

  // Calculate total outstanding (unpaid debts)
  const totalOutstanding = useMemo(() => {
    return debts.reduce((sum, debt) => {
      if (debt.status !== 'paid' && debt.status !== 'written_off') {
        return sum + debt.amount;
      }
      return sum;
    }, 0);
  }, [debts]);

  // Calculate pipeline data
  const pipelineData = useMemo(() => {
    const stages = [
      { stage: 'lead', label: 'Lead', color: 'bg-slate-500' },
      { stage: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
      { stage: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
      { stage: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
      { stage: 'won', label: 'Won', color: 'bg-green-500' }
    ];

    return stages.map(s => ({
      stage: s.label,
      count: deals.filter(d => d.stage === s.stage).length,
      color: s.color
    }));
  }, [deals]);

  // Calculate recent activities
  const recentActivities = useMemo(() => {
    const activities: Array<{
      type: string;
      title: string;
      description: string;
      time: string;
      color: string;
    }> = [];

    // Recent deals (last 3)
    const recentDeals = deals.slice(0, 3);
    recentDeals.forEach((deal) => {
      activities.push({
        type: deal.stage === 'won' ? 'deal_won' : 'deal_created',
        title: deal.stage === 'won' ? 'New deal closed' : 'New deal created',
        description: deal.title,
        time: new Date(deal.created_at).toLocaleString(),
        color: deal.stage === 'won' ? 'green' : 'blue'
      });
    });

    // Recent companies (last 2)
    const recentCompanies = companies.slice(0, 2);
    recentCompanies.forEach((company) => {
      activities.push({
        type: 'company_added',
        title: 'Customer added',
        description: company.name,
        time: new Date(company.created_at).toLocaleString(),
        color: 'blue'
      });
    });

    // Sort by time and return top 3
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return activities.slice(0, 3);
  }, [deals, companies]);

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
      
      // Fetch sales for the selected date from sales_hub_orders (YOUR sales for now)
      const { data: dateOrders, error: dateOrdersError } = await supabase
        .from('sales_hub_orders')
        .select('total_amount, items, created_at')
        .eq('created_by', userData.user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (!dateOrdersError && dateOrders) {
        const sales = dateOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        setSelectedDateSales(sales);
        
        // Calculate COGS from order items using weighted average from stock history
        let cogs = 0;
        for (const order of dateOrders) {
          if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
              // Try to get weighted average purchase cost from stock_history
              const { data: stockHistory } = await supabase
                .from('stock_history')
                .select('purchase_cost_per_unit, quantity')
                .eq('product_id', item.product_id)
                .eq('action', 'restock')
                .not('purchase_cost_per_unit', 'is', null);
              
              let costPerUnit = 0;
              
              if (stockHistory && stockHistory.length > 0) {
                // Calculate weighted average cost
                const totalCost = stockHistory.reduce((sum, record) => 
                  sum + (record.purchase_cost_per_unit || 0) * record.quantity, 0);
                const totalQuantity = stockHistory.reduce((sum, record) => 
                  sum + record.quantity, 0);
                costPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;
              } else {
                // Fallback to product cost_price if no stock history
                const { data: product } = await supabase
                  .from('products')
                  .select('cost_price')
                  .eq('id', item.product_id)
                  .single();
                
                costPerUnit = product?.cost_price || 0;
              }
              
              cogs += item.quantity * costPerUnit;
            }
          }
        }
        setSelectedDateCOGS(cogs);
        
        // Calculate gross profit (Sales - COGS)
        const grossProfit = sales - cogs;
        setSelectedDateGrossProfit(grossProfit);
        
        // Calculate growth compared to previous day
        const prevDay = new Date(date);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevStart = new Date(prevDay);
        prevStart.setHours(0, 0, 0, 0);
        const prevEnd = new Date(prevDay);
        prevEnd.setHours(23, 59, 59, 999);
        
        const { data: prevOrders, error: prevError } = await supabase
          .from('sales_hub_orders')
          .select('total_amount, items')
          .eq('created_by', userData.user.id)
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString());
        
        if (!prevError && prevOrders) {
          const prevSales = prevOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
          
          // Calculate previous day COGS using weighted average from stock history
          let prevCogs = 0;
          for (const order of prevOrders) {
            if (order.items && Array.isArray(order.items)) {
              for (const item of order.items) {
                // Try to get weighted average purchase cost from stock_history
                const { data: stockHistory } = await supabase
                  .from('stock_history')
                  .select('purchase_cost_per_unit, quantity')
                  .eq('product_id', item.product_id)
                  .eq('action', 'restock')
                  .not('purchase_cost_per_unit', 'is', null);
                
                let costPerUnit = 0;
                
                if (stockHistory && stockHistory.length > 0) {
                  // Calculate weighted average cost
                  const totalCost = stockHistory.reduce((sum, record) => 
                    sum + (record.purchase_cost_per_unit || 0) * record.quantity, 0);
                  const totalQuantity = stockHistory.reduce((sum, record) => 
                    sum + record.quantity, 0);
                  costPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;
                } else {
                  // Fallback to product cost_price if no stock history
                  const { data: product } = await supabase
                    .from('products')
                    .select('cost_price')
                    .eq('id', item.product_id)
                    .single();
                  
                  costPerUnit = product?.cost_price || 0;
                }
                
                prevCogs += item.quantity * costPerUnit;
              }
            }
          }
          
          const prevGrossProfit = prevSales - prevCogs;
          
          // Sales growth
          const growth = prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : 0;
          setSelectedDateGrowth(growth);
          
          // COGS growth
          const cogsGrowth = prevCogs > 0 ? ((cogs - prevCogs) / prevCogs) * 100 : 0;
          setSelectedDateCOGSGrowth(cogsGrowth);
          
          // Gross profit growth
          const grossProfitGrowth = prevGrossProfit !== 0 ? ((grossProfit - prevGrossProfit) / Math.abs(prevGrossProfit)) * 100 : 0;
          setSelectedDateGrossProfitGrowth(grossProfitGrowth);
        } else {
          setSelectedDateGrowth(0);
          setSelectedDateCOGSGrowth(0);
          setSelectedDateGrossProfitGrowth(0);
        }
      } else {
        setSelectedDateSales(0);
        setSelectedDateCOGS(0);
        setSelectedDateGrossProfit(0);
        setSelectedDateGrowth(0);
        setSelectedDateCOGSGrowth(0);
        setSelectedDateGrossProfitGrowth(0);
      }
    } catch (error) {
      console.error('Error fetching sales for date:', error);
      setSelectedDateSales(0);
      setSelectedDateCOGS(0);
      setSelectedDateGrossProfit(0);
      setSelectedDateGrowth(0);
      setSelectedDateCOGSGrowth(0);
      setSelectedDateGrossProfitGrowth(0);
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
        {showRevenue && (
          <Card className="p-6 relative">
            <button
              onClick={() => setShowRevenue(false)}
              className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded transition-colors"
              title="Hide"
            >
              <EyeOff className="text-slate-400" size={16} />
            </button>
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
        )}

        {showExpenses && (
          <Card className="p-6 relative">
            <button
              onClick={() => setShowExpenses(false)}
              className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded transition-colors"
              title="Hide"
            >
              <EyeOff className="text-slate-400" size={16} />
            </button>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <DollarSign className="text-red-600" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600">Total Expenses</p>
                    <p className="text-lg font-bold text-slate-900 break-words">{formatCurrency(filteredExpenses)}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Period: {revenuePeriod === 'all' ? 'All Time' : 
                  revenuePeriod === 'q1' ? 'Q1 (Jan-Mar)' :
                  revenuePeriod === 'q2' ? 'Q2 (Apr-Jun)' :
                  revenuePeriod === 'q3' ? 'Q3 (Jul-Sep)' :
                  revenuePeriod === 'q4' ? 'Q4 (Oct-Dec)' :
                  revenuePeriod === '6months' ? 'Last 6 Months' :
                  revenuePeriod === 'annual' ? 'Annual (This Year)' :
                  revenuePeriod.charAt(0).toUpperCase() + revenuePeriod.slice(1)}
              </div>
            </div>
          </Card>
        )}

        {showProfit && (
          <Card className="p-6 relative">
            <button
              onClick={() => setShowProfit(false)}
              className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded transition-colors"
              title="Hide"
            >
              <EyeOff className="text-slate-400" size={16} />
            </button>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    filteredProfit > 0 ? 'bg-emerald-100' : 
                    filteredProfit < 0 ? 'bg-orange-100' : 
                    'bg-slate-100'
                  }`}>
                    <TrendingUp className={
                      filteredProfit > 0 ? 'text-emerald-600' : 
                      filteredProfit < 0 ? 'text-orange-600' : 
                      'text-slate-600'
                    } size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600">Total Profit</p>
                    <p className={`text-lg font-bold break-words ${
                      filteredProfit > 0 ? 'text-emerald-600' : 
                      filteredProfit < 0 ? 'text-orange-600' : 
                      'text-slate-900'
                    }`}>{formatCurrency(filteredProfit)}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Period: {revenuePeriod === 'all' ? 'All Time' : 
                  revenuePeriod === 'q1' ? 'Q1 (Jan-Mar)' :
                  revenuePeriod === 'q2' ? 'Q2 (Apr-Jun)' :
                  revenuePeriod === 'q3' ? 'Q3 (Jul-Sep)' :
                  revenuePeriod === 'q4' ? 'Q4 (Oct-Dec)' :
                  revenuePeriod === '6months' ? 'Last 6 Months' :
                  revenuePeriod === 'annual' ? 'Annual (This Year)' :
                  revenuePeriod.charAt(0).toUpperCase() + revenuePeriod.slice(1)}
              </div>
            </div>
          </Card>
        )}

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

        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => {
            navigate('/app/inventory');
            localStorage.setItem('inventoryActiveTab', 'stock-alerts');
          }}
        >
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-slate-600">Low Stock Alerts</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{lowStockProducts.length}</p>
                <span className="text-xs text-slate-500">need attention</span>
              </div>
              {criticalStockProducts.length > 0 && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  {criticalStockProducts.length} critical (out of stock)
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-slate-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalOutstanding)}</p>
              <p className="text-xs text-slate-500 mt-1">
                {debts.filter(d => d.status !== 'paid' && d.status !== 'written_off').length} unpaid invoices
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Hidden Cards Control */}
      {(!showRevenue || !showExpenses || !showProfit) && (
        <Card className="p-4 bg-slate-50">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-slate-600">Show hidden cards:</span>
            {!showRevenue && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRevenue(true)}
                className="flex items-center gap-1"
              >
                <Eye size={14} />
                Total Revenue
              </Button>
            )}
            {!showExpenses && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExpenses(true)}
                className="flex items-center gap-1"
              >
                <Eye size={14} />
                Total Expenses
              </Button>
            )}
            {!showProfit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowProfit(true)}
                className="flex items-center gap-1"
              >
                <Eye size={14} />
                Total Profit
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Quick Track Money Flow */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="mb-4">
          <div>
            <h3 className="text-xl font-bold">Gross Profit = Total Sales - Cost of Goods Sold</h3>
            <p className="text-blue-100">COGS-based profitability tracking</p>
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
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Total Sales</p>
                  <p className="text-[9px] text-slate-500">Revenue</p>
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

            {/* Money OUT (COGS) */}
            <div className="flex-1 max-w-[200px]">
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-red-300 hover:shadow-lg transition-shadow">
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide">Cost of Goods Sold</p>
                  <p className="text-[9px] text-slate-500">COGS</p>
                </div>
                <p className="text-xl font-bold text-red-700">
                  {formatCurrency(selectedDateCOGS)}
                </p>
              </div>
            </div>

            {/* Equals Arrow */}
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-5 w-5 text-blue-200 hidden md:block" />
              <ArrowDown className="h-5 w-5 text-blue-200 md:hidden" />
              <Equal className="h-5 w-5 text-white font-bold" />
            </div>

            {/* GROSS PROFIT */}
            <div className="flex-1 max-w-[200px]">
              <div className={`bg-white rounded-xl p-4 shadow-md border-2 ${
                selectedDateGrossProfit >= 0 
                  ? 'border-emerald-400 hover:border-emerald-500' 
                  : 'border-orange-400 hover:border-orange-500'
              } hover:shadow-lg transition-all`}>
                <div className="mb-2">
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                    selectedDateGrossProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'
                  }`}>Gross Profit</p>
                  <p className="text-[9px] text-slate-500">Sales - COGS</p>
                </div>
                <p className={`text-xl font-bold ${
                  selectedDateGrossProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'
                }`}>
                  {formatCurrency(selectedDateGrossProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="mt-3 pt-3 border-t border-white/20 text-center">
            <p className="text-sm text-blue-100">
              <span className="font-semibold">Financial Health:</span> 
              {selectedDateGrossProfit >= 0 ? (
                <span className="text-green-300 font-bold ml-2">
                  Profitable ({selectedDateSales > 0 ? ((selectedDateGrossProfit / selectedDateSales) * 100).toFixed(1) : '0'}% gross margin)
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
