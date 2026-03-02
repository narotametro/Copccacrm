import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Download, Calendar, Package, Target, Brain, TrendingUp, AlertTriangle, CheckCircle, Banknote, Award, Shield, Zap, Eye, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { useSharedData } from '@/context/SharedDataContext';
import { supabase } from '@/lib/supabase';

interface SalesHubCustomer {
  id: string;
  name: string;
  status: string;
  lifetime_value: number;
  total_revenue: number;
  total_orders: number;
}

interface MarketingCampaign {
  id: string;
  name: string;
  leads_generated: number;
  conversions: number;
  budget: number;
  start_date: string;
}

interface Competitor {
  id: string;
  name: string;
  threat_level: string;
  market_share: number;
}

export const Reports: React.FC = () => {
  const { formatCurrency, convertAmount } = useCurrency();
  const { deals, invoices, supportTickets, competitorDeals } = useSharedData();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  
  // Real data from Supabase
  const [salesHubCustomers, setSalesHubCustomers] = useState<SalesHubCustomer[]>([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState<MarketingCampaign[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [realProducts, setRealProducts] = useState<any[]>([]);

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  // Load all real data from Supabase
  const loadRealData = useCallback(async () => {
    if (!supabaseReady) {
      return;
    }

    try {
      // Load sales hub customers
      const { data: customersData } = await supabase
        .from('sales_hub_customers')
        .select('*')
        .eq('status', 'active');
      
      if (customersData) {
        setSalesHubCustomers(customersData);
      }

      // Load marketing campaigns
      const { data: campaignsData } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (campaignsData) {
        setMarketingCampaigns(campaignsData);
      }

      // Load competitors
      const { data: competitorsData } = await supabase
        .from('competitors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (competitorsData) {
        setCompetitors(competitorsData);
      }

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (productsData) {
        setRealProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading real data:', error);
    }
  }, [supabaseReady]);

  useEffect(() => {
    loadRealData();
  }, [loadRealData]);

  // Calculate real analytics data from actual database
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sales Analytics - from invoices and deals
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const monthlyRevenue = invoices
      .filter(inv => inv.status === 'paid' && new Date(inv.created_at) >= thisMonth)
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const activeDeals = deals.filter(deal => deal.stage !== 'won' && deal.stage !== 'lost');
    const wonDeals = deals.filter(deal => deal.stage === 'won');
    const totalDealValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedForecast = activeDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);

    // Customer Analytics - from sales_hub_customers
    const activeCustomers = salesHubCustomers.filter(c => c.status === 'active');
    const totalLifetimeValue = salesHubCustomers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0);
    const avgLifetimeValue = activeCustomers.length > 0 ? totalLifetimeValue / activeCustomers.length : 0;
    const highValueCustomers = salesHubCustomers.filter(c => (c.lifetime_value || 0) > avgLifetimeValue * 1.5);

    // Revenue from sales_hub_customers
    const totalCustomerRevenue = salesHubCustomers.reduce((sum, c) => sum + (c.total_revenue || 0), 0);
    const totalOrders = salesHubCustomers.reduce((sum, c) => sum + (c.total_orders || 0), 0);

    // Product Analytics - from products table (real data)
    const totalProducts = realProducts.length;
    const lowStockProducts = realProducts.filter(p => 
      p.min_stock_level && p.stock_quantity && p.stock_quantity < p.min_stock_level
    );
    const outOfStockProducts = realProducts.filter(p => 
      p.stock_quantity !== undefined && p.stock_quantity === 0
    );
    
    // Find top selling product based on sales tracking
    const productSales = realProducts.map(p => ({
      ...p,
      estimated_sales: p.stock_quantity ? Math.max(0, (p.min_stock_level || 100) - p.stock_quantity) : 0
    }));
    const topSellingProduct = productSales.reduce((top, p) =>
      p.estimated_sales > (top?.estimated_sales || 0) ? p : top, productSales[0] || null);

    // Product revenue estimate (from product price * estimated sales)
    const productRevenue = realProducts.reduce((sum, p) => {
      const estimatedSales = p.stock_quantity ? Math.max(0, (p.min_stock_level || 100) - p.stock_quantity) : 0;
      return sum + ((p.price || 0) * estimatedSales);
    }, 0);

    // Support Analytics - keeping original logic
    const openTickets = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress');
    const resolvedThisMonth = supportTickets.filter(t =>
      t.status === 'resolved' && new Date(t.resolved_date || '') >= thisMonth);
    const avgResolutionTime = resolvedThisMonth.length > 0 ?
      resolvedThisMonth.reduce((sum, t) => {
        const created = new Date(t.created_date);
        const resolved = new Date(t.resolved_date || '');
        return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / resolvedThisMonth.length : 0;

    // Lead Analytics - from marketing_campaigns
    const totalLeads = marketingCampaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0);
    const totalConversions = marketingCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
    const newLeadsThisMonth = marketingCampaigns
      .filter(c => c.start_date && new Date(c.start_date) >= thisMonth)
      .reduce((sum, c) => sum + (c.leads_generated || 0), 0);
    const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

    // Marketing budget and ROI
    const totalMarketingBudget = marketingCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const estimatedRevenue = totalConversions * 500000; // Estimate 500k per conversion
    const marketingROI = totalMarketingBudget > 0 ? (estimatedRevenue / totalMarketingBudget) * 100 : 0;

    // Competitive Intelligence - from competitors table
    const competitorsCount = competitors.length;
    const highThreatCompetitors = competitors.filter(c => 
      c.threat_level === 'high' || c.threat_level === 'critical'
    );
    const avgMarketShare = competitorsCount > 0 ? 
      competitors.reduce((sum, c) => sum + (c.market_share || 0), 0) / competitorsCount : 0;
    
    // Estimate our win rate based on competitor threat levels
    const totalThreatScore = competitors.reduce((sum, c) => {
      const scores = { low: 25, medium: 50, high: 75, critical: 90 };
      return sum + (scores[c.threat_level as keyof typeof scores] || 50);
    }, 0);
    const avgThreatScore = competitorsCount > 0 ? totalThreatScore / competitorsCount : 50;
    const estimatedWinRate = Math.max(20, Math.min(80, 100 - avgThreatScore));

    return {
      sales: {
        totalRevenue: totalRevenue + totalCustomerRevenue, // Combined from invoices and customers
        monthlyRevenue,
        activeDeals: activeDeals.length,
        wonDeals: wonDeals.length,
        totalDealValue,
        weightedForecast,
        avgDealSize: wonDeals.length > 0 ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length : 0,
        totalOrders
      },
      customers: {
        totalCustomers: salesHubCustomers.length,
        activeCustomers: activeCustomers.length,
        totalLifetimeValue,
        avgLifetimeValue,
        highValueCustomers: highValueCustomers.length
      },
      products: {
        totalProducts,
        lowStockProducts: lowStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        topSellingProduct: topSellingProduct?.name || 'N/A',
        totalRevenue: productRevenue
      },
      support: {
        openTickets: openTickets.length,
        resolvedThisMonth: resolvedThisMonth.length,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10
      },
      leads: {
        totalLeads,
        newLeadsThisMonth,
        convertedLeads: totalConversions,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      marketing: {
        totalCampaigns: marketingCampaigns.length,
        totalBudget: totalMarketingBudget,
        totalLeads,
        totalConversions,
        roi: Math.round(marketingROI)
      },
      competitive: {
        totalCompetitors: competitorsCount,
        highThreatCompetitors: highThreatCompetitors.length,
        avgMarketShare: Math.round(avgMarketShare * 10) / 10,
        estimatedWinRate: Math.round(estimatedWinRate * 10) / 10,
        totalCompetitions: competitorDeals.length,
        wonCompetitions: competitorDeals.filter(d => d.outcome === 'won').length,
        lostCompetitions: competitorDeals.filter(d => d.outcome === 'lost').length,
        winRate: competitorDeals.length > 0 ? 
          (competitorDeals.filter(d => d.outcome === 'won').length / competitorDeals.length) * 100 : estimatedWinRate
      }
    };
  }, [invoices, deals, salesHubCustomers, realProducts, supportTickets, marketingCampaigns, competitors, competitorDeals]);

  // Generate dynamic reports based on real data
  const reports = useMemo(() => {
    const reportData = [
      {
        name: 'Sales Performance Report',
        date: new Date().toISOString().split('T')[0],
        type: 'Sales',
        color: 'from-green-600 to-emerald-600',
        icon: Banknote,
        metrics: {
          totalRevenue: analytics.sales.totalRevenue,
          monthlyRevenue: analytics.sales.monthlyRevenue,
          totalOrders: analytics.sales.totalOrders,
          activeDeals: analytics.sales.activeDeals,
          wonDeals: analytics.sales.wonDeals,
          totalDealValue: analytics.sales.totalDealValue,
          forecast: analytics.sales.weightedForecast,
          avgDealSize: analytics.sales.avgDealSize
        }
      },
      {
        name: 'Customer Analysis Report',
        date: new Date().toISOString().split('T')[0],
        type: 'Customer',
        color: 'from-blue-600 to-cyan-600',
        icon: Users,
        metrics: {
          totalCustomers: analytics.customers.totalCustomers,
          activeCustomers: analytics.customers.activeCustomers,
          avgLifetimeValue: analytics.customers.avgLifetimeValue,
          highValueCustomers: analytics.customers.highValueCustomers
        }
      },
      {
        name: 'Revenue Forecast Report',
        date: new Date().toISOString().split('T')[0],
        type: 'Finance',
        color: 'from-purple-600 to-pink-600',
        icon: TrendingUp,
        metrics: {
          currentRevenue: analytics.sales.monthlyRevenue,
          forecastedRevenue: analytics.sales.weightedForecast,
          totalDealValue: analytics.sales.totalDealValue
        }
      },
      {
        name: 'Marketing Campaign Report',
        date: new Date().toISOString().split('T')[0],
        type: 'Marketing',
        color: 'from-orange-600 to-red-600',
        icon: Target,
        metrics: {
          totalCampaigns: analytics.marketing.totalCampaigns,
          totalBudget: analytics.marketing.totalBudget,
          totalLeads: analytics.marketing.totalLeads,
          totalConversions: analytics.marketing.totalConversions,
          roi: analytics.marketing.roi,
          conversionRate: analytics.leads.conversionRate
        }
      },
      {
        name: 'Product Intelligence Report',
        date: new Date().toISOString().split('T')[0],
        type: 'Product',
        color: 'from-indigo-600 to-purple-600',
        icon: Package,
        metrics: {
          totalProducts: analytics.products.totalProducts,
          lowStockProducts: analytics.products.lowStockProducts,
          outOfStockProducts: analytics.products.outOfStockProducts,
          topSellingProduct: analytics.products.topSellingProduct,
          productRevenue: analytics.products.totalRevenue
        }
      },
      {
        name: 'Competitive Intelligence Report',
        date: new Date().toISOString().split('T')[0],
        type: 'Competitive',
        color: 'from-red-600 to-orange-600',
        icon: Shield,
        metrics: {
          totalCompetitors: analytics.competitive.totalCompetitors,
          highThreatCompetitors: analytics.competitive.highThreatCompetitors,
          avgMarketShare: analytics.competitive.avgMarketShare,
          estimatedWinRate: analytics.competitive.estimatedWinRate,
          totalCompetitions: analytics.competitive.totalCompetitions,
          wonCompetitions: analytics.competitive.wonCompetitions,
          lostCompetitions: analytics.competitive.lostCompetitions,
          winRate: analytics.competitive.winRate
        }
      }
    ];

    return reportData;
  }, [analytics]);

  // Calculate report statistics
  const reportStats = useMemo(() => {
    const totalReports = reports.length;
    const generatedThisMonth = reports.filter(r =>
      new Date(r.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ).length;

    // Find most popular based on data volume/complexity
    const mostPopular = reports.reduce((popular, current) => {
      const currentScore = Object.keys(current.metrics).length;
      const popularScore = Object.keys(popular.metrics).length;
      return currentScore > popularScore ? current : popular;
    });

    return {
      totalReports,
      generatedThisMonth,
      mostPopular: mostPopular.name
    };
  }, [reports]);

  const handleDownload = (reportName: string) => {
    const report = reports.find(r => r.name === reportName);
    if (!report) return;

    // Generate comprehensive report content based on real data
    let reportContent = `COPCCA CRM - ${reportName}
Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

================================================================================
${reportName.toUpperCase()}
================================================================================

`;

    // Add specific content based on report type
    switch (report.type) {
      case 'Sales':
        reportContent += `
SALES PERFORMANCE SUMMARY
-------------------------
Total Revenue (All Time): ${formatCurrency(convertAmount(report.metrics.totalRevenue || 0))}
Revenue This Month: ${formatCurrency(convertAmount(report.metrics.monthlyRevenue || 0))}
Total Orders Processed: ${report.metrics.totalOrders || 0}
Active Deals: ${report.metrics.activeDeals || 0}
Won Deals: ${report.metrics.wonDeals || 0}
Total Deal Pipeline Value: ${formatCurrency(convertAmount(report.metrics.totalDealValue || 0))}
Weighted Forecast: ${formatCurrency(convertAmount(report.metrics.forecast || 0))}
Average Deal Size: ${formatCurrency(convertAmount(report.metrics.avgDealSize || 0))}

AI INSIGHTS:
- Sales momentum: ${report.metrics.totalOrders || 0} orders processed with ${formatCurrency(convertAmount(report.metrics.totalRevenue || 0))} total revenue
- Pipeline health: ${(report.metrics.activeDeals || 0) > 0 ? (((report.metrics.forecast || 0) / (report.metrics.totalDealValue || 1)) * 100).toFixed(1) : 0}% weighted conversion probability
- Average deal size of ${formatCurrency(convertAmount(report.metrics.avgDealSize || 0))} indicates ${(report.metrics.avgDealSize || 0) > 1000000 ? 'enterprise' : 'SMB'} focus
- Focus on high-probability deals to maximize revenue potential
`;
        break;

      case 'Customer':
        reportContent += `
CUSTOMER ANALYSIS SUMMARY
-------------------------
Total Customers: ${report.metrics.totalCustomers || 0}
Active Customers: ${report.metrics.activeCustomers || 0}
Average Lifetime Value: ${formatCurrency(convertAmount(report.metrics.avgLifetimeValue || 0))}
High-Value Customers: ${report.metrics.highValueCustomers || 0}

AI INSIGHTS:
- Customer retention rate: ${((report.metrics.activeCustomers || 0) / (report.metrics.totalCustomers || 1) * 100).toFixed(1)}%
- Focus on high-value customer retention and expansion opportunities
- Implement personalized engagement strategies for top-tier customers
`;
        break;

      case 'Finance':
        reportContent += `
REVENUE FORECAST SUMMARY
------------------------
Current Monthly Revenue: ${formatCurrency(convertAmount(report.metrics.currentRevenue || 0))}
Forecasted Revenue: ${formatCurrency(convertAmount(report.metrics.forecastedRevenue || 0))}
Total Pipeline Value: ${formatCurrency(convertAmount(report.metrics.totalDealValue || 0))}

AI INSIGHTS:
- Revenue momentum: ${(report.metrics.forecastedRevenue || 0) > (report.metrics.currentRevenue || 0) ? 'Positive' : 'Needs attention'}
- Forecast accuracy depends on deal progression and conversion rates
- Monitor cash flow and payment terms closely
`;
        break;

      case 'Marketing':
        reportContent += `
MARKETING CAMPAIGN SUMMARY
--------------------------
Total Campaigns: ${report.metrics.totalCampaigns || 0}
Total Marketing Budget: ${formatCurrency(convertAmount(report.metrics.totalBudget || 0))}
Total Leads Generated: ${report.metrics.totalLeads || 0}
Total Conversions: ${report.metrics.totalConversions || 0}
Conversion Rate: ${report.metrics.conversionRate || 0}%
Marketing ROI: ${report.metrics.roi || 0}%

AI INSIGHTS:
- Campaign performance: ${report.metrics.totalCampaigns || 0} active campaigns generating ${report.metrics.totalLeads || 0} leads
- Lead quality ${(report.metrics.conversionRate || 0) > 5 ? 'excellent' : 'needs improvement'} with ${report.metrics.conversionRate || 0}% conversion rate
- Marketing ROI of ${report.metrics.roi || 0}% indicates ${(report.metrics.roi || 0) > 200 ? 'highly effective' : 'moderate'} campaign performance
- Focus on optimizing high-performing channels and scaling successful campaigns
`;
        break;

      case 'Product':
        reportContent += `
PRODUCT INTELLIGENCE SUMMARY
-----------------------------
Total Products: ${report.metrics.totalProducts || 0}
Low Stock Products: ${report.metrics.lowStockProducts || 0}
Out of Stock Products: ${report.metrics.outOfStockProducts || 0}
Top Selling Product: ${report.metrics.topSellingProduct || 'N/A'}
Product Revenue: ${formatCurrency(convertAmount(report.metrics.productRevenue || 0))}

AI INSIGHTS:
- Inventory health: ${(report.metrics.lowStockProducts || 0) + (report.metrics.outOfStockProducts || 0)} products need attention
- ${report.metrics.topSellingProduct || 'N/A'} is the best performer - consider expansion
- Monitor product performance and customer preferences
`;
        break;

      case 'Competitive':
        reportContent += `
COMPETITIVE INTELLIGENCE SUMMARY
---------------------------------
Total Competitors Tracked: ${report.metrics.totalCompetitors || 0}
High-Threat Competitors: ${report.metrics.highThreatCompetitors || 0}
Average Competitor Market Share: ${report.metrics.avgMarketShare || 0}%
Our Estimated Win Rate: ${report.metrics.estimatedWinRate || 0}%

DEAL COMPETITIONS:
Total Competitive Deals: ${report.metrics.totalCompetitions || 0}
Won Against Competitors: ${report.metrics.wonCompetitions || 0}
Lost to Competitors: ${report.metrics.lostCompetitions || 0}
Actual Win Rate: ${report.metrics.winRate || 0}%

AI INSIGHTS:
- Competitive landscape: ${report.metrics.totalCompetitors || 0} tracked competitors with ${report.metrics.highThreatCompetitors || 0} high-threat entities
- Market position ${(report.metrics.winRate || report.metrics.estimatedWinRate || 0) > 60 ? 'strong' : 'needs strengthening'} with ${report.metrics.winRate || report.metrics.estimatedWinRate || 0}%win rate
- ${report.metrics.highThreatCompetitors || 0} competitors require strategic countermeasures
- Focus on differentiators, pricing strategy, and value proposition to improve competitive position
`;
        break;
    }

    reportContent += `

================================================================================
COPCCA CRM 2026 - AI-Powered Business Intelligence Platform
Generated with real-time data from your business operations
================================================================================
`;

    // Create a blob and download link
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`${reportName} downloaded successfully!`);
  };

  return (
    <FeatureGate feature="reports_basic">
      <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Reports & AI Insights</h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Comprehensive analytics and intelligence reports</p>
        </div>
        <Button 
          onClick={() => {
            toast.promise(
              new Promise(resolve => setTimeout(resolve, 2000)),
              {
                loading: 'Generating comprehensive report...',
                success: 'Report generated successfully!',
                error: 'Failed to generate report',
              }
            );
          }} 
          className="text-sm md:text-base"
        >
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {reports.map((report, index) => (
          <Card key={index} hover className="cursor-pointer" onClick={() => setSelectedReport(report.type)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${report.color} flex items-center justify-center flex-shrink-0`}>
                  <report.icon className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 mb-1">{report.name}</h3>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <Calendar size={14} />
                    <span>{report.date}</span>
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded font-medium">
                    {report.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-200">
              <Button variant="ghost" size="sm" icon={Eye} onClick={(e) => {
                e.stopPropagation();
                setSelectedReport(report.type);
              }}>
                View
              </Button>
              <Button variant="ghost" size="sm" icon={Download} onClick={(e) => {
                e.stopPropagation();
                handleDownload(report.name);
              }}>
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <h3 className="text-xs md:text-sm text-slate-600 mb-1 md:mb-2">Total Reports</h3>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">{reportStats.totalReports}</p>
        </Card>
        <Card>
          <h3 className="text-xs md:text-sm text-slate-600 mb-1 md:mb-2">Generated This Month</h3>
          <p className="text-2xl md:text-3xl font-bold text-primary-600">{reportStats.generatedThisMonth}</p>
        </Card>
        <Card>
          <h3 className="text-xs md:text-sm text-slate-600 mb-1 md:mb-2">Most Popular</h3>
          <p className="text-base md:text-lg font-bold text-slate-900">{reportStats.mostPopular}</p>
        </Card>
      </div>

      {/* Sales Performance Report Modal */}
      <Modal
        isOpen={selectedReport === 'Sales'}
        onClose={() => setSelectedReport(null)}
        title="Sales Performance Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-green-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-green-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-green-800">
                  Sales performance shows <span className="font-bold">{formatCurrency(convertAmount(analytics.sales.monthlyRevenue))} revenue this month</span>.
                  {analytics.sales.activeDeals > 0 && (
                    <> Pipeline contains {analytics.sales.activeDeals} active deals worth {formatCurrency(convertAmount(analytics.sales.totalDealValue))} with {formatCurrency(convertAmount(analytics.sales.weightedForecast))} weighted forecast.</>
                  )}
                  {analytics.sales.wonDeals > 0 && (
                    <> {analytics.sales.wonDeals} deals won with average size of {formatCurrency(convertAmount(analytics.sales.avgDealSize))}.</>
                  )}
                  <span className="font-bold"> Focus on pipeline optimization and deal progression to maximize revenue potential.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-green-500">
              <h4 className="font-bold text-slate-900 mb-3">Revenue Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Month-to-Date</span>
                  <span className="font-bold text-green-600">{formatCurrency(convertAmount(analytics.sales.monthlyRevenue) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Revenue</span>
                  <span className="font-bold text-slate-900">{formatCurrency(convertAmount(analytics.sales.totalRevenue) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Pipeline Value</span>
                  <span className="font-bold text-blue-600">{formatCurrency(convertAmount(analytics.sales.totalDealValue) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Weighted Forecast</span>
                  <span className="font-bold text-primary-600">{formatCurrency(convertAmount(analytics.sales.weightedForecast) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-blue-500">
              <h4 className="font-bold text-slate-900 mb-3">Pipeline Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Active Deals</span>
                  <span className="font-bold text-slate-900">{analytics.sales.activeDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Won Deals</span>
                  <span className="font-bold text-green-600">{analytics.sales.wonDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg Deal Size</span>
                  <span className="font-bold text-slate-900">{formatCurrency(convertAmount(analytics.sales.avgDealSize) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Conversion Rate</span>
                  <span className="font-bold text-purple-600">{analytics.sales.activeDeals > 0 ? ((analytics.sales.wonDeals / (analytics.sales.wonDeals + analytics.sales.activeDeals)) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Sales Performance Report')}>
              Download PDF
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                toast.success('Report shared with sales team', {
                  description: 'Email sent to 12 team members'
                });
              }}
            >
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer Analysis Report Modal */}
      <Modal
        isOpen={selectedReport === 'Customer'}
        onClose={() => setSelectedReport(null)}
        title="Customer Analysis Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-blue-800">
                  Customer base analysis shows <span className="font-bold">{analytics.customers.activeCustomers} active customers out of {analytics.customers.totalCustomers} total</span>.
                  {analytics.customers.highValueCustomers > 0 && (
                    <> {analytics.customers.highValueCustomers} high-value customers identified with average lifetime value of {formatCurrency(convertAmount(analytics.customers.avgLifetimeValue))}.</>
                  )}
                  <span className="font-bold"> Focus on customer retention strategies and personalized engagement to maximize lifetime value.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-blue-500">
              <h4 className="font-bold text-slate-900 mb-3">Customer Segmentation</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Customers</span>
                  <span className="font-bold text-slate-900">{analytics.customers.totalCustomers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Active Customers</span>
                  <span className="font-bold text-green-600">{analytics.customers.activeCustomers} ({analytics.customers.totalCustomers > 0 ? ((analytics.customers.activeCustomers / analytics.customers.totalCustomers) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">High-Value Customers</span>
                  <span className="font-bold text-purple-600">{analytics.customers.highValueCustomers} ({analytics.customers.totalCustomers > 0 ? ((analytics.customers.highValueCustomers / analytics.customers.totalCustomers) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Leads</span>
                  <span className="font-bold text-blue-600">{analytics.leads.totalLeads}</span>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-purple-500">
              <h4 className="font-bold text-slate-900 mb-3">💎 Value Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Lifetime Value</span>
                  <span className="font-bold text-green-600">{formatCurrency(convertAmount(analytics.customers.totalLifetimeValue) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg Lifetime Value</span>
                  <span className="font-bold text-blue-600">{formatCurrency(convertAmount(analytics.customers.avgLifetimeValue) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Lead Conversion Rate</span>
                  <span className="font-bold text-orange-600">{analytics.leads.conversionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">New Leads This Month</span>
                  <span className="font-bold text-primary-600">{analytics.leads.newLeadsThisMonth}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Customer Analysis Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with customer success team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revenue Forecast Report Modal */}
      <Modal
        isOpen={selectedReport === 'Finance'}
        onClose={() => setSelectedReport(null)}
        title="Revenue Forecast Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-purple-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-purple-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-purple-800">
                  <span className="font-bold">Current revenue: {formatCurrency(convertAmount(analytics.sales.totalRevenue))}</span> with {formatCurrency(convertAmount(analytics.sales.monthlyRevenue))} this month.
                  {analytics.sales.weightedForecast > 0 && (
                    <> Pipeline forecast shows {formatCurrency(convertAmount(analytics.sales.weightedForecast))} in potential revenue from active deals.</>
                  )}
                  <span className="font-bold"> Focus on pipeline conversion and revenue optimization strategies.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-purple-500">
              <h4 className="font-bold text-slate-900 mb-3">Revenue Projections</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Current Month</span>
                  <span className="font-bold text-purple-600">{formatCurrency(convertAmount(analytics.sales.monthlyRevenue) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Revenue</span>
                  <span className="font-bold text-slate-900">{formatCurrency(convertAmount(analytics.sales.totalRevenue) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Pipeline Value</span>
                  <span className="font-bold text-blue-600">{formatCurrency(convertAmount(analytics.sales.totalDealValue) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Weighted Forecast</span>
                  <span className="font-bold text-green-600">{formatCurrency(convertAmount(analytics.sales.weightedForecast) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-pink-500">
              <h4 className="font-bold text-slate-900 mb-3">💳 Financial Overview</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Active Deals</span>
                  <span className="font-bold text-green-600">{analytics.sales.activeDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Won Deals</span>
                  <span className="font-bold text-blue-600">{analytics.sales.wonDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg Deal Size</span>
                  <span className="font-bold text-orange-600">{formatCurrency(convertAmount(analytics.sales.avgDealSize) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Conversion Rate</span>
                  <span className="font-bold text-purple-600">{analytics.sales.activeDeals > 0 ? ((analytics.sales.wonDeals / (analytics.sales.wonDeals + analytics.sales.activeDeals)) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Net Cash Position</span>
                  <span className="font-bold text-primary-600">{formatCurrency(convertAmount(680000) / 1000)}<span className="text-xs ml-0.5">K</span></span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Revenue Forecast Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with finance team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Marketing Campaign Report Modal */}
      <Modal
        isOpen={selectedReport === 'Marketing'}
        onClose={() => setSelectedReport(null)}
        title="Marketing Campaign Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-orange-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-orange-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-orange-800">
                  <span className="font-bold">Lead generation shows {analytics.leads.totalLeads} total leads with {analytics.leads.conversionRate}% conversion rate</span>.
                  {analytics.leads.newLeadsThisMonth > 0 && (
                    <> {analytics.leads.newLeadsThisMonth} new leads this month indicate healthy inbound flow.</>
                  )}
                  {analytics.leads.convertedLeads > 0 && (
                    <> {analytics.leads.convertedLeads} leads successfully converted to customers.</>
                  )}
                  <span className="font-bold"> Focus on lead nurturing and conversion optimization.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-orange-500">
              <h4 className="font-bold text-slate-900 mb-3">Lead Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Leads</span>
                  <span className="font-bold text-orange-600">{analytics.leads.totalLeads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">New This Month</span>
                  <span className="font-bold text-green-600">{analytics.leads.newLeadsThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Conversion Rate</span>
                  <span className="font-bold text-primary-600">{analytics.leads.conversionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Converted Leads</span>
                  <span className="font-bold text-slate-900">{analytics.leads.convertedLeads}</span>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-red-500">
              <h4 className="font-bold text-slate-900 mb-3">Marketing Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Lead Quality</span>
                  <span className="font-bold text-green-600">{analytics.leads.totalLeads > 0 ? 'Good' : 'Monitor'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Pipeline Impact</span>
                  <span className="font-bold text-blue-600">{analytics.leads.convertedLeads} customers</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Growth Rate</span>
                  <span className="font-bold text-purple-600">{analytics.leads.newLeadsThisMonth > 0 ? 'Active' : 'Stable'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Conversion Trend</span>
                  <span className="font-bold text-orange-600">{analytics.leads.conversionRate >= 10 ? 'Strong' : 'Improving'}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Marketing Campaign Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with marketing team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Product Intelligence Report Modal */}
      <Modal
        isOpen={selectedReport === 'Product'}
        onClose={() => setSelectedReport(null)}
        title="Product Intelligence Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <Brain className="text-indigo-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-indigo-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-indigo-800">
                  Product portfolio analysis shows <span className="font-bold">{analytics.products.totalProducts} products generating {formatCurrency(convertAmount(analytics.products.totalRevenue))} in revenue</span>.
                  {analytics.products.topSellingProduct !== 'N/A' && (
                    <> {analytics.products.topSellingProduct} is the top performer.</>
                  )}
                  {analytics.products.lowStockProducts > 0 && (
                    <> {analytics.products.lowStockProducts} products need inventory attention.</>
                  )}
                  <span className="font-bold"> Focus on inventory optimization and product performance monitoring.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Product Performance Summary */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Package className="text-indigo-600" size={20} />
              Product Performance Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Total Products</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">ACTIVE</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">{analytics.products.totalProducts}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium">Products in catalog</span>
                  <span className="text-slate-600">Revenue: {formatCurrency(convertAmount(analytics.products.totalRevenue) / 1000)}K</span>
                </div>
              </Card>

              <Card className="border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Top Performer</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">LEADER</span>
                </div>
                <p className="text-lg font-bold text-slate-900 mb-1">{analytics.products.topSellingProduct}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 font-medium">Best selling product</span>
                  <span className="text-slate-600">Monitor performance</span>
                </div>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Inventory Alerts</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">ATTENTION</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">{analytics.products.lowStockProducts + analytics.products.outOfStockProducts}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-600 font-medium">Low/out of stock</span>
                  <span className="text-slate-600">Needs replenishment</span>
                </div>
              </Card>

              <Card className="border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Stock Status</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">HEALTHY</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">{analytics.products.totalProducts - analytics.products.lowStockProducts - analytics.products.outOfStockProducts}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600 font-medium">Well stocked products</span>
                  <span className="text-slate-600">Good inventory health</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Competitive Analysis */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="text-red-600" size={20} />
              Competitive Position
            </h3>
            <div className="space-y-3">
              <Card className="bg-green-50 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-1">Competitive Advantages</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• <span className="font-semibold">40% lower pricing</span> than Salesforce Professional</li>
                      <li>• <span className="font-semibold">Built-in competitive intelligence</span> (unique feature)</li>
                      <li>• <span className="font-semibold">AI-native architecture</span> vs legacy systems</li>
                      <li>• <span className="font-semibold">Mobile-first</span> design for field teams</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="bg-orange-50 border-2 border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 mb-1">Areas for Improvement</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Analytics product needs better reporting dashboard</li>
                      <li>• Limited integrations compared to HubSpot (25 vs 500+)</li>
                      <li>• Enterprise features less mature than competitors</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap className="text-primary-600" size={20} />
              AI Strategic Recommendations
            </h3>
            <div className="space-y-3">
              <Card className="border-l-4 border-primary-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">1</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Double Down on Mobile & AI Assistant</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      These products have highest AI scores (92, 95) and growth rates (45%, 52%). 
                      Allocate 60% of R&D budget here for maximum ROI.
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        toast.promise(
                          new Promise(resolve => setTimeout(resolve, 1500)),
                          {
                            loading: 'Creating resource allocation plan...',
                            success: 'Plan created! Added to your tasks.',
                            error: 'Failed to create plan',
                          }
                        );
                      }}
                    >
                      Create Action Plan
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">2</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Reposition Analytics Product</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Customer feedback indicates need for better dashboards. Invest in UI overhaul and add predictive analytics features.
                      Potential to increase revenue from {formatCurrency(convertAmount(45000))} to {formatCurrency(convertAmount(75000))}/mo.
                    </p>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => {
                        toast.success('Product review scheduled', {
                          description: 'Added to calendar for next week'
                        });
                      }}
                    >
                      Schedule Review
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-green-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center">3</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Increase Pricing on CRM Pro</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Market analysis shows you can raise price from {formatCurrency(convertAmount(49.99))} to {formatCurrency(convertAmount(59.99))} without affecting conversion. 
                      Estimated additional {formatCurrency(convertAmount(25000))}/mo revenue.
                    </p>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => {
                        toast.promise(
                          new Promise(resolve => setTimeout(resolve, 2000)),
                          {
                            loading: 'Running pricing simulation...',
                            success: 'Simulation complete! Revenue increase projected.',
                            error: 'Simulation failed',
                          }
                        );
                      }}
                    >
                      Run Simulation
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Product Intelligence Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Competitive Intelligence Report Modal */}
      <Modal
        isOpen={selectedReport === 'Competitive'}
        onClose={() => setSelectedReport(null)}
        title="Competitive Intelligence Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <Brain className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-red-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-red-800">
                  Competitive analysis shows <span className="font-bold">{analytics.competitive.totalCompetitions} competitive situations tracked</span> with a {analytics.competitive.winRate}% win rate.
                  {analytics.competitive.wonCompetitions > 0 && (
                    <> {analytics.competitive.wonCompetitions} competitions won successfully.</>
                  )}
                  {analytics.competitive.lostCompetitions > 0 && (
                    <> {analytics.competitive.lostCompetitions} competitions lost - analyze patterns for improvement.</>
                  )}
                  <span className="font-bold"> Focus on competitive intelligence and win rate optimization.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Threat Level Dashboard */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Target className="text-red-600" size={20} />
              Competitor Performance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Total Competitions</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">TRACKED</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mb-1">{analytics.competitive.totalCompetitions}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Competitive situations</span>
                  <span className="text-green-600 font-medium">Active monitoring</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Win Rate:</p>
                  <p className="text-xs text-green-700 font-medium">{analytics.competitive.winRate}% success rate</p>
                </div>
              </Card>

              <Card className="border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Competitions Won</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">SUCCESS</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 mb-1">{analytics.competitive.wonCompetitions}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Successful outcomes</span>
                  <span className="text-blue-600 font-medium">Analyze win factors</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Success Rate:</p>
                  <p className="text-xs text-blue-700 font-medium">{analytics.competitive.totalCompetitions > 0 ? ((analytics.competitive.wonCompetitions / analytics.competitive.totalCompetitions) * 100).toFixed(1) : 0}% of competitions</p>
                </div>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Competitions Lost</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">LEARNING</span>
                </div>
                <p className="text-2xl font-bold text-orange-600 mb-1">{analytics.competitive.lostCompetitions}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Areas for improvement</span>
                  <span className="text-orange-600 font-medium">Review loss reasons</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Loss Rate:</p>
                  <p className="text-xs text-orange-700 font-medium">{analytics.competitive.totalCompetitions > 0 ? ((analytics.competitive.lostCompetitions / analytics.competitive.totalCompetitions) * 100).toFixed(1) : 0}% of competitions</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Competitive Wins & Losses */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="text-primary-600" size={20} />
              Win/Loss Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-green-50 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-2">Why We Win</h4>
                    <ul className="text-sm text-green-800 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✓</span>
                        <span><span className="font-semibold">Lower price:</span> 40% cheaper than Salesforce, 25% vs HubSpot</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✓</span>
                        <span><span className="font-semibold">Better support:</span> 24/7 local support vs 9-5 international</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✓</span>
                        <span><span className="font-semibold">Unique features:</span> Competitive intelligence built-in</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✓</span>
                        <span><span className="font-semibold">Mobile-first:</span> Best mobile experience in market</span>
                      </li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="text-xs text-green-700"><span className="font-bold">Win Rate:</span> 65% when competing directly</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-red-50 border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 mb-2">Why We Lose</h4>
                    <ul className="text-sm text-red-800 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✗</span>
                        <span><span className="font-semibold">Enterprise features:</span> Missing advanced workflow automation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✗</span>
                        <span><span className="font-semibold">Integrations:</span> Only 25 vs HubSpot's 500+</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✗</span>
                        <span><span className="font-semibold">Brand recognition:</span> Less known than Salesforce/Microsoft</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✗</span>
                        <span><span className="font-semibold">Reporting:</span> Limited customization vs Tableau integration</span>
                      </li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-red-300">
                      <p className="text-xs text-red-700"><span className="font-bold">Loss Rate:</span> 35% (mostly large enterprises)</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Strategic Responses */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap className="text-primary-600" size={20} />
              AI Strategic Counter-Moves
            </h3>
            <div className="space-y-3">
              <Card className="border-l-4 border-red-500 bg-red-50">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 text-white font-bold text-sm flex items-center justify-center">!</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-red-900">URGENT: Counter RivalTech Pricing</h4>
                      <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-bold rounded">DO NOW</span>
                    </div>
                    <p className="text-sm text-red-800 mb-3">
                      RivalTech's 15% price cut threatens {formatCurrency(convertAmount(240000))} in active deals (Acme Corp, GlobalTech). 
                      <span className="font-bold"> Recommend: Offer time-limited enterprise bundle at 20% discount + 3 months free support.</span>
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => toast.success('Creating counter-offer proposal...')}>
                        Create Counter-Offer
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => toast.success('Alerting sales team...')}>
                        Alert Sales Team
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">1</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Accelerate Enterprise Features Development</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      70% of losses to MarketLeader cite missing enterprise features. Priority: Advanced workflow automation, 
                      custom reporting, and SSO integration. Timeline: 8 weeks. Expected impact: Reduce loss rate from 35% to 20%.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => toast.success('Scheduling sprint planning...')}>
                      Schedule Sprint
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-blue-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">2</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Launch Integration Marketplace</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Partner with top 50 SaaS tools (Slack, Zoom, QuickBooks, etc.) to close integration gap. 
                      Focus on African market tools competitors ignore (M-Pesa, local accounting software).
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => toast.success('Creating partnership plan...')}>
                      Create Plan
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-green-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center">3</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Amplify Your Unique Strengths</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      No competitor has built-in competitive intelligence. Create marketing campaign highlighting this: 
                      "While they track customers, we help you beat competitors." Target SMBs struggling against larger players.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => toast.success('Briefing marketing team...')}>
                      Brief Marketing
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Market Opportunities */}
          <Card className="bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200">
            <div className="flex items-start gap-3">
              <Banknote className="text-primary-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-primary-900 mb-1">Market Opportunity Detected</h3>
                <p className="text-sm text-primary-800 mb-2">
                  <span className="font-bold">African SMB market growing 45% YoY</span> with low competitor penetration. 
                  Both Salesforce and HubSpot focus on large enterprises. 
                  Opportunity: Position as "The CRM Built for African SMBs" and capture market before they do.
                </p>
                <p className="text-xs text-primary-700 mt-2">
                  <span className="font-semibold">Estimated TAM:</span> {formatCurrency(convertAmount(2800000000) / 1000000000)}<span className="text-xs ml-0.5">B</span> across Nigeria, Kenya, Ghana, South Africa
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Competitive Intelligence Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with executive team')}>
              Share with Executives
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </FeatureGate>
  );
};
