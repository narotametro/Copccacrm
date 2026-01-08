import React from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Target,
  Activity,
  ArrowRight,
  Sparkles,
  Phone,
  Send,
  DollarSign,
  Bell,
  Plus,
  BarChart3,
  Shield,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = {
    todayRevenue: 45200,
    monthRevenue: 524000,
    activeCustomers: 127,
    newLeads: 23,
    openTasks: 8,
    outstandingDebt: 165000,
    conversionRate: 68.5,
    customerHealth: 82,
    churnRisk: 12,
    recoveryRate: 94,
  };

  const kpis = [
    { name: 'Sales Target', current: 524000, target: 800000, progress: 65.5, color: 'primary' },
    { name: 'Marketing ROI', current: 185, target: 200, progress: 92.5, color: 'purple' },
    { name: 'Collections', current: 94, target: 100, progress: 94, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-purple-600/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-primary-600 to-purple-600 text-white p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                <Sparkles size={24} className="text-yellow-300 md:w-8 md:h-8" />
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Welcome Back!</h1>
              </div>
              <p className="text-sm md:text-lg lg:text-xl opacity-90">Tuesday, January 7, 2026 • Here's your business at a glance</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                icon={Bell}
                onClick={() => toast.info('3 new notifications')}
              >
                <span className="hidden md:inline">Notifications</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Business Snapshot Cards */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-3 md:mb-4">📊 Business Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="text-green-600" size={24} />
                <TrendingUp className="text-green-600" size={16} />
              </div>
              <p className="text-xs text-slate-600 mb-1">Today Revenue</p>
              <p className="text-xl font-bold text-slate-900">₦{(stats.todayRevenue / 1000).toFixed(1)}K</p>
              <p className="text-xs text-green-600 mt-1">+12% vs yesterday</p>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/customers')}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-blue-600" size={24} />
                <CheckCircle className="text-blue-600" size={16} />
              </div>
              <p className="text-xs text-slate-600 mb-1">Active Customers</p>
              <p className="text-xl font-bold text-slate-900">{stats.activeCustomers}</p>
              <p className="text-xs text-blue-600 mt-1">+8 this month</p>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/pipeline')}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Target className="text-purple-600" size={24} />
                <Sparkles className="text-purple-600" size={16} />
              </div>
              <p className="text-xs text-slate-600 mb-1">New Leads</p>
              <p className="text-xl font-bold text-slate-900">{stats.newLeads}</p>
              <p className="text-xs text-purple-600 mt-1">+5 today</p>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/after-sales')}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Activity className="text-orange-600" size={24} />
                <AlertCircle className="text-orange-600" size={16} />
              </div>
              <p className="text-xs text-slate-600 mb-1">Open Tasks</p>
              <p className="text-xl font-bold text-slate-900">{stats.openTasks}</p>
              <p className="text-xs text-orange-600 mt-1">3 due today</p>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/debt-collection')}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="text-red-600" size={24} />
                <TrendingDown className="text-red-600" size={16} />
              </div>
              <p className="text-xs text-slate-600 mb-1">Outstanding</p>
              <p className="text-xl font-bold text-slate-900">₦{(stats.outstandingDebt / 1000).toFixed(0)}K</p>
              <p className="text-xs text-red-600 mt-1">-₦12K this week</p>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="text-primary-600" size={24} />
                <TrendingUp className="text-primary-600" size={16} />
              </div>
              <p className="text-xs text-slate-600 mb-1">Month Revenue</p>
              <p className="text-xl font-bold text-slate-900">₦{(stats.monthRevenue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-primary-600 mt-1">65% of target</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Access Buttons */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-3 md:mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          <Button 
            icon={Plus} 
            className="w-full justify-center text-sm md:text-base"
            onClick={() => navigate('/customers')}
          >
            <span className="hidden sm:inline">Add </span>Customer
          </Button>
          <Button 
            icon={Plus} 
            variant="secondary"
            className="w-full justify-center text-sm md:text-base"
            onClick={() => navigate('/competitors')}
          >
            <span className="hidden sm:inline">Add </span>Competitor
          </Button>
          <Button 
            icon={Plus} 
            variant="secondary"
            className="w-full justify-center text-sm md:text-base"
            onClick={() => navigate('/after-sales')}
          >
            <span className="hidden sm:inline">Assign </span>Task
          </Button>
          <Button 
            icon={Search} 
            variant="secondary"
            className="w-full justify-center text-sm md:text-base"
            onClick={() => navigate('/products')}
          >
            <span className="hidden sm:inline">Analyze </span>Product
          </Button>
        </div>
      </div>

      {/* 🧠 AI INSIGHTS FEED */}
      <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Brain size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">🧠 AI Insights Feed</h2>
            <p className="text-xs md:text-sm text-slate-600">Your top 3 action items today</p>
          </div>
        </div>

        <div className="space-y-2 md:space-y-3">
          <div className="flex items-start gap-2 md:gap-4 p-3 md:p-4 bg-white rounded-lg md:rounded-xl border-l-4 border-red-500 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm md:text-base">1</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1 md:gap-2 mb-1">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">URGENT: High Churn Risk Detected</h3>
              </div>
              <p className="text-slate-600 text-xs md:text-sm mb-2 md:mb-3">
                <strong>Acme Corp</strong> (₦50K/month) - No contact in 35 days. Payment delays increasing. 
                <span className="text-red-600 font-semibold"> 78% churn probability.</span>
              </p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Button size="sm" icon={Phone} onClick={() => toast.success('Calling Acme Corp...')} className="text-xs md:text-sm">
                  <span className="hidden sm:inline">Call </span>Now
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/customers')} className="text-xs md:text-sm">
                  View<span className="hidden sm:inline"> Details</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 md:gap-4 p-3 md:p-4 bg-white rounded-lg md:rounded-xl border-l-4 border-orange-500 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm md:text-base">2</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1 md:gap-2 mb-1">
                <Target className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">Competitor Alert: Pricing Change</h3>
              </div>
              <p className="text-slate-600 text-xs md:text-sm mb-2 md:mb-3">
                <strong>RivalTech</strong> reduced enterprise pricing by 15%. 
                <span className="text-orange-600 font-semibold"> 2 active deals at risk (₦240K).</span> Recommend counter-offer.
              </p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Button size="sm" icon={Shield} onClick={() => navigate('/competitors')} className="text-xs md:text-sm">
                  <span className="hidden sm:inline">Review </span>Strategy
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/pipeline')} className="text-xs md:text-sm">
                  <span className="hidden sm:inline">Check </span>Deals
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 md:gap-4 p-3 md:p-4 bg-white rounded-lg md:rounded-xl border-l-4 border-green-500 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm md:text-base">3</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1 md:gap-2 mb-1">
                <TrendingUp className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">Revenue Opportunity: Close Today</h3>
              </div>
              <p className="text-slate-600 text-xs md:text-sm mb-2 md:mb-3">
                <strong>GlobalTech Inc</strong> deal (₦120K) in final stage. 
                <span className="text-green-600 font-semibold"> 92% win probability.</span> One call can close it.
              </p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Button size="sm" icon={Phone} onClick={() => toast.success('Calling GlobalTech...')} className="text-xs md:text-sm">
                  <span className="hidden sm:inline">Call to </span>Close
                </Button>
                <Button size="sm" icon={Send} variant="secondary" onClick={() => toast.success('Contract sent!')} className="text-xs md:text-sm">
                  <span className="hidden sm:inline">Send </span>Contract
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Progress Bars */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-3 md:mb-4">🎯 KPI Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.name} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 text-sm md:text-base">{kpi.name}</h3>
                <span className={`text-${kpi.color}-600 font-bold text-sm md:text-base`}>{kpi.progress.toFixed(1)}%</span>
              </div>
              <div className="mb-2 md:mb-3">
                <div className="w-full bg-slate-200 rounded-full h-2.5 md:h-3">
                  <div
                    className={`bg-gradient-to-r from-${kpi.color}-500 to-${kpi.color}-600 h-2.5 md:h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${kpi.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs md:text-sm text-slate-600">
                <span>₦{(kpi.current / 1000).toFixed(0)}K</span>
                <span>Target: ₦{(kpi.target / 1000).toFixed(0)}K</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Alerts & Notifications */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <Bell className="text-orange-600" size={20} />
          <h2 className="text-lg md:text-xl font-bold text-slate-900">🔔 Alerts & Notifications</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">3 invoices overdue • ₦95K at risk</p>
              <p className="text-xs text-slate-600">MegaCorp Ltd, StartupX, TechCo</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/debt-collection')}>
              View
            </Button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Competitor launched new product feature</p>
              <p className="text-xs text-slate-600">RivalTech - AI automation module</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/competitors')}>
              View
            </Button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Market shift detected in enterprise segment</p>
              <p className="text-xs text-slate-600">15% increase in cloud migrations</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/competitors')}>
              Analyze
            </Button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">5 new qualified leads from marketing campaign</p>
              <p className="text-xs text-slate-600">Enterprise segment • High intent</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/pipeline')}>
              Review
            </Button>
          </div>
        </div>
      </Card>

      {/* Priority Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-red-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/pipeline')}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">🔥 Hot Deals - Close This Week</h3>
              <p className="text-sm text-slate-600 mb-3">2 deals in final negotiation (₦240K)</p>
              <Button size="sm" icon={ArrowRight}>View Pipeline</Button>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/strategies')}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">📈 Marketing ROI Winner</h3>
              <p className="text-sm text-slate-600 mb-3">Email campaign: 185% ROI, scale it!</p>
              <Button size="sm" icon={ArrowRight}>Launch Campaign</Button>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
