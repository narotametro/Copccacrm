import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Package,
  DollarSign,
  Target,
  BarChart3,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Mail,
  Phone,
  Building,
  CheckCircle,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AIAssistant } from './AIAssistant';

// Demo profile for preview mode
const demoProfile = {
  id: 'demo',
  email: 'demo@copcca.com',
  full_name: 'Demo User',
  role: 'admin' as const,
  avatar_url: null,
  phone: null,
  department: 'Sales',
  status: 'active' as const,
};

const menuItems = [
  { icon: LayoutDashboard, label: 'Home (AI Center)', path: '/dashboard' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: TrendingUp, label: 'Sales', path: '/pipeline' },
  { icon: BarChart3, label: 'Marketing', path: '/strategies' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Target, label: 'Competitors', path: '/competitors' },
  { icon: DollarSign, label: 'Debt Collection', path: '/debt-collection' },
  { icon: FileText, label: 'Reports & AI', path: '/reports' },
  { icon: Settings, label: 'Admin', path: '/users' },
  { icon: Globe, label: 'My Workplace', path: '/my-workplace' },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { profile, signOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile-first: closed by default
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  // Use demo profile if no real profile (for preview mode)
  const displayProfile = profile || demoProfile;

  // Demo notifications
  const notifications = [
    { id: '1', type: 'success', title: 'Deal Closed', message: 'Acme Corp signed the contract!', time: '5 min ago', read: false },
    { id: '2', type: 'warning', title: 'Task Overdue', message: 'Damage compensation to DANGOOD is 33 days overdue', time: '1 hour ago', read: false },
    { id: '3', type: 'info', title: 'New Customer', message: 'GlobalTech Industries added to CRM', time: '2 hours ago', read: true },
    { id: '4', type: 'success', title: 'Payment Received', message: '₦2.5M received from TechStart', time: '3 hours ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    if (profile) {
      await signOut();
    }
    window.location.href = '/login';
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setProfileDropdownOpen(false);
        setNotificationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              COPCCA CRM
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 shadow-lg'
                    : 'hover:bg-slate-700'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center font-bold">
                {displayProfile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{displayProfile.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{displayProfile.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={20} className="mx-auto" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 transition-all duration-300 lg:ml-20"
      >
        {/* Header */}
        <header className="glass border-b border-slate-200 sticky top-0 z-20">
          <div className="px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-4 flex-1">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Search size={20} />
              </button>

              {searchOpen && (
                <input
                  type="text"
                  placeholder="Search customers, deals, orders..."
                  className="input flex-1 max-w-md animate-scale-in"
                  autoFocus
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications Dropdown */}
              <div className="relative" data-dropdown>
                <button 
                  onClick={() => {
                    setNotificationDropdownOpen(!notificationDropdownOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                    <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">Notifications</h3>
                      <span className="text-xs text-slate-600">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              notification.type === 'success' ? 'bg-green-100' :
                              notification.type === 'warning' ? 'bg-orange-100' :
                              'bg-blue-100'
                            }`}>
                              {notification.type === 'success' ? <CheckCircle className="text-green-600" size={16} /> :
                               notification.type === 'warning' ? <AlertCircle className="text-orange-600" size={16} /> :
                               <Bell className="text-blue-600" size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-900">{notification.title}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{notification.message}</p>
                              <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-slate-200">
                      <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-1">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" data-dropdown>
                <button 
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotificationDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                    {displayProfile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown size={16} className="text-slate-600" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                    {/* Profile Header */}
                    <div className="p-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-white text-2xl border-2 border-white/30">
                          {displayProfile.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate">{displayProfile.full_name}</p>
                          <p className="text-xs text-white/80 truncate">{displayProfile.email}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Shield size={12} className="text-white/90" />
                            <span className="text-xs font-semibold text-white/90 capitalize">{displayProfile.role}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-3 border-b border-slate-200">
                      <div className="space-y-2 text-sm">
                        {displayProfile.department && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Building size={14} className="text-slate-500" />
                            <span>{displayProfile.department}</span>
                          </div>
                        )}
                        {displayProfile.phone && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Phone size={14} className="text-slate-500" />
                            <span>{displayProfile.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail size={14} className="text-slate-500" />
                          <span className="truncate">{displayProfile.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link 
                        to="/profile"
                        className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User size={16} />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>
                      {displayProfile.role === 'admin' && (
                        <Link 
                          to="/users"
                          className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Shield size={16} />
                          <span className="text-sm font-medium">Admin Panel</span>
                        </Link>
                      )}
                      <Link 
                        to="/settings"
                        className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings size={16} />
                        <span className="text-sm font-medium">Settings</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-slate-200">
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                      >
                        <LogOut size={16} />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
};
