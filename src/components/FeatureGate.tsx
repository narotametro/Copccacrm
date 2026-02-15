import { ReactNode } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';

interface FeatureGateProps {
  featureName: string;
  children: ReactNode;
}

export default function FeatureGate({ featureName, children }: FeatureGateProps) {
  const { subscription, loading, hasFeature, getPlanName, isOnTrial, getTrialDaysRemaining } = useSubscription();
  const navigate = useNavigate();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // If user has access to this feature, render children
  if (hasFeature(featureName)) {
    return <>{children}</>;
  }

  // User doesn't have access - show upgrade prompt
  const featureDisplayNames: Record<string, string> = {
    after_sales: 'After Sales & Task Management',
    sales_pipeline: 'Sales Pipeline',
    kpi_dashboard: 'KPI Dashboard',
    debt_collection: 'Debt Collection',
    admin_panel: 'Admin Panel',
    marketing_campaigns: 'Marketing Campaigns',
    advanced_analytics: 'Advanced Analytics',
    api_access: 'API Access',
  };

  const featureDisplayName = featureDisplayNames[featureName] || featureName;
  const currentPlan = getPlanName();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl w-full">
        {/* Lock Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
            <svg 
              className="w-10 h-10 text-indigo-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Premium Feature
          </h1>
          <p className="text-lg text-gray-600">
            <span className="font-semibold text-indigo-600">{featureDisplayName}</span> is available on higher plans
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Current Plan</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{currentPlan}</span>
                {isOnTrial() && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                    Trial - {getTrialDaysRemaining()} days left
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Need to upgrade?</p>
              <p className="text-xs text-gray-500 mt-1">Choose GROW or PRO</p>
            </div>
          </div>

          {/* Feature Benefits */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Why upgrade to access {featureDisplayName}?
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Unlock powerful tools to grow your business</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Gain deeper insights into your operations</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Access advanced features to stay competitive</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/app/settings?tab=billing')}
              className="flex-1"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade Now
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/app/dashboard')}
              className="flex-1"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Contact Support */}
        <p className="text-center text-sm text-gray-500">
          Questions about plans?{' '}
          <button 
            onClick={() => navigate('/app/settings?tab=support')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Contact Support
          </button>
        </p>
      </div>
    </div>
  );
}
