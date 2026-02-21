import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { COPCCAProtectedRoute } from '@/components/auth/COPCCAProtectedRoute';
import { COPCCAAdminLayout } from '@/components/layout/COPCCAAdminLayout';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SharedDataProvider } from '@/context/SharedDataContext';
import { FeatureGate } from '@/components/ui/FeatureGate';

// Lazy load all page components for instant loading
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then(module => ({ default: module.ResetPassword })));
const COPCCAAdminLogin = lazy(() => import('@/pages/auth/COPCCAAdminLogin').then(module => ({ default: module.COPCCAAdminLogin })));
const AcceptInvite = lazy(() => import('@/pages/auth/AcceptInvite').then(module => ({ default: module.AcceptInvite })));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customers = lazy(() => import('@/pages/Customers').then(module => ({ default: module.Customers })));
const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage').then(module => ({ default: module.CustomerDetailPage })));
const Sales = lazy(() => import('@/pages/Sales').then(module => ({ default: module.Sales })));
const SalesHub = lazy(() => import('@/pages/SalesHub'));
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
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions').then(module => ({ default: module.AdminSubscriptions })));
const AdminSystem = lazy(() => import('@/pages/admin/AdminSystem').then(module => ({ default: module.AdminSystem })));
const SMSAdminPanel = lazy(() => import('@/pages/admin/SMSAdminPanel').then(module => ({ default: module.SMSAdminPanel })));

// Ultra-minimal instant loading component
const InstantLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

// Preload critical routes for instant navigation
const preloadCriticalRoutes = () => {
  // Aggressively preload the most used pages
  import('@/pages/Dashboard');
  import('@/pages/Customers');
  import('@/pages/SalesHub');
};

const AppRoutes = () => {
  const { user, loading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRestoredPath = useRef(false);

  // Save current path on every route change (for persistence after refresh)
  useEffect(() => {
    // Only save app paths, not login/register/etc
    if (location.pathname.startsWith('/app/') || location.pathname.startsWith('/copcca-admin/')) {
      sessionStorage.setItem('requested_path', location.pathname);
    }
  }, [location.pathname]);

  // Restore saved path after page refresh (only once on mount when user is authenticated)
  useEffect(() => {
    if (!loading && user && !hasRestoredPath.current) {
      const savedPath = sessionStorage.getItem('requested_path');
      if (savedPath && savedPath !== location.pathname && savedPath.startsWith('/app/')) {
        hasRestoredPath.current = true;
        sessionStorage.removeItem('requested_path');
        navigate(savedPath, { replace: true });
      } else {
        hasRestoredPath.current = true;
      }
    }
  }, [loading, user, location.pathname, navigate]); // Only run when auth state is ready

  // Preload critical routes after authentication (instant)
  useEffect(() => {
    if (user) {
      preloadCriticalRoutes(); // Immediate preload when user is available
    }
  }, [user]);
  
  // No loading check - render immediately!
  return (
    <Suspense fallback={<InstantLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/invite" element={<AcceptInvite />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Register />}
        />
        <Route
          path="/forgot-password"
          element={user ? <Navigate to="/app/dashboard" replace /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={user ? <Navigate to="/app/dashboard" replace /> : <ResetPassword />}
        />

        {/* COPCCA Admin Routes - Completely Separate */}
        <Route path="/copcca-admin/login" element={<COPCCAAdminLogin />} />
        <Route
          path="/copcca-admin/*"
          element={
            <COPCCAProtectedRoute>
              <COPCCAAdminLayout />
            </COPCCAProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="sms" element={<SMSAdminPanel />} />
          <Route path="system" element={<AdminSystem />} />
          <Route path="" element={<Navigate to="/copcca-admin/dashboard" replace />} />
        </Route>

        {/* Protected Routes with AppLayout */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="support" element={<Support />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales-hub" element={<SalesHub />} />
          <Route path="pipeline" element={<FeatureGate feature="sales_pipeline"><Pipeline /></FeatureGate>} />
          <Route path="after-sales" element={<FeatureGate feature="after_sales"><AfterSales /></FeatureGate>} />
          <Route path="debt-collection" element={<FeatureGate feature="debt_collection"><DebtCollection /></FeatureGate>} />
          <Route path="competitors" element={<Competitors />} />
          <Route path="competitors/:id" element={<CompetitorDetailPage />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="kpi-tracking" element={<FeatureGate feature="kpi_dashboard"><KPITracking /></FeatureGate>} />
          <Route path="reports" element={<Reports />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/dashboard" element={<InvoiceDashboard />} />
          <Route path="invoices/create" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="invoices/:id/edit" element={<CreateInvoice />} />
          <Route 
            path="users" 
            element={
              <ProtectedRoute requiredRole="admin">
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="my-workplace" element={<MyWorkplace />} />
          <Route path="" element={<Navigate to="/app/dashboard" replace />} />
        </Route>

        {/* Catch-all: Redirect to login or dashboard - but not for admin routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);
  
  // Initialize auth in background - don't block rendering!
  useEffect(() => {
    initialize(); // Fire and forget - let auth load in background
  }, [initialize]);

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
          <AppRoutes />
        </BrowserRouter>
      </SharedDataProvider>
    </CurrencyProvider>
  );
};

export default App;
