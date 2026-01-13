import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Package,
  Coins,
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
  Filter,
  ClipboardCheck,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatName, formatRole, formatEmail } from '@/lib/textFormat';
import { PaymentPopup } from '@/components/PaymentPopup';

const menuItems = [
  { icon: LayoutDashboard, label: 'Home (AI Center)', path: '/app/dashboard' },
  { icon: Users, label: 'Customers', path: '/app/customers' },
  { icon: TrendingUp, label: 'Sales', path: '/app/sales' },
  { icon: ClipboardCheck, label: 'After Sales & Tasks', path: '/app/after-sales' },
  { icon: BarChart3, label: 'Marketing', path: '/app/marketing' },
  { icon: Package, label: 'Products', path: '/app/products' },
  { icon: Target, label: 'Competitors', path: '/app/competitors' },
  { icon: Coins, label: 'Debt Collection', path: '/app/debt-collection' },
  { icon: Activity, label: 'KPI Tracking', path: '/app/kpi-tracking' },
  { icon: FileText, label: 'Reports & AI', path: '/app/reports' },
  { icon: Shield, label: 'Admin', path: '/app/users', requiresAdmin: true },
  { icon: Globe, label: 'My Workplace', path: '/app/my-workplace' },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [userFilterDropdownOpen, setUserFilterDropdownOpen] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

  // Team members for filtering
  const teamMembers = [
    { id: 'all', name: 'All Users', role: '' },
    // Demo user removed
    { id: '2', name: 'John Smith', role: 'user' },
    { id: '3', name: 'Sarah Johnson', role: 'user' },
    { id: '4', name: 'Michael Chen', role: 'user' },
  ];

  // Notification state with sender info
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    sender: string;
    senderRole: string;
  }>>([]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const effectiveRole = profile?.role || (user?.user_metadata as { role?: string } | undefined)?.role || user?.role || 'user';
  const isAdmin = effectiveRole === 'admin';

  // For demo, fallback profile info from user
  const displayProfile = user ? {
    full_name: user.user_metadata?.full_name || user.email || 'User',
    email: user.email,
    role: user.role || 'user',
    department: user.user_metadata?.department || '',
    phone: user.user_metadata?.phone || '',
  } : null;

  // Demo: Check if current user's company has payment popup enabled
  // In production, this would come from Supabase subscription data
  const [showPaymentPopup] = useState(false); // Change to true for demo
  const demoCompanyData = {
    companyName: displayProfile?.full_name ? `${displayProfile.full_name}'s Company` : 'Your Company',
    daysOverdue: 15,
    amount: 120000,
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setProfileDropdownOpen(false);
        setNotificationDropdownOpen(false);
        setUserFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    // Use Supabase directly for sign out
    await import('@/lib/supabase').then(({ supabase }) => supabase.auth.signOut());
    window.location.href = '/login';
  };

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

        <nav className="mt-4">
          {menuItems.filter(item => !item.requiresAdmin || isAdmin).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-all ${
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 transition-all duration-300 lg:ml-20">
        {/* Header */}
        <header className="glass border-b border-slate-200 sticky top-0 z-20">
          <div className="px-4 lg:px-6 py-2 flex items-center justify-between">
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
              {/* User Filter Dropdown */}
              <div className="relative" data-dropdown>
                <button 
                  onClick={() => {
                    setUserFilterDropdownOpen(!userFilterDropdownOpen);
                    setNotificationDropdownOpen(false);
                    setProfileDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  <Filter size={18} />
                  <span className="hidden md:inline text-sm font-medium">
                    {teamMembers.find(m => m.id === selectedUserFilter)?.name || 'All Users'}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {userFilterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                    <div className="p-2 border-b border-slate-200">
                      <h3 className="font-semibold text-sm text-slate-900 px-2">Filter by Team Member</h3>
                    </div>
                    <div className="py-1">
                      {teamMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => {
                            setSelectedUserFilter(member.id);
                            setUserFilterDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            selectedUserFilter === member.id ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            {member.role && (
                              <p className="text-xs text-slate-500">{formatRole(member.role)}</p>
                            )}
                          </div>
                          {selectedUserFilter === member.id && (
                            <CheckCircle size={16} className="text-primary-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                          onClick={() => markAsRead(notification.id)}
                          className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
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
                              {isAdmin && (
                                <p className="text-xs text-primary-600 mt-1 font-medium">
                                  From: {formatName(notification.sender)} ({formatRole(notification.senderRole)})
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-slate-200">
                      <Link
                        to="/app/notifications"
                        onClick={() => setNotificationDropdownOpen(false)}
                        className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-1"
                      >
                        View All Notifications
                      </Link>
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
                    {displayProfile?.full_name?.charAt(0).toUpperCase()}
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
                          {displayProfile?.full_name ? displayProfile.full_name.charAt(0).toUpperCase() : ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate">{formatName(displayProfile?.full_name || '')}</p>
                          <p className="text-xs text-white/80 truncate">{formatEmail(displayProfile?.email || '')}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Shield size={12} className="text-white/90" />
                            <span className="text-xs font-semibold text-white/90">{formatRole(displayProfile?.role || '')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Profile Details */}
                    <div className="p-3 border-b border-slate-200">
                      <div className="space-y-2 text-sm">
                        {displayProfile?.department && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Building size={14} className="text-slate-500" />
                            <span>{displayProfile.department}</span>
                          </div>
                        )}
                        {displayProfile?.phone && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Phone size={14} className="text-slate-500" />
                            <span>{displayProfile.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail size={14} className="text-slate-500" />
                          <span className="truncate">{formatEmail(displayProfile?.email || '')}</span>
                        </div>
                      </div>
                    </div>
                    {/* Menu Items */}
                    <div className="p-2">
                      <Link 
                        to="/app/profile"
                        className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User size={16} />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>
                      {displayProfile?.role === 'admin' && (
                        <Link 
                          to="/app/users"
                          className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Shield size={16} />
                          <span className="text-sm font-medium">Admin Panel</span>
                        </Link>
                      )}
                      <Link 
                        to="/app/settings"
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
      {/* Payment Popup - Cannot be closed */}
      {showPaymentPopup && !isAdmin && (
        <PaymentPopup
          companyName={demoCompanyData.companyName}
          daysOverdue={demoCompanyData.daysOverdue}
          amount={demoCompanyData.amount}
        />
      )}
    </div>
  );
};
