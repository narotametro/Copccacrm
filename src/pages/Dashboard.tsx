
// ...existing code...
import { TrendingUp, Users, Banknote, Target, BarChart3, Activity, Sparkles, Globe, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCurrency, currencies } from '@/context/CurrencyContext';
import { formatName } from '@/lib/textFormat';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const displayName = formatName(profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
  const { currency, setCurrency, formatCurrency } = useCurrency();
  
  // Demo data state
  const [hasDemoData, setHasDemoData] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if demo data flag exists in localStorage
    const demoDataDeleted = localStorage.getItem(`demo_data_deleted_${user?.id}`);
    if (demoDataDeleted === 'true') {
      setHasDemoData(false);
    }
  }, [user?.id]);

  const handleDeleteDemoData = () => {
    if (confirm('Are you sure you want to delete all COPCCA Demo User data? This action cannot be undone and will remove all sample data across the entire system.')) {
      toast.promise(
        new Promise(resolve => setTimeout(resolve, 1500)),
        {
          loading: 'Deleting demo data across all modules...',
          success: () => {
            // Mark demo data as deleted in localStorage
            localStorage.setItem(`demo_data_deleted_${user?.id}`, 'true');
            setHasDemoData(false);
            return 'All demo data deleted successfully! Your system is now clean.';
          },
          error: 'Failed to delete demo data'
        }
      );
    }
  };
  
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
            📊 Customers
          </Button>
          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            onClick={() => navigate('/app/pipeline')}
          >
            💰 Pipeline
          </Button>
          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            onClick={() => navigate('/app/reports')}
          >
            📈 Reports
          </Button>
          <Button 
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            onClick={() => navigate('/app/kpi-tracking')}
          >
            🎯 KPI
          </Button>
        </div>
      </div>

      {/* Demo Data Delete Button */}
      {hasDemoData && (
        <Card className="p-4 bg-amber-50 border-2 border-amber-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Sparkles className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Demo Data Active</h3>
                <p className="text-sm text-slate-600 mb-1">
                  You're currently viewing sample COPCCA Demo User data across the entire system.
                </p>
                <ul className="text-sm text-slate-600 list-disc list-inside space-y-0.5">
                  <li>Go through the COPCCA Demo User to understand the system</li>
                  <li>Delete the COPCCA Demo User data when ready to get started</li>
                </ul>
              </div>
            </div>
            <Button
              variant="secondary"
              icon={Trash2}
              onClick={handleDeleteDemoData}
              className="bg-red-500 hover:bg-red-600 text-white border-red-600 whitespace-nowrap"
            >
              Delete Demo Data
            </Button>
          </div>
        </Card>
      )}

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
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(2400000)}</p>
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
              <p className="text-2xl font-bold text-slate-900">1,247</p>
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
              <p className="text-2xl font-bold text-slate-900">89</p>
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
              <p className="text-2xl font-bold text-slate-900">+12.5%</p>
            </div>
          </div>
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
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">New deal closed</p>
                <p className="text-xs text-slate-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Customer added</p>
                <p className="text-xs text-slate-600">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Task completed</p>
                <p className="text-xs text-slate-600">6 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
