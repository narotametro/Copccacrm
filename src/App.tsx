import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { COPCCAProtectedRoute } from '@/components/auth/COPCCAProtectedRoute';
import { SubscriptionGuard } from '@/components/auth/SubscriptionGuard';
import { COPCCAAdminLayout } from '@/components/layout/COPCCAAdminLayout';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SharedDataProvider } from '@/context/SharedDataContext';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { UpdateNotifier } from '@/components/UpdateNotifier';
import { toast } from 'sonner';

// Eagerly load critical pages for zero loading spinner
import Dashboard from '@/pages/Dashboard';
import { Customers } from '@/pages/Customers';
import SalesHub from '@/pages/SalesHub';

// Lazy load non-critical pages
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then(module => ({ default: module.ResetPassword })));
const COPCCAAdminLogin = lazy(() => import('@/pages/auth/COPCCAAdminLogin').then(module => ({ default: module.COPCCAAdminLogin })));
const AcceptInvite = lazy(() => import('@/pages/auth/AcceptInvite').then(module => ({ default: module.AcceptInvite })));
const PlanSelection = lazy(() => import('@/pages/auth/PlanSelection').then(module => ({ default: module.PlanSelection })));

const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage').then(module => ({ default: module.CustomerDetailPage })));
const Sales = lazy(() => import('@/pages/Sales').then(module => ({ default: module.Sales })));
const AfterSales = lazy(() => import('@/pages/AfterSales').then(module => ({ default: module.AfterSales })));
const DebtCollection = lazy(() => import('@/pages/DebtCollection').then(module => ({ default: module.DebtCollection })));
const Competitors = lazy(() => import('@/pages/Competitors').then(module => ({ default: module.Competitors })));
const Marketing = lazy(() => import('@/pages/Marketing').then(module => ({ default: module.Marketing })));
const KPITracking = lazy(() => import('@/pages/KPITracking').then(module => ({ default: module.KPITracking })));
const Reports = lazy(() => import('@/pages/Reports').then(module => ({ default: module.Reports })));
const UserManagement = lazy(() => import('@/pages/UserManagement').then(module => ({ default: module.UserManagement })));
const Products = lazy(() => import('@/pages/Products').then(module => ({ default: module.Products })));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage').then(module => ({ default: module.ProductDetailPage })));
const CompetitorDetailPage = lazy(() => import('@/pages/CompetitorDetailPage').then(module => ({ default: module.CompetitorDetailPage })));
const Profile = lazy(() => import('@/pages/Profile').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('@/pages/Settings').then(module => ({ default: module.Settings })));
const MyWorkplace = lazy(() => import('@/pages/MyWorkplace').then(module => ({ default: module.MyWorkplace })));
const LandingPage = lazy(() => import('@/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(module => ({ default: module.PricingPage })));
const Notifications = lazy(() => import('@/pages/Notifications').then(module => ({ default: module.Notifications })));
const InvoiceDashboard = lazy(() => import('@/pages/InvoiceDashboard'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const CreateInvoice = lazy(() => import('@/pages/CreateInvoice'));
const InvoiceDetail = lazy(() => import('@/pages/InvoiceDetail'));
const Pipeline = lazy(() => import('@/pages/Pipeline').then(module => ({ default: module.Pipeline })));
const Support = lazy(() => import('@/pages/Support').then(module => ({ default: module.Support })));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminCompanies = lazy(() => import('@/pages/admin/AdminCompanies').then(module => ({ default: module.AdminCompanies })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions').then(module => ({ default: module.AdminSubscriptions })));
const AdminSystem = lazy(() => import('@/pages/admin/AdminSystem').then(module => ({ default: module.AdminSystem })));
const SMSAdminPanel = lazy(() => import('@/pages/admin/SMSAdminPanel').then(module => ({ default: module.SMSAdminPanel })));

// Ultra-minimal instant loading component (for full-page auth routes)
const InstantLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

// Inline page loader (doesn't hide sidebar/layout)
const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

// Critical pages are now eagerly loaded - no preloading needed
// They're bundled with the main app for instant access

const AppRoutes = () => {
  const { user, loading } = useAuthStore();
  
  // NO path restoration - causes navigation loops and blinking
  // React Router handles navigation state properly without manual intervention
  // No loading check - render immediately!
  return (
    <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Suspense fallback={<InstantLoader />}><LandingPage /></Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={<InstantLoader />}><PricingPage /></Suspense>} />
        <Route path="/invite" element={<Suspense fallback={<InstantLoader />}><AcceptInvite /></Suspense>} />
        <Route
          path="/login"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<InstantLoader />}><Login /></Suspense>}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<InstantLoader />}><Register /></Suspense>}
        />
        <Route
          path="/forgot-password"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<InstantLoader />}><ForgotPassword /></Suspense>}
        />
        <Route
          path="/reset-password"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<InstantLoader />}><ResetPassword /></Suspense>}
        />
        
        {/* Plan Selection - Required before app access */}
        <Route
          path="/select-plan"
          element={
            <ProtectedRoute>
              <Suspense fallback={<InstantLoader />}><PlanSelection /></Suspense>
            </ProtectedRoute>
          }
        />

        {/* COPCCA Admin Routes - Completely Separate */}
        <Route path="/copcca-admin/login" element={<Suspense fallback={<InstantLoader />}><COPCCAAdminLogin /></Suspense>} />
        <Route
          path="/copcca-admin/*"
          element={
            <COPCCAProtectedRoute>
              <COPCCAAdminLayout />
            </COPCCAProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
          <Route path="companies" element={<Suspense fallback={<PageLoader />}><AdminCompanies /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
          <Route path="subscriptions" element={<Suspense fallback={<PageLoader />}><AdminSubscriptions /></Suspense>} />
          <Route path="sms" element={<Suspense fallback={<PageLoader />}><SMSAdminPanel /></Suspense>} />
          <Route path="system" element={<Suspense fallback={<PageLoader />}><AdminSystem /></Suspense>} />
          <Route path="" element={<Navigate to="/copcca-admin/dashboard" replace />} />
        </Route>

        {/* Protected Routes with AppLayout */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <AppLayout />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<Suspense fallback={<PageLoader />}><CustomerDetailPage /></Suspense>} />
          <Route path="support" element={<Suspense fallback={<PageLoader />}><Support /></Suspense>} />
          <Route path="sales" element={<Suspense fallback={<PageLoader />}><Sales /></Suspense>} />
          <Route path="sales-hub" element={<SalesHub />} />
          <Route path="pipeline" element={<Suspense fallback={<PageLoader />}><FeatureGate feature="sales_pipeline"><Pipeline /></FeatureGate></Suspense>} />
          <Route path="after-sales" element={<Suspense fallback={<PageLoader />}><FeatureGate feature="after_sales"><AfterSales /></FeatureGate></Suspense>} />
          <Route path="debt-collection" element={<Suspense fallback={<PageLoader />}><FeatureGate feature="debt_collection"><DebtCollection /></FeatureGate></Suspense>} />
          <Route path="competitors" element={<Suspense fallback={<PageLoader />}><Competitors /></Suspense>} />
          <Route path="competitors/:id" element={<Suspense fallback={<PageLoader />}><CompetitorDetailPage /></Suspense>} />
          <Route path="marketing" element={<Suspense fallback={<PageLoader />}><Marketing /></Suspense>} />
          <Route path="kpi-tracking" element={<Suspense fallback={<PageLoader />}><FeatureGate feature="kpi_dashboard"><KPITracking /></FeatureGate></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageLoader />}><Products /></Suspense>} />
          <Route path="products/:id" element={<Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<PageLoader />}><Notifications /></Suspense>} />
          <Route path="invoices" element={<Suspense fallback={<PageLoader />}><Invoices /></Suspense>} />
          <Route path="invoices/dashboard" element={<Suspense fallback={<PageLoader />}><InvoiceDashboard /></Suspense>} />
          <Route path="invoices/create" element={<Suspense fallback={<PageLoader />}><CreateInvoice /></Suspense>} />
          <Route path="invoices/:id" element={<Suspense fallback={<PageLoader />}><InvoiceDetail /></Suspense>} />
          <Route path="invoices/:id/edit" element={<Suspense fallback={<PageLoader />}><CreateInvoice /></Suspense>} />
          <Route 
            path="users" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<PageLoader />}><UserManagement /></Suspense>
              </ProtectedRoute>
            } 
          />
          <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          <Route path="my-workplace" element={<Suspense fallback={<PageLoader />}><MyWorkplace /></Suspense>} />
          <Route path="" element={<Navigate to="/app/dashboard" replace />} />
        </Route>

        {/* Catch-all: Redirect to login or dashboard - but not for admin routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
  );
};

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);
  
  // Initialize auth in background - don't block rendering!
  useEffect(() => {
    initialize(); // Fire and forget - let auth load in background
  }, [initialize]);

  // Check for silent updates and show non-intrusive notification
  useEffect(() => {
    const updateAvailable = localStorage.getItem('update_available');
    if (updateAvailable === 'true') {
      // Show small toast (non-blocking, doesn't disrupt work)
      toast.info('New version available', {
        description: 'Updates installed. Refresh when convenient.',
        duration: 8000,
        action: {
          label: 'Refresh Now',
          onClick: () => window.location.reload()
        }
      });
      // Clear flag so we don't show again
      localStorage.removeItem('update_available');
    }
  }, []);

  // Render immediately - no waiting!
  return (
    <CurrencyProvider>
      <SharedDataProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <UpdateNotifier />
          <AppRoutes />
        </BrowserRouter>
      </SharedDataProvider>
    </CurrencyProvider>
  );
};

export default App;
