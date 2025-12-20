import { ArrowRight, BarChart3, UserCheck, Shield, Zap, TrendingUp, DollarSign, Check, Bot } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
}

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: BarChart3,
    title: 'After-Sales Follow-Up Tracking',
    description: 'Automate customer follow-ups with AI agents through voice, SMS, and WhatsApp. Monitor sales performance and customer satisfaction.',
  },
  {
    icon: TrendingUp,
    title: 'KPI Tracking',
    description: 'Track key performance indicators in real-time with customizable dashboards and automated reporting.',
  },
  {
    icon: UserCheck,
    title: 'Competitor Information',
    description: 'Collect and analyze competitor data with automated monitoring, price comparisons, and market insights.',
  },
  {
    icon: Zap,
    title: 'Sales & Marketing Strategies',
    description: 'Develop winning strategies with data-driven insights, campaign tracking, and performance analytics.',
  },
  {
    icon: DollarSign,
    title: 'Debt Collection',
    description: 'Streamline payment tracking and automate collection workflows for all pending payments with AI-powered reminders.',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'Get updated activity reports and short bullet-point insights powered by AI for quick decision-making.',
  },
];

const benefits: string[] = [
  'Real-time data tracking and analytics',
  'AI-powered business insights',
  'Automated competitor monitoring',
  'Streamlined debt collection',
  'Team collaboration tools',
  'Customizable KPI dashboards',
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-200 to-pink-300">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-xl text-white" aria-label="COPCCA CRM">C</span>
            </div>
            <span className="text-2xl">COPCCA CRM</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-6 py-2 text-gray-700 hover:text-pink-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-20 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full shadow-sm border border-blue-200 mb-8">
              <Bot size={16} className="text-blue-600" />
              <span className="text-sm text-blue-900">AI-Powered Customer Relationship Management (CRM) System</span>
            </div>

            {/* Main Heading */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.span
                className="inline"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="text-pink-600">Turn Data into Actionable Insights </span>
                <span className="text-black">for Your Business with AI</span>
              </motion.span>
            </motion.h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Automate customer follow-ups after sales, track KPIs in real-time, monitor competitor information, streamline debt collection, and develop winning sales & marketing strategies—all powered by AI insights.
            </p>

            {/* CTA Button - Single */}
            <div className="flex items-center justify-center">
              <button
                onClick={onGetStarted}
                className="px-10 py-5 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all text-xl shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-3 group"
              >
                Get Started Free
                <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4">Everything you need</h2>
          <p className="text-xl text-gray-600">Powerful tools to manage your customer relationships</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon size={28} className="text-pink-600" />
                </div>
                <h3 className="text-xl mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-12 md:p-16 text-white shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl mb-6">
                Why choose COPCCA CRM?
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Built for modern businesses that want to automate customer follow-ups and grow faster with data-driven insights.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={20} className="text-white" />
                  </div>
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-sm text-white" aria-label="COPCCA CRM">C</span>
              </div>
              <span>COPCCA CRM</span>
            </div>
            <p className="text-sm text-gray-400">© 2025 COPCCA CRM. All rights reserved. | Privacy Policy</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}