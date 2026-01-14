import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, Users, BarChart3, Clock, Database, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useCurrency, currencies } from '@/context/CurrencyContext';

export const COPCCAAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminEmail = sessionStorage.getItem('copcca_admin_email');
  const { currency, setCurrency } = useCurrency();

  const handleLogout = () => {
    sessionStorage.removeItem('copcca_admin_auth');
    sessionStorage.removeItem('copcca_admin_email');
    sessionStorage.removeItem('copcca_admin_login_time');
    toast.success('Logged out successfully');
    navigate('/copcca-admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Bar - Sticky */}
      <div className="sticky top-0 z-50 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">COPCCA Platform Admin</h1>
                <p className="text-purple-200 text-xs">Internal Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Currency Selector */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <DollarSign className="text-purple-300" size={16} />
                <select
                  value={currency.code}
                  onChange={(e) => {
                    const selected = currencies.find(c => c.code === e.target.value);
                    if (selected) setCurrency(selected);
                  }}
                  className="bg-transparent text-white text-sm border-none outline-none cursor-pointer hover:text-purple-200 transition-colors"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-slate-800 text-white">
                      {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-white">{adminEmail}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                icon={LogOut}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Sticky */}
      <div className="sticky top-16 z-40 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2">
            <button
              onClick={() => navigate('/copcca-admin/dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors ${
                location.pathname === '/copcca-admin/dashboard' ? 'bg-white/10 ring-2 ring-white/30' : ''
              }`}
            >
              <BarChart3 size={16} />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/copcca-admin/companies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors ${
                location.pathname === '/copcca-admin/companies' ? 'bg-white/10 ring-2 ring-white/30' : ''
              }`}
            >
              <Users size={16} />
              <span className="text-sm font-medium">Companies</span>
            </button>
            <button
              onClick={() => navigate('/copcca-admin/subscriptions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors ${
                location.pathname === '/copcca-admin/subscriptions' ? 'bg-white/10 ring-2 ring-white/30' : ''
              }`}
            >
              <Clock size={16} />
              <span className="text-sm font-medium">Subscriptions</span>
            </button>
            <button
              onClick={() => navigate('/copcca-admin/system')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors ${
                location.pathname === '/copcca-admin/system' ? 'bg-white/10 ring-2 ring-white/30' : ''
              }`}
            >
              <Database size={16} />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-purple-200/60">
            <p>COPCCA Internal Platform Admin © 2026</p>
            <p>All activities are logged and monitored</p>
          </div>
        </div>
      </div>
    </div>
  );
};
