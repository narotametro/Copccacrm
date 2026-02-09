import React from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import {
  Check,
  X,
  Users,
  Zap,
  TrendingUp,
  Star,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const pricingPlans = [
  {
    name: 'START',
    subtitle: 'Perfect for micro-businesses',
    description: 'For small shops, freelancers, and micro-businesses getting started digitally',
    price: 'TZS 25,000',
    period: 'per month',
    annualPrice: 'TZS 250,000',
    annualPeriod: 'per year (2 months free)',
    usd: '~$9.50 USD',
    popular: false,
    icon: Users,
    color: 'green',
    limits: {
      users: '1',
      products: '100',
      invoices: '100/month',
      posLocations: '1',
    },
    features: {
      included: [
        'Dashboard (AI Center)',
        'Customer Management (Customer 360)',
        'Advanced POS (Sales Hub)',
        'My Workplace (COPCCA Apps)',
      ],
      excluded: [
        'After Sales & Task Management',
        'KPI Tracking',
        'Debt Collection',
        'Sales Pipeline',
        'Marketing Campaigns',
        'Product Intelligence',
        'Competitor Analysis',
        'Advanced Reports & Analytics',
        'Multi-user Collaboration',
        'Admin Panel',
      ],
    },
    cta: 'Get Started',
    ctaVariant: 'outline',
  },
  {
    name: 'GROW',
    subtitle: 'Grow your business with POS',
    description: 'For growing retail shops, service businesses, and small distributors',
    price: 'TZS 80,000',
    period: 'per month',
    annualPrice: 'TZS 800,000',
    annualPeriod: 'per year (2 months free)',
    usd: '~$30.40 USD',
    popular: true,
    icon: TrendingUp,
    color: 'blue',
    limits: {
      users: 'up to 3',
      products: '500',
      invoices: '500/month',
      posLocations: 'up to 2',
      inventoryLocations: 'up to 2',
    },
    features: {
      included: [
        'Everything in START',
        'After Sales & Task Management',
        'KPI Tracking',
        'Debt Collection',
        'Admin Panel',
        'My Workplace (COPCCA Apps)',
      ],
      excluded: [
        'Sales Pipeline',
        'Marketing Campaigns',
        'Product Intelligence',
        'Competitor Analysis',
        'Advanced Reports & Analytics',
        'Multi-user Collaboration',
      ],
    },
    cta: 'Choose GROW',
    ctaVariant: 'default',
  },
  {
    name: 'PRO',
    subtitle: 'Complete business platform',
    description: 'For established SMBs, small chains, and growing wholesalers',
    price: 'TZS 120,000',
    period: 'per month',
    annualPrice: 'TZS 1,200,000',
    annualPeriod: 'per year (2 months free)',
    usd: '~$45.60 USD',
    popular: false,
    icon: Zap,
    color: 'purple',
    limits: {
      users: 'up to 10',
      products: 'Unlimited',
      invoices: 'Unlimited',
      posLocations: 'Unlimited',
      inventoryLocations: 'Unlimited',
    },
    features: {
      included: [
        'ALL FEATURES & TABS INCLUDED',
        'Dashboard (AI Center)',
        'Customer Management (Customer 360)',
        'Advanced POS (Sales Hub)',
        'After Sales & Task Management',
        'KPI Tracking',
        'Debt Collection',
        'Sales Pipeline',
        'Marketing Campaigns',
        'Product Intelligence',
        'Competitor Analysis',
        'Advanced Reports & Analytics',
        'Multi-user Collaboration',
        'Admin Panel',
        'My Workplace (COPCCA Apps)',
      ],
      excluded: [],
    },
    cta: 'Go PRO',
    ctaVariant: 'default',
  },
];

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Choose Your Plan">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Star className="text-yellow-500" size={32} />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Select the perfect plan for your business. All plans include a 7-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch pt-8">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-8 h-full flex flex-col ${
                plan.popular
                  ? 'ring-2 ring-purple-500 shadow-2xl scale-105 mb-4'
                  : 'shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center space-y-4">
                <div className={`inline-flex p-3 rounded-xl ${
                  plan.color === 'green' ? 'bg-green-100 text-green-600' :
                  plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  plan.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <plan.icon size={32} />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-slate-600 font-medium">{plan.subtitle}</p>
                  {plan.description && (
                    <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-4xl font-bold text-slate-900">{plan.price}</div>
                  <div className="text-slate-600">{plan.period}</div>
                  {plan.annualPrice && (
                    <div className="text-lg text-slate-700 font-medium mt-2">
                      or {plan.annualPrice} {plan.annualPeriod}
                    </div>
                  )}
                  <div className="text-sm text-slate-500">{plan.usd}</div>
                </div>

                {plan.limits && (
                  <div className="space-y-4 pt-6 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 text-base">Plan Limits:</h4>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        {plan.limits.users && (
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-slate-200">
                            <span className="text-slate-700 font-medium">👤 Users</span>
                            <span className="text-slate-900 font-bold text-lg">{plan.limits.users}</span>
                          </div>
                        )}
                        {plan.limits.products && (
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-slate-200">
                            <span className="text-slate-700 font-medium">📦 Products</span>
                            <span className="text-slate-900 font-bold text-lg">{plan.limits.products}</span>
                          </div>
                        )}
                        {plan.limits.invoices && (
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-slate-200">
                            <span className="text-slate-700 font-medium">📄 Invoices</span>
                            <span className="text-slate-900 font-bold text-lg">{plan.limits.invoices}</span>
                          </div>
                        )}
                        {plan.limits.posLocations && (
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-slate-200">
                            <span className="text-slate-700 font-medium">🏪 POS Locations</span>
                            <span className="text-slate-900 font-bold text-lg">{plan.limits.posLocations}</span>
                          </div>
                        )}
                        {plan.limits.inventoryLocations && (
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-slate-200">
                            <span className="text-slate-700 font-medium">📊 Inventory Locations</span>
                            <span className="text-slate-900 font-bold text-lg">{plan.limits.inventoryLocations}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-6 mt-8">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">What's Included:</h4>
                  <div className="space-y-2">
                    {plan.features.included.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className="text-green-500 flex-shrink-0" size={18} />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {plan.features.excluded.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Not Included:</h4>
                    <div className="space-y-2">
                      {plan.features.excluded.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <X className="text-slate-400 flex-shrink-0" size={18} />
                          <span className="text-sm text-slate-500">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6">
                <Button
                  className="w-full"
                  variant={plan.ctaVariant}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold text-slate-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-slate-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-slate-900 mb-2">Is there a setup fee?</h4>
              <p className="text-slate-600 text-sm">
                No setup fees for any plan. Just sign up and start using COPCCA CRM immediately.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-slate-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-slate-600 text-sm">
                We accept all major credit cards, mobile money (M-Pesa, Airtel Money), and bank transfers in Tanzania.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-slate-900 mb-2">Do you offer discounts for annual billing?</h4>
              <p className="text-slate-600 text-sm">
                Yes! Save significantly with annual plans. START saves 2 months free, GROW and PRO offer substantial annual discounts. Contact our sales team for annual pricing details.
              </p>
            </Card>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center space-y-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-slate-900">Ready to get started?</h3>
          <p className="text-slate-600">
            Join thousands of Tanzanian businesses using COPCCA CRM to grow their sales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => window.open('/register', '_blank')}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.open('mailto:sales@copcca.com', '_blank')}>
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};