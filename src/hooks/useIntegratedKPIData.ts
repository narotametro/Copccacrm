import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/lib/types/database';

type Company = Database['public']['Tables']['companies']['Row'];
type Deal = Database['public']['Tables']['deals']['Row'];
type Task = Database['public']['Tables']['after_sales_tasks']['Row'];
type Profile = Database['public']['Tables']['users']['Row'];
type Debt = Database['public']['Tables']['debt_collection']['Row'];

// Local storage data interfaces
interface LocalStorageCustomer {
  id: string;
  name: string;
  total_revenue?: number;
  health_score?: number;
  customer_type?: string;
  churn_risk?: number;
  upsell_potential?: number;
}

interface LocalStorageDeal {
  id: string;
  value?: number;
  stage?: string;
}

interface LocalStorageDebt {
  id: string;
  amount?: number;
  status?: string;
}

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
        // Use available data from companies table
        const totalRevenue = companies.length * 100000; // Mock calculation
        const avgHealthScore = companies.reduce((sum: number, company: Company) => sum + (company.health_score || 50), 0) / companies.length;
        const churnRiskAvg = 25; // Mock value
        const activeCustomers = companies.filter((c: Company) => c.status === 'active').length;
        const vipCustomers = Math.floor(companies.length * 0.2); // Mock calculation

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
            currentValue: 65, // Mock value
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
        const customers: LocalStorageCustomer[] = JSON.parse(savedCustomers);
        const totalRevenue = customers.reduce((sum: number, customer: LocalStorageCustomer) => sum + (customer.total_revenue || 0), 0);
        const avgHealthScore = customers.reduce((sum: number, customer: LocalStorageCustomer) => sum + (customer.health_score || 50), 0) / customers.length;
        const activeCustomers = customers.filter((c: LocalStorageCustomer) => c.customer_type === 'active').length;

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
            currentValue: Math.round(customers.reduce((sum: number, customer: LocalStorageCustomer) => sum + (customer.churn_risk || 0), 0) / customers.length),
            targetValue: 20,
            unit: 'percentage',
            description: 'Average churn risk percentage',
            source: 'Local Data',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'customers',
            name: 'Upsell Potential',
            currentValue: Math.round(customers.reduce((sum: number, customer: LocalStorageCustomer) => sum + (customer.upsell_potential || 0), 0) / customers.length),
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
        const totalValue = deals.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0);
        const wonDeals = deals.filter((d: Deal) => d.stage === 'won').length;
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
        const deals: LocalStorageDeal[] = JSON.parse(savedDeals);
        const totalValue = deals.reduce((sum: number, deal: LocalStorageDeal) => sum + (deal.value || 0), 0);
        const wonDeals = deals.filter((d: LocalStorageDeal) => d.stage === 'won').length;
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
        const totalLeads = campaigns.reduce((sum: number, campaign: Database['public']['Tables']['sales_strategies']['Row']) => sum + (campaign.leads_generated || 0), 0);
        const totalConversions = campaigns.reduce((sum: number, campaign: Database['public']['Tables']['sales_strategies']['Row']) => sum + (campaign.conversions || 0), 0);
        const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
        const activeCampaigns = campaigns.filter((c: Database['public']['Tables']['sales_strategies']['Row']) => c.status === 'active').length;

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

    // Fallback data - only if no real data available
    return [];
  };

  const fetchCustomerPerformanceMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try Supabase first for after-sales tasks
      const { data: tasks, error } = await supabase
        .from('after_sales_tasks')
        .select('*');

      if (error) throw error;

      if (tasks && tasks.length > 0) {
        const completedTasks = tasks.filter((t: Task) => t.status === 'done').length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const urgentTasks = tasks.filter((t: Task) => t.priority === 'urgent').length;

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

    // Fallback data - only if no real data available
    return [];
  };

  const fetchOperationsMetrics = async (): Promise<IntegratedKPIData[]> => {
    // Operations metrics - try to fetch from Supabase or return empty if no data
    try {
      // Try to get system metrics from a system_metrics table or similar
      const { data: metrics, error } = await supabase
        .from('system_metrics')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (metrics && metrics.length > 0) {
        const metric = metrics[0];
        return [
          {
            category: 'operations',
            name: 'System Uptime',
            currentValue: metric.uptime || 0,
            targetValue: 99.9,
            unit: 'percentage',
            description: 'System availability and uptime',
            source: 'Operations Dashboard',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'operations',
            name: 'Process Efficiency',
            currentValue: metric.efficiency || 0,
            targetValue: 92,
            unit: 'percentage',
            description: 'Operational process efficiency score',
            source: 'Operations Analytics',
            lastUpdated: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.log('Supabase not available for operations metrics');
    }

    // No demo data - return empty array if no real data available
    return [];
  };

  const fetchTeamMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try Supabase first for user/team data
      const { data: profiles, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      if (profiles && profiles.length > 0) {
        const activeUsers = profiles.filter((p: Profile) => p.status === 'active').length;
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
            currentValue: 85, // Mock value
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

    // Fallback data - only if no real data available
    return [];
  };

  const fetchDebtCollectionMetrics = async (): Promise<IntegratedKPIData[]> => {
    try {
      // Try Supabase first
      const { data: debts, error } = await supabase
        .from('debt_collection')
        .select('*');

      if (error) throw error;

      if (debts && debts.length > 0) {
        const totalDebt = debts.reduce((sum: number, debt: Debt) => sum + (debt.amount || 0), 0);
        const collectedAmount = debts.filter((d: Debt) => d.status === 'paid').reduce((sum: number, debt: Debt) => sum + (debt.amount || 0), 0);
        const collectionRate = totalDebt > 0 ? (collectedAmount / totalDebt) * 100 : 0;
        const overdueDebts = debts.filter((d: Debt) => d.status === 'overdue').length;

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
        const debts: LocalStorageDebt[] = JSON.parse(savedDebts);
        const totalDebt = debts.reduce((sum: number, debt: LocalStorageDebt) => sum + (debt.amount || 0), 0);
        const collectedAmount = debts.filter((d: LocalStorageDebt) => d.status === 'paid').reduce((sum: number, debt: LocalStorageDebt) => sum + (debt.amount || 0), 0);
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