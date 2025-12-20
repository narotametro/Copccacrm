import { useState, useEffect } from 'react';
import { AdminManagementDashboard } from './components/AdminManagementDashboard';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded admin password - In production, this should be stored securely
  const ADMIN_PASSWORD = 'COPCCA_ADMIN_2024';

  const handleLogin = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        sessionStorage.setItem('copcca_admin_auth', 'true');
        toast.success('Access granted!');
      } else {
        toast.error('Invalid password');
      }
      setIsLoading(false);
    }, 500);
  };

  // Check if already authenticated
  useEffect(() => {
    const isAuth = sessionStorage.getItem('copcca_admin_auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-600 via-purple-600 to-fuchsia-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Shield size={32} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">COPCCA CRM Admin</h1>
          <p className="text-sm text-gray-600 text-center mb-8">
            Super Admin Dashboard Access
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading || !password}
            className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-600 text-white py-3 rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Access Dashboard'}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              ⚠️ Authorized personnel only. All access is logged.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AdminManagementDashboard />;
}
