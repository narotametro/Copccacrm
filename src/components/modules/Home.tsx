import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Users, FileText, AlertTriangle, TrendingUp, Plus, Calendar, CheckCircle, AlertCircle, Clock, DollarSign, Target, BarChart3, Zap, Globe, Bot } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useAfterSales, useDebtCollection, useTasks } from '../lib/use-data';
import { useCurrency, CURRENCIES } from '../lib/currency-context';
import { formatNumberWithCommas } from '../lib/utils';
import { AIAssistant } from './AIAssistant';
import { CollaborationBanner, TeamPresence } from './SyncIndicator';
import { useTeamData } from '../lib/useTeamData';
import { toast } from 'sonner@2.0.3';
import { AIInsightReport } from './AIInsightReport';
import { UserViewBanner } from './shared/UserViewBanner';
import { TaskManagement } from './TaskManagement';
export const Home = memo(function Home() {
  const { isAdmin, user, selectedUserId } = useAuth();
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ai-report' | 'tasks'>('ai-report');
  const currencySelectorRef = useRef<HTMLDivElement>(null);
  
  // Filter currencies based on search
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch) return CURRENCIES;
    const searchLower = currencySearch.toLowerCase();
    return CURRENCIES.filter(curr => 
      curr.code.toLowerCase().includes(searchLower) ||
      curr.name.toLowerCase().includes(searchLower) ||
      curr.symbol.toLowerCase().includes(searchLower)
    );
  }, [currencySearch]);
  
  // Use team-aware data hook with real-time collaboration
  const {
    afterSalesData,
    kpiData,
    competitorsData,
    salesData,
    debtData,
    tasksData,
    teamMembers,
    loading,
    error,
    isRefreshing,
    lastUpdate,
    refresh,
    refetch,
  } = useTeamData({
    realtime: true,
    refreshInterval: 10000, // 10 seconds - balanced between responsiveness and performance
  });

  // Close currency selector on click outside or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencySelectorRef.current && !currencySelectorRef.current.contains(event.target as Node)) {
        setShowCurrencySelector(false);
        setCurrencySearch('');
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCurrencySelector(false);
        setCurrencySearch('');
      }
    };

    if (showCurrencySelector) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showCurrencySelector]);

  // Memoize expensive calculations
  const calculateStats = useCallback(() => {
    const afterSalesActive = afterSalesData.length;
    const avgPerformance = afterSalesData.length > 0 
      ? Math.round(afterSalesData.reduce((sum, item) => sum + (item.salesPerformance || 0), 0) / afterSalesData.length)
      : 0;

    const kpiTargetsMet = kpiData.filter(item => (item.actualValue || 0) >= (item.targetValue || 0)).length;
    const kpiTotal = kpiData.length;

    const competitorsTracked = competitorsData.length;
    const totalProducts = competitorsData.reduce((sum, comp) => sum + (comp.products?.length || 0), 0);

    const salesStrategies = salesData.filter(s => s.type === 'sales').length;
    const marketingStrategies = salesData.filter(s => s.type === 'marketing').length;

    const totalDebt = debtData.reduce((sum, item) => sum + (item.amountDue || 0), 0);
    const pendingAccounts = debtData.filter(item => item.status !== 'Paid').length;

    return {
      afterSalesActive,
      avgPerformance,
      kpiTargetsMet,
      kpiTotal,
      competitorsTracked,
      totalProducts,
      salesStrategies,
      marketingStrategies,
      totalDebt,
      pendingAccounts,
    };
  }, [afterSalesData, kpiData, competitorsData, salesData, debtData]);

  const stats = useMemo(() => calculateStats(), [calculateStats]);

  return (
    <div className="p-8 space-y-6">
      {/* User View Banner */}
      <UserViewBanner />
      
      {/* Background Refresh Indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
          <div className="h-full bg-white/30 animate-pulse"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl">AI ASSISTANT</h2>
              <p className="text-sm text-gray-600">
                {loading ? 'Loading data...' : isRefreshing ? 'Syncing...' : 'Real-time business insights'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Currency Selector */}
          <div className="relative" ref={currencySelectorRef}>
            <button
              onClick={() => setShowCurrencySelector(!showCurrencySelector)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm hover:border-pink-300"
              title="Change Currency"
            >
              <Globe size={18} className="text-gray-600" />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{currency}</span>
                <span className="text-xs text-gray-500">({currencySymbol})</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${showCurrencySelector ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showCurrencySelector && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
                  <input
                    type="text"
                    placeholder="Search currency..."
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                
                {/* Currency List */}
                <div className="max-h-80 overflow-y-auto">
                  {filteredCurrencies.length > 0 ? (
                    filteredCurrencies.map((curr) => (
                      <button
                        key={curr.code}
                        onClick={() => {
                          setCurrency(curr.code);
                          setShowCurrencySelector(false);
                          setCurrencySearch('');
                          toast.success(`💱 Currency changed to ${curr.name} (${curr.symbol})`);
                        }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                          currency === curr.code ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-500' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{curr.code}</span>
                            <span className="text-xs text-gray-500">{curr.name}</span>
                          </div>
                          <span className="text-lg font-semibold">{curr.symbol}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No currencies found matching "{currencySearch}"
                    </div>
                  )}
                </div>
                
                {/* Footer Info */}
                <div className="p-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  <p className="text-xs text-gray-500 text-center">
                    {filteredCurrencies.length} {filteredCurrencies.length === 1 ? 'currency' : 'currencies'} available
                  </p>
                </div>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-t-xl border border-b-0 border-gray-200 shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('ai-report')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === 'ai-report'
                ? 'text-purple-600 border-b-3 border-purple-600 bg-gradient-to-b from-purple-50 to-transparent'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bot size={20} />
            AI Insight Report
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'text-purple-600 border-b-3 border-purple-600 bg-gradient-to-b from-purple-50 to-transparent'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Task Management
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl border border-gray-200 shadow-sm">
        {activeTab === 'ai-report' && (
          <div className="p-6">
            <AIInsightReport
              afterSalesData={afterSalesData}
              kpiData={kpiData}
              competitorsData={competitorsData}
              salesData={salesData}
              debtData={debtData}
              tasksData={tasksData}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-6">
            <TaskManagement users={teamMembers} />
          </div>
        )}
      </div>
    </div>
  );
});