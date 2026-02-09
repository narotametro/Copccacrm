import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ContactSalesModal } from '@/components/ContactSalesModal';
import {
  Brain,
  TrendingUp,
  Users,
  Target,
  Zap,
  Shield,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Linkedin,
  Instagram,
  Facebook,
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Leverage advanced AI to predict customer behavior and optimize your sales strategy',
    },
    {
      icon: TrendingUp,
      title: 'Sales Pipeline Management',
      description: 'Track and manage your entire sales pipeline with real-time analytics',
    },
    {
      icon: Users,
      title: 'Customer Intelligence',
      description: 'Deep customer insights with health scores, sentiment analysis, and engagement tracking',
    },
    {
      icon: Target,
      title: 'Competitor Analysis',
      description: 'Stay ahead with comprehensive competitor monitoring and market intelligence',
    },
    {
      icon: Zap,
      title: 'Automated Workflows',
      description: 'Automate repetitive tasks and focus on what matters - closing deals',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with role-based access control and data encryption',
    },
  ];

  const benefits = [
    'Increase sales conversion by 40%',
    'Reduce customer churn by 35%',
    'Save 10+ hours per week on admin tasks',
    'Improve team collaboration by 50%',
    'Make data-driven decisions in real-time',
    'Scale your business effortlessly',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="glass border-b border-white/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Brain className="text-primary-600" size={32} />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                COPCCA CRM
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-block px-6 py-2 border-2 border-slate-300 rounded-xl bg-white/80 backdrop-blur-sm">
              <p className="text-sm md:text-base font-semibold text-slate-700 tracking-wide">
                COPCCA — Convert Operations & Performance into Clear, Confident Action
              </p>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-tight">
              Turn Data into{' '}
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent font-black">
                Actionable Business Insights
              </span>{' '}
              with AI
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto">
              Supercharge your sales team with AI-powered CRM that predicts, automates, and optimizes every customer interaction
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate('/register')} icon={ArrowRight}>
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setShowContactModal(true)}
              className="border-4 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-padding hover:shadow-xl hover:scale-105 transition-all text-white"
            >
              <MessageSquare size={20} className="text-white" />
              Contact Sales
            </Button>
          </div>

          <p className="text-sm text-slate-500">
            7-days free trial
          </p>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="glass rounded-2xl p-2 md:p-4 shadow-2xl border-2 border-white/20">
            <img 
              src="/dashboard-preview.png" 
              alt="COPCCA CRM Dashboard Preview" 
              className="w-full h-auto rounded-xl shadow-lg"
            />
          </div>
          
          {/* Floating Stats */}
          <div className="absolute -top-8 -left-8 glass rounded-xl p-4 shadow-lg hidden lg:block animate-pulse">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-slate-600">Conversion Rate</p>
                <p className="text-xl font-bold text-slate-900">+42%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Everything you need to grow your business
          </h2>
          <p className="text-xl text-slate-600">
            Powerful features designed for modern sales teams
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const gradients = [
              'bg-gradient-to-br from-blue-500 to-purple-600',
              'bg-gradient-to-br from-purple-500 to-pink-600',
              'bg-gradient-to-br from-green-500 to-teal-600',
              'bg-gradient-to-br from-orange-500 to-red-600',
              'bg-gradient-to-br from-indigo-500 to-blue-600',
              'bg-gradient-to-br from-pink-500 to-rose-600',
            ];
            
            return (
              <div 
                key={index} 
                className={`${gradients[index]} rounded-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white`}
              >
                <div className="bg-white/20 backdrop-blur-sm w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/90">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
        <div className="glass rounded-2xl p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Why teams love COPCCA CRM
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Join thousands of sales teams who have transformed their business with our AI-powered platform
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-1">
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                    <span className="text-slate-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              {/* Testimonial Cards */}
              <div className="bg-white/80 rounded-xl p-6 shadow-lg">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-slate-700 italic mb-4">
                  "COPCCA CRM transformed how we manage our sales pipeline. The AI insights are game-changing!"
                </p>
                <p className="text-sm font-medium text-slate-900">— Sarah Thomas, VP Sales</p>
              </div>
              <div className="bg-white/80 rounded-xl p-6 shadow-lg">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-slate-700 italic mb-4">
                  "We increased our conversion rate by 40% in just 3 months. Best investment we've made."
                </p>
                <p className="text-sm font-medium text-slate-900">— Michael Okenebe, CEO</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Ready to supercharge your sales?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Start your 7-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/register')}
              icon={ArrowRight}
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-4 border-white/50 hover:border-white hover:bg-white/10 hover:shadow-2xl hover:scale-105 transition-all text-white"
              onClick={() => setShowContactModal(true)}
            >
              <MessageSquare size={20} className="text-white" />
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-slate-600">
            Choose the plan that fits your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* START Plan */}
          <div className="glass rounded-xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">START</h3>
              <p className="text-slate-600">Perfect for micro-businesses</p>
            </div>
            <div className="text-center mb-6">
              <div className="text-4xl font-black text-slate-900">TZS 25,000</div>
              <div className="text-slate-600">per month</div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Dashboard (AI Center)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Customer Management</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Advanced POS</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>1 User</span>
              </li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>

          {/* GROW Plan - Popular */}
          <div className="glass rounded-xl p-8 border-2 border-blue-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">GROW</h3>
              <p className="text-slate-600">Grow your business with POS</p>
            </div>
            <div className="text-center mb-6">
              <div className="text-4xl font-black text-slate-900">TZS 80,000</div>
              <div className="text-slate-600">per month</div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Everything in START</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>After Sales & Tasks</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>KPI Tracking</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Up to 3 Users</span>
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => navigate('/register')}
            >
              Choose GROW
            </Button>
          </div>

          {/* PRO Plan */}
          <div className="glass rounded-xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">PRO</h3>
              <p className="text-slate-600">Complete business platform</p>
            </div>
            <div className="text-center mb-6">
              <div className="text-4xl font-black text-slate-900">TZS 120,000</div>
              <div className="text-slate-600">per month</div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Everything in GROW</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Marketing Campaigns</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Advanced Analytics</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <span>Unlimited Users</span>
              </li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate('/register')}
            >
              Go PRO
            </Button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">
            All plans include 7-day free trial. No credit card required.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowContactModal(true)}
          >
            <MessageSquare size={20} className="mr-2" />
            Need a custom plan? Contact Sales
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-black backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Left - Logo */}
            <div className="flex items-center gap-2">
              <Brain className="text-white" size={28} />
              <span className="text-xl font-bold text-white">COPCCA CRM</span>
            </div>
            
            {/* Middle - Copyright */}
            <div className="text-center text-sm text-white">
              <p>
                &copy; 2026 COPCCA CRM. All rights reserved. | {' '}
                <a href="#" className="text-white hover:text-primary-600">Privacy Policy</a>
              </p>
            </div>
            
            {/* Right - Social Media */}
            <div className="flex items-center gap-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-600 transition-colors">
                <Linkedin size={24} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-600 transition-colors">
                <Instagram size={24} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-600 transition-colors">
                <Facebook size={24} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Sales Modal */}
      <ContactSalesModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  );
};
