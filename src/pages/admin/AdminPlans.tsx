import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle,
  XCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Settings,
  Users,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_users: number;
  max_products: number;
  max_invoices_monthly: number;
  max_pos_locations: number;
  max_inventory_locations: number;
  is_active: boolean;
}

interface FeatureOption {
  key: string;
  label: string;
  description: string;
  category: 'core' | 'basic' | 'advanced' | 'premium';
}

const AVAILABLE_FEATURES: FeatureOption[] = [
  // Core Features (all plans)
  { key: 'dashboard', label: 'Dashboard (AI Center)', description: 'Main analytics dashboard', category: 'core' },
  { key: 'customers_basic', label: 'Customer 360 Management', description: 'Customer relationship management', category: 'core' },
  { key: 'pos_system', label: 'Sales Hub & POS', description: 'Point of sale system', category: 'core' },
  { key: 'my_workplace', label: 'My Workplace (COPCCA Apps)', description: 'App ecosystem access', category: 'core' },
  
  // Basic Features (GROW+)
  { key: 'customer_health', label: 'After Sales & Task Management', description: 'Customer health tracking', category: 'basic' },
  { key: 'kpi_dashboard', label: 'KPI Tracking', description: 'Business metrics and KPIs', category: 'basic' },
  { key: 'debt_collection', label: 'Debt Collection', description: 'Receivables management', category: 'basic' },
  { key: 'admin_panel', label: 'Admin Panel', description: 'User and team management', category: 'basic' },
  
  // Advanced Features (PRO only)
  { key: 'sales_pipeline', label: 'Sales Pipeline', description: 'Advanced deal management', category: 'advanced' },
  { key: 'marketing_campaigns', label: 'Marketing Campaigns', description: 'Campaign management', category: 'advanced' },
  { key: 'competitor_analysis', label: 'Competitor Analysis', description: 'Market intelligence', category: 'advanced' },
  { key: 'product_intelligence', label: 'Product Intelligence', description: 'Product analytics', category: 'advanced' },
  
  // Premium Features (PRO only)
  { key: 'reports_advanced', label: 'Advanced Reports', description: 'Custom reporting', category: 'premium' },
  { key: 'reports_basic', label: 'Basic Reports', description: 'Standard reports', category: 'premium' },
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Deep analytics', category: 'premium' },
  { key: 'multi_user_collaboration', label: 'Multi-user Collaboration', description: 'Team collaboration tools', category: 'premium' },
  { key: 'api_access', label: 'API Access', description: 'REST API integration', category: 'premium' },
  { key: 'custom_integrations', label: 'Custom Integrations', description: 'Third-party integrations', category: 'premium' },
  { key: 'white_label', label: 'White Label', description: 'Branded experience', category: 'premium' },
  { key: 'dedicated_support', label: 'Dedicated Support', description: '24/7 priority support', category: 'premium' },
  { key: 'sla_guarantees', label: 'SLA Guarantees', description: 'Uptime guarantees', category: 'premium' },
];

export const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .in('name', ['start', 'grow', 'pro', 'START', 'GROW', 'PRO'])
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (planId: string, featureKey: string) => {
    setPlans(plans.map(plan => {
      if (plan.id === planId) {
        const currentFeatures = plan.features || [];
        const hasFeature = currentFeatures.includes(featureKey);
        
        return {
          ...plan,
          features: hasFeature
            ? currentFeatures.filter(f => f !== featureKey)
            : [...currentFeatures, featureKey]
        };
      }
      return plan;
    }));
  };

  const savePlanFeatures = async (plan: SubscriptionPlan) => {
    setSaving(plan.id);
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ features: plan.features })
        .eq('id', plan.id);

      if (error) throw error;
      
      toast.success(
        <div>
          <div className="font-semibold">{plan.display_name} Plan Updated</div>
          <div className="text-sm">{plan.features.length} features enabled</div>
        </div>
      );
      
      await fetchPlans(); // Refresh to confirm
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error(`Failed to update ${plan.display_name} plan`);
    } finally {
      setSaving(null);
    }
  };

  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name === 'start') return 'green';
    if (name === 'grow') return 'blue';
    if (name === 'pro') return 'purple';
    return 'slate';
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name === 'start') return Users;
    if (name === 'grow') return Package;
    if (name === 'pro') return Zap;
    return Settings;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-green-100 text-green-700 border-green-200';
      case 'basic': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'advanced': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'premium': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Subscription Plan Features
          </h1>
          <p className="text-slate-600 mt-1">
            Manage which features and tabs users can access for each plan
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPlans}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">How This Works</h3>
            <p className="text-sm text-blue-700 mt-1">
              Enable/disable features for each plan. Changes apply immediately to all users on that plan.
              Use technical feature keys that match the code (e.g., "kpi_dashboard" not "KPI Tracking").
            </p>
          </div>
        </div>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.name);
          const colorClass = getPlanColor(plan.name);
          const isExpanded = expandedPlan === plan.id;
          
          const coreFeatures = AVAILABLE_FEATURES.filter(f => f.category === 'core' && plan.features.includes(f.key));
          const basicFeatures = AVAILABLE_FEATURES.filter(f => f.category === 'basic' && plan.features.includes(f.key));
          const advancedFeatures = AVAILABLE_FEATURES.filter(f => f.category === 'advanced' && plan.features.includes(f.key));
          const premiumFeatures = AVAILABLE_FEATURES.filter(f => f.category === 'premium' && plan.features.includes(f.key));

          return (
            <Card key={plan.id} className="border-2">
              {/* Plan Header */}
              <div className={`p-6 bg-gradient-to-br from-${colorClass}-50 to-${colorClass}-100 border-b border-${colorClass}-200`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 bg-${colorClass}-100 rounded-lg`}>
                    <PlanIcon className={`w-6 h-6 text-${colorClass}-600`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{plan.display_name}</h2>
                    <p className="text-sm text-slate-600">
                      TZS {plan.price_monthly.toLocaleString()}/month
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-700">{plan.description}</p>
              </div>

              {/* Feature Summary */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Features Enabled</p>
                    <p className="text-2xl font-bold text-slate-900">{plan.features.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Max Users</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {plan.max_users === -1 ? '∞' : plan.max_users}
                    </p>
                  </div>
                </div>

                {/* Feature Breakdown */}
                <div className="space-y-2">
                  {coreFeatures.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Core
                      </span>
                      <span className="text-slate-600">{coreFeatures.length} features</span>
                    </div>
                  )}
                  {basicFeatures.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        Basic
                      </span>
                      <span className="text-slate-600">{basicFeatures.length} features</span>
                    </div>
                  )}
                  {advancedFeatures.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        Advanced
                      </span>
                      <span className="text-slate-600">{advancedFeatures.length} features</span>
                    </div>
                  )}
                  {premiumFeatures.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                        Premium
                      </span>
                      <span className="text-slate-600">{premiumFeatures.length} features</span>
                    </div>
                  )}
                </div>

                {/* Expand/Collapse Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                >
                  {isExpanded ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Features
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Edit Features
                    </>
                  )}
                </Button>

                {/* Feature Selection */}
                {isExpanded && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    {/* Core Features */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                        Core Features (Recommended for all plans)
                      </h4>
                      <div className="space-y-2">
                        {AVAILABLE_FEATURES.filter(f => f.category === 'core').map(feature => (
                          <label
                            key={feature.key}
                            className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={plan.features.includes(feature.key)}
                              onChange={() => toggleFeature(plan.id, feature.key)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-slate-900">{feature.label}</div>
                              <div className="text-xs text-slate-500">{feature.description}</div>
                              <code className="text-xs text-slate-400 mt-1 block">{feature.key}</code>
                            </div>
                            {plan.features.includes(feature.key) ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Basic Features */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                        Basic Features (GROW+)
                      </h4>
                      <div className="space-y-2">
                        {AVAILABLE_FEATURES.filter(f => f.category === 'basic').map(feature => (
                          <label
                            key={feature.key}
                            className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={plan.features.includes(feature.key)}
                              onChange={() => toggleFeature(plan.id, feature.key)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-slate-900">{feature.label}</div>
                              <div className="text-xs text-slate-500">{feature.description}</div>
                              <code className="text-xs text-slate-400 mt-1 block">{feature.key}</code>
                            </div>
                            {plan.features.includes(feature.key) ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Features */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                        Advanced Features (PRO only)
                      </h4>
                      <div className="space-y-2">
                        {AVAILABLE_FEATURES.filter(f => f.category === 'advanced').map(feature => (
                          <label
                            key={feature.key}
                            className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={plan.features.includes(feature.key)}
                              onChange={() => toggleFeature(plan.id, feature.key)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-slate-900">{feature.label}</div>
                              <div className="text-xs text-slate-500">{feature.description}</div>
                              <code className="text-xs text-slate-400 mt-1 block">{feature.key}</code>
                            </div>
                            {plan.features.includes(feature.key) ? (
                              <CheckCircle className="w-5 h-5 text-purple-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Premium Features */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                        Premium Features (PRO only)
                      </h4>
                      <div className="space-y-2">
                        {AVAILABLE_FEATURES.filter(f => f.category === 'premium').map(feature => (
                          <label
                            key={feature.key}
                            className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={plan.features.includes(feature.key)}
                              onChange={() => toggleFeature(plan.id, feature.key)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-slate-900">{feature.label}</div>
                              <div className="text-xs text-slate-500">{feature.description}</div>
                              <code className="text-xs text-slate-400 mt-1 block">{feature.key}</code>
                            </div>
                            {plan.features.includes(feature.key) ? (
                              <CheckCircle className="w-5 h-5 text-orange-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <Button
                      onClick={() => savePlanFeatures(plan)}
                      disabled={saving === plan.id}
                      className="w-full"
                    >
                      {saving === plan.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save {plan.display_name} Features
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
