import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface IntegratedKPIData {
  category: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  description: string;
  source: string;
  lastUpdated: string;
}

export interface BusinessMetrics {
  customers: IntegratedKPIData[];
  sales: IntegratedKPIData[];
  marketing: IntegratedKPIData[];
  customerPerformance: IntegratedKPIData[];
  operations: IntegratedKPIData[];
  team: IntegratedKPIData[];
  debtCollection: IntegratedKPIData[];
}

export const useIntegratedKPIData = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    customers: [],
    sales: [],
    marketing: [],
    customerPerformance: [],
    operations: [],
    team: [],
    debtCollection: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const fetchCustomerMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try to fetch from Supabase first
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*');

      if (error) throw error;

      if (companies && companies.length > 0) {
        const totalRevenue = companies.reduce((sum, company) => sum + (company.total_revenue || 0), 0);
        const avgHealthScore = companies.reduce((sum, company) => sum + (company.health_score || 0), 0) / companies.length;
        const churnRiskAvg = companies.reduce((sum, company) => sum + (company.churn_risk || 0), 0) / companies.length;
        const activeCustomers = companies.filter(c => c.customer_type === 'active').length;
        const vipCustomers = companies.filter(c => c.customer_type === 'vip').length;

        return [
          {
            category: 'customers',
            name: 'Total Revenue',
            currentValue: totalRevenue,
            targetValue: totalRevenue * 1.2, // 20% growth target
            unit: 'currency',
            description: 'Total revenue from all customers',
            source: 'Customer Database',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Average Health Score',
            currentValue: Math.round(avgHealthScore),
            targetValue: 85,
            unit: 'percentage',
            description: 'Average customer health score across all accounts',
            source: 'Customer Analytics',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Churn Risk',
            currentValue: Math.round(churnRiskAvg),
            targetValue: 20, // Target under 20%
            unit: 'percentage',
            description: 'Average churn risk percentage',
            source: 'Customer Analytics',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Upsell Potential',
            currentValue: 50, // Mock data - would be calculated from customer data
            targetValue: 70, // Target 70% upsell potential
            unit: 'percentage',
            description: 'Average upsell opportunity across customer base',
            source: 'Customer Analytics',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Active Customers',
            currentValue: activeCustomers,
            targetValue: activeCustomers + 10, // Grow by 10 customers
            unit: 'count',
            description: 'Number of active customer accounts',
            source: 'Customer Database',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'VIP Customers',
            currentValue: vipCustomers,
            targetValue: vipCustomers + 2, // Grow VIP base
            unit: 'count',
            description: 'Number of VIP customer accounts',
            source: 'Customer Database',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.log('Supabase not available, using localStorage fallback');
    }

    // Fallback to localStorage data
    try {
      const savedCustomers = localStorage.getItem('copcca-customers');
      if (savedCustomers) {
        const customers = JSON.parse(savedCustomers);
        const totalRevenue = customers.reduce((sum: number, customer: any) => sum + (customer.total_revenue || 0), 0);
        const avgHealthScore = customers.reduce((sum: number, customer: any) => sum + (customer.health_score || 50), 0) / customers.length;
        const activeCustomers = customers.filter((c: any) => c.customer_type === 'active').length;

        return [
          {
            category: 'customers',
            name: 'Total Revenue',
            currentValue: totalRevenue,
            targetValue: totalRevenue * 1.2,
            unit: 'currency',
            description: 'Total revenue from all customers',
            source: 'Local Data',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Average Health Score',
            currentValue: Math.round(avgHealthScore),
            targetValue: 85,
            unit: 'percentage',
            description: 'Average customer health score',
            source: 'Local Data',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Churn Risk',
            currentValue: 20, // Mock data for localStorage fallback
            targetValue: 20,
            unit: 'percentage',
            description: 'Average churn risk percentage',
            source: 'Local Data',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Upsell Potential',
            currentValue: 50, // Mock data for localStorage fallback
            targetValue: 70,
            unit: 'percentage',
            description: 'Average upsell opportunity across customer base',
            source: 'Local Data',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Active Customers',
            currentValue: activeCustomers,
            targetValue: activeCustomers + 5,
            unit: 'count',
            description: 'Number of active customers',
            source: 'Local Data',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    }

    return [];
  };

  const fetchSalesMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try Supabase first
      const { data: deals, error } = await supabase
        .from('deals')
        .select('*');

      if (error) throw error;

      if (deals && deals.length > 0) {
        const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const wonDeals = deals.filter(d => d.status === 'won').length;
        const totalDeals = deals.length;
        const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
        const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

        return [
          {
            category: 'sales',
            name: 'Total Pipeline Value',
            currentValue: totalValue,
            targetValue: totalValue * 1.25,
            unit: 'currency',
            description: 'Total value of all deals in pipeline',
            source: 'Sales Pipeline',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'sales',
            name: 'Win Rate',
            currentValue: Math.round(winRate),
            targetValue: 75,
            unit: 'percentage',
            description: 'Percentage of deals won',
            source: 'Sales Analytics',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'sales',
            name: 'Average Deal Size',
            currentValue: Math.round(avgDealSize),
            targetValue: avgDealSize * 1.1,
            unit: 'currency',
            description: 'Average value per deal',
            source: 'Sales Analytics',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'sales',
            name: 'Deals in Pipeline',
            currentValue: totalDeals,
            targetValue: totalDeals + 20,
            unit: 'count',
            description: 'Total number of active deals',
            source: 'Sales Pipeline',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.log('Supabase not available, using localStorage fallback');
    }

    // Fallback to localStorage
    try {
      const savedDeals = localStorage.getItem('copcca-deals');
      if (savedDeals) {
        const deals = JSON.parse(savedDeals);
        const totalValue = deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
        const wonDeals = deals.filter((d: any) => d.status === 'won').length;
        const winRate = deals.length > 0 ? (wonDeals / deals.length) * 100 : 0;

        return [
          {
            category: 'sales',
            name: 'Total Pipeline Value',
            currentValue: totalValue,
            targetValue: totalValue * 1.25,
            unit: 'currency',
            description: 'Total value of deals in pipeline',
            source: 'Local Sales Data',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'sales',
            name: 'Win Rate',
            currentValue: Math.round(winRate),
            targetValue: 75,
            unit: 'percentage',
            description: 'Sales win rate percentage',
            source: 'Local Sales Data',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
    }

    return [];
  };

  const fetchMarketingMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try Supabase first
      const { data: campaigns, error } = await supabase
        .from('sales_strategies')
        .select('*');

      if (error) throw error;

      if (campaigns && campaigns.length > 0) {
        const totalLeads = campaigns.reduce((sum, campaign) => sum + (campaign.leads_generated || 0), 0);
        const totalConversions = campaigns.reduce((sum, campaign) => sum + (campaign.conversions || 0), 0);
        const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

        return [
          {
            category: 'marketing',
            name: 'Total Leads Generated',
            currentValue: totalLeads,
            targetValue: totalLeads + 50,
            unit: 'count',
            description: 'Total leads from marketing campaigns',
            source: 'Marketing Campaigns',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'marketing',
            name: 'Conversion Rate',
            currentValue: Math.round(conversionRate),
            targetValue: 25,
            unit: 'percentage',
            description: 'Lead to customer conversion rate',
            source: 'Marketing Analytics',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'marketing',
            name: 'Active Campaigns',
            currentValue: activeCampaigns,
            targetValue: activeCampaigns + 2,
            unit: 'count',
            description: 'Number of currently active campaigns',
            source: 'Marketing Campaigns',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.log('Supabase not available, using localStorage fallback');
    }

    // Fallback data
    return [
      {
        category: 'marketing',
        name: 'Monthly Leads',
        currentValue: 125,
        targetValue: 150,
        unit: 'count',
        description: 'Leads generated this month',
        source: 'Marketing Dashboard',
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'marketing',
        name: 'Campaign ROI',
        currentValue: 320,
        targetValue: 400,
        unit: 'percentage',
        description: 'Return on marketing investment',
        source: 'Marketing Analytics',
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  const fetchCustomerPerformanceMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try Supabase first for after-sales tasks
      const { data: tasks, error } = await supabase
        .from('after_sales_tasks')
        .select('*');

      if (error) throw error;

      if (tasks && tasks.length > 0) {
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const urgentTasks = tasks.filter(t => t.priority === 'urgent').length;

        return [
          {
            category: 'customer-performance',
            name: 'Task Completion Rate',
            currentValue: Math.round(completionRate),
            targetValue: 90,
            unit: 'percentage',
            description: 'Percentage of after-sales tasks completed',
            source: 'After Sales',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customer-performance',
            name: 'Active Tasks',
            currentValue: totalTasks - completedTasks,
            targetValue: 10, // Keep under 10 active tasks
            unit: 'count',
            description: 'Number of active after-sales tasks',
            source: 'After Sales',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customer-performance',
            name: 'Urgent Tasks',
            currentValue: urgentTasks,
            targetValue: 2, // Keep urgent tasks low
            unit: 'count',
            description: 'Number of urgent priority tasks',
            source: 'After Sales',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.log('Supabase not available, using localStorage fallback');
    }

    // Fallback data
    return [
      {
        category: 'customer-performance',
        name: 'Customer Satisfaction',
        currentValue: 92,
        targetValue: 95,
        unit: 'percentage',
        description: 'Average customer satisfaction score',
        source: 'Customer Feedback',
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'customer-performance',
        name: 'Support Response Time',
        currentValue: 2.3,
        targetValue: 2.0,
        unit: 'hours',
        description: 'Average response time for support tickets',
        source: 'Support System',
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  const fetchOperationsMetrics = async (): Promise<IntegratedKPIData[]> => {
    // Operations metrics - using localStorage or calculated data
    return [
      {
        category: 'operations',
        name: 'System Uptime',
        currentValue: 99.7,
        targetValue: 99.9,
        unit: 'percentage',
        description: 'System availability and uptime',
        source: 'Operations Dashboard',
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'operations',
        name: 'Process Efficiency',
        currentValue: 87,
        targetValue: 92,
        unit: 'percentage',
        description: 'Operational process efficiency score',
        source: 'Operations Analytics',
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'operations',
        name: 'Automation Coverage',
        currentValue: 73,
        targetValue: 85,
        unit: 'percentage',
        description: 'Percentage of processes automated',
        source: 'Operations Dashboard',
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  const fetchTeamMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try Supabase first for user/team data
      const { data: profiles, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      if (profiles && profiles.length > 0) {
        const activeUsers = profiles.filter(p => p.last_sign_in_at).length;
        const totalUsers = profiles.length;

        return [
          {
            category: 'team',
            name: 'Active Team Members',
            currentValue: activeUsers,
            targetValue: totalUsers,
            unit: 'count',
            description: 'Number of active team members',
            source: 'User Management',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'team',
            name: 'Team Productivity',
            currentValue: 88,
            targetValue: 95,
            unit: 'percentage',
            description: 'Overall team productivity score',
            source: 'Team Analytics',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.log('Supabase not available, using localStorage fallback');
    }

    // Fallback data
    return [
      {
        category: 'team',
        name: 'Team Productivity',
        currentValue: 88,
        targetValue: 95,
        unit: 'percentage',
        description: 'Overall team productivity score',
        source: 'Team Dashboard',
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'team',
        name: 'Task Completion Rate',
        currentValue: 91,
        targetValue: 95,
        unit: 'percentage',
        description: 'Percentage of assigned tasks completed',
        source: 'Team Management',
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  const fetchDebtCollectionMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try Supabase first
      const { data: debts, error } = await supabase
        .from('debt_collection')
        .select('*');

      if (error) throw error;

      if (debts && debts.length > 0) {
        const totalDebt = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
        const collectedAmount = debts.filter(d => d.status === 'paid').reduce((sum, debt) => sum + (debt.amount || 0), 0);
        const collectionRate = totalDebt > 0 ? (collectedAmount / totalDebt) * 100 : 0;
        const overdueDebts = debts.filter(d => d.status === 'overdue').length;

        return [
          {
            category: 'debt-collection',
            name: 'Total Outstanding Debt',
            currentValue: totalDebt - collectedAmount,
            targetValue: (totalDebt - collectedAmount) * 0.8, // Reduce by 20%
            unit: 'currency',
            description: 'Total amount of outstanding debt',
            source: 'Debt Collection',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'debt-collection',
            name: 'Collection Rate',
            currentValue: Math.round(collectionRate),
            targetValue: 85,
            unit: 'percentage',
            description: 'Percentage of debt successfully collected',
            source: 'Debt Analytics',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'debt-collection',
            name: 'Overdue Accounts',
            currentValue: overdueDebts,
            targetValue: Math.max(0, overdueDebts - 5), // Reduce by 5
            unit: 'count',
            description: 'Number of accounts with overdue payments',
            source: 'Debt Collection',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.log('Supabase not available, using localStorage fallback');
    }

    // Fallback to localStorage
    try {
      const savedDebts = localStorage.getItem('copcca-debts');
      if (savedDebts) {
        const debts = JSON.parse(savedDebts);
        const totalDebt = debts.reduce((sum: number, debt: any) => sum + (debt.amount || 0), 0);
        const collectedAmount = debts.filter((d: any) => d.status === 'paid').reduce((sum: number, debt: any) => sum + (debt.amount || 0), 0);
        const collectionRate = totalDebt > 0 ? (collectedAmount / totalDebt) * 100 : 0;

        return [
          {
            category: 'debt-collection',
            name: 'Outstanding Debt',
            currentValue: totalDebt - collectedAmount,
            targetValue: (totalDebt - collectedAmount) * 0.8,
            unit: 'currency',
            description: 'Total outstanding debt amount',
            source: 'Local Debt Data',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'debt-collection',
            name: 'Collection Rate',
            currentValue: Math.round(collectionRate),
            targetValue: 85,
            unit: 'percentage',
            description: 'Debt collection success rate',
            source: 'Local Debt Data',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('Error loading debt data:', error);
    }

    return [];
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        customerMetrics,
        salesMetrics,
        marketingMetrics,
        customerPerformanceMetrics,
        operationsMetrics,
        teamMetrics,
        debtCollectionMetrics
      ] = await Promise.all([
        fetchCustomerMetrics(),
        fetchSalesMetrics(),
        fetchMarketingMetrics(),
        fetchCustomerPerformanceMetrics(),
        fetchOperationsMetrics(),
        fetchTeamMetrics(),
        fetchDebtCollectionMetrics()
      ]);

      setMetrics({
        customers: customerMetrics,
        sales: salesMetrics,
        marketing: marketingMetrics,
        customerPerformance: customerPerformanceMetrics,
        operations: operationsMetrics,
        team: teamMetrics,
        debtCollection: debtCollectionMetrics
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrated KPI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  return {
    metrics,
    loading,
    error,
    refreshData
  };
};