import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface COPCCAProtectedRouteProps {
  children: React.ReactNode;
}

export const COPCCAProtectedRoute: React.FC<COPCCAProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem('copcca_admin_auth') === 'true';
      const loginTime = sessionStorage.getItem('copcca_admin_login_time');

      if (isAuth && loginTime) {
        // Check if session is still valid (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLogin < 24) {
          setIsAuthenticated(true);
        } else {
          // Session expired
          sessionStorage.removeItem('copcca_admin_auth');
          sessionStorage.removeItem('copcca_admin_email');
          sessionStorage.removeItem('copcca_admin_login_time');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 mb-4 animate-pulse">
            <Shield className="text-white" size={32} />
          </div>
          <p className="text-white text-lg">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/copcca-admin/login" replace />;
  }

  return <>{children}</>;
};

export const COPCCALogout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('copcca_admin_auth');
    sessionStorage.removeItem('copcca_admin_email');
    sessionStorage.removeItem('copcca_admin_login_time');
    navigate('/copcca-admin/login');
  };

  return handleLogout;
};
