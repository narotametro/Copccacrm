/**
 * COPCCA CRM - Main Application Component
 * 
 * Production-ready AI-powered CRM system for customer follow-up, debt collection,
 * and comprehensive business management with complete multi-user support and real-time data sync.
 * 
 * Key Features:
 * - Multi-user authentication with role-based access control
 * - Six integrated business modules
 * - Real-time data synchronization
 */

import { useState, useEffect, lazy, Suspense, memo, useRef } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { CurrencyProvider } from './lib/currency-context';
import { LoadingProvider } from './lib/loading-context';
import { Toaster, toast } from 'sonner@2.0.3';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * Register Service Worker for PWA functionality
 * Provides offline support and improved performance through caching
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => {
        // Service worker registered successfully
      })
      .catch((error) => {
        // Service worker registration failed - app will still work without PWA features
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Eager load critical components from organized structure
import { Sidebar } from './components/layout/Sidebar';
import { UserProfile } from './components/layout/UserProfile';
import { UserSelector } from './components/layout/UserSelector';
import { CompanyBranding } from './components/layout/CompanyBranding';
import { PerformanceIndicator } from './components/layout/PerformanceIndicator';
import { PerformanceMonitor } from './components/layout/PerformanceMonitor';
import { NotificationCenter } from './components/layout/NotificationCenter';
import { SubscriptionGate } from './components/layout/SubscriptionGate';
import { useTeamData } from './lib/useTeamData';
import { useNotifications } from './lib/useNotifications';

// Import routing configuration
import { type TabId, ROUTES, HASH_TO_TAB } from './config/routes';

// Lazy load heavy components for code splitting
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const PasswordReset = lazy(() => import('./components/PasswordReset').then(m => ({ default: m.PasswordReset })));
const Home = lazy(() => import('./components/modules/Home').then(m => ({ default: m.Home })));
const AfterSalesTracker = lazy(() => import('./components/modules/AfterSalesTracker').then(m => ({ default: m.AfterSalesTracker })));
const CompetitorIntel = lazy(() => import('./components/modules/CompetitorIntelEnhanced').then(m => ({ default: m.CompetitorIntelEnhanced })));
const SalesStrategies = lazy(() => import('./components/modules/SalesStrategies').then(m => ({ default: m.SalesStrategies })));
const KPITracking = lazy(() => import('./components/modules/KPITracking').then(m => ({ default: m.KPITracking })));
const Integrations = lazy(() => import('./components/settings/Integrations').then(m => ({ default: m.Integrations })));
const UserManagement = lazy(() => import('./components/settings/UserManagement').then(m => ({ default: m.UserManagement })));
const Reports = lazy(() => import('./components/reports/Reports').then(m => ({ default: m.Reports })));
const AnalyticalReports = lazy(() => import('./components/reports/AnalyticalReports').then(m => ({ default: m.AnalyticalReports })));
const DebtCollection = lazy(() => import('./components/modules/DebtCollection').then(m => ({ default: m.DebtCollection })));
const AdminDashboard = lazy(() => import('./AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Tab titles from routes config
const TAB_TITLES: Record<TabId, string> = Object.fromEntries(
  Object.entries(ROUTES).map(([key, route]) => [key, route.title])
) as Record<TabId, string>;

// Loading fallback component
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

// Memoized content renderer
const ContentRenderer = memo(({ activeTab }: { activeTab: TabId }) => {
  const components: Record<TabId, JSX.Element> = {
    home: <Home />,
    aftersales: <AfterSalesTracker />,
    competitors: <CompetitorIntel />,
    debt: <DebtCollection />,
    strategies: <SalesStrategies />,
    kpi: <KPITracking />,
    integrations: <Integrations />,
    users: <UserManagement />,
    reports: <Reports />,
    analytical: <AnalyticalReports />,
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      {components[activeTab] || <Home />}
    </Suspense>
  );
});

ContentRenderer.displayName = 'ContentRenderer';

// Authenticated Dashboard Component
const AuthenticatedDashboard = memo(({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: string) => void }) => {
  const { isAdmin } = useAuth();
  const mainContentRef = useRef<HTMLElement>(null);
  
  // Focus main content when tab changes for keyboard scroll to work
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, [activeTab]);
  
  // Load team data for notifications
  const {
    afterSalesData,
    kpiData,
    competitorsData,
    salesData,
    debtData,
    tasksData,
  } = useTeamData({ realtime: false, refreshInterval: 0 });
  
  // Generate notifications
  const notifications = useNotifications({
    afterSalesData,
    kpiData,
    competitorsData,
    salesData,
    debtData,
    tasksData,
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-xl">{TAB_TITLES[activeTab]}</h2>
            {isAdmin && activeTab !== 'users' && <UserSelector />}
            <CompanyBranding />
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter notifications={notifications} />
            <UserProfile />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto" ref={mainContentRef} tabIndex={-1}>
          <ContentRenderer activeTab={activeTab} />
        </main>
      </div>
    </div>
  );
});

AuthenticatedDashboard.displayName = 'AuthenticatedDashboard';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Check for invite code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteCode(invite);
      
      // If user is already logged in, clear invite and go to dashboard
      if (user) {
        toast.info('You are already logged in!');
        // Clear invite from URL
        window.history.replaceState({}, '', '/');
      } else {
        // User not logged in - show signup
        setShowSignup(true);
        setShowLogin(true);
      }
    }
  }, [user]);

  // Check URL for password reset token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const type = params.get('type');
    
    if (token && type === 'recovery') {
      setResetToken(token);
      setShowPasswordReset(true);
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const tab = HASH_TO_TAB[hash];
      if (tab) setActiveTab(tab);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabId);
    const hashRoute = Object.entries(HASH_TO_TAB).find(([_, t]) => t === tab)?.[0] || '#/home';
    window.history.replaceState(null, '', hashRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showPasswordReset) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PasswordReset token={resetToken} />
      </Suspense>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingFallback />
      </div>
    );
  }

  if (!user && !showLogin && !showSignup) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LandingPage 
          onGetStarted={() => {
            setShowLogin(true);
            setShowSignup(false);
          }} 
          onSignUp={() => {
            setShowLogin(true);
            setShowSignup(true);
          }}
        />
      </Suspense>
    );
  }

  if (!user && showLogin) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login 
          onBack={() => {
            setShowLogin(false);
            setShowSignup(false);
          }} 
          inviteCode={inviteCode}
          initialMode={showSignup ? 'signup' : 'login'}
        />
      </Suspense>
    );
  }

  return <AuthenticatedDashboard activeTab={activeTab} onTabChange={handleTabChange} />;
}

export default function App() {
  // Check if accessing admin dashboard
  const isAdminRoute = window.location.hash === '#/copcca-admin' || window.location.pathname === '/copcca-admin';
  
  if (isAdminRoute) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AdminDashboard />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LoadingProvider>
          <CurrencyProvider>
            <SubscriptionGate>
              <AppContent />
            </SubscriptionGate>
            <PerformanceMonitor />
            <Toaster position="top-right" richColors />
          </CurrencyProvider>
        </LoadingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}