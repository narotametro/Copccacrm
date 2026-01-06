import { Home, DollarSign, ShoppingBag, TrendingUp, Lightbulb, BarChart3, Link2, UserCheck, Shield, Bot } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  adminOnly?: boolean;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { isAdmin } = useAuth();

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'aftersales', label: 'After Sales', icon: ShoppingBag },
    { id: 'kpi', label: 'KPI Tracking', icon: BarChart3 },
    { id: 'competitors', label: 'Competitors Info', icon: TrendingUp },
    { id: 'strategies', label: 'Sales & Marketing', icon: Lightbulb },
    { id: 'debt', label: 'Debt Collection', icon: DollarSign },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: UserCheck, adminOnly: true }] : []),
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-pink-500 to-pink-600 text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-pink-400">
        <h1 className="text-3xl">COPCCA CRM</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-pink-600 shadow-lg'
                      : 'text-pink-50 hover:bg-pink-400'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={20} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.adminOnly && (
                    <Shield size={14} className="opacity-70" aria-label="Admin only" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}