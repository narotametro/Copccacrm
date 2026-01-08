import React, { useState } from 'react';
import { FileText, Download, Calendar, Package, Target, Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Award, Shield, Zap, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

export const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reports = [
    { name: 'Sales Performance Report', date: '2026-01-07', type: 'Sales', color: 'from-green-600 to-emerald-600' },
    { name: 'Customer Analysis Report', date: '2026-01-05', type: 'Customer', color: 'from-blue-600 to-cyan-600' },
    { name: 'Revenue Forecast Report', date: '2026-01-03', type: 'Finance', color: 'from-purple-600 to-pink-600' },
    { name: 'Marketing Campaign Report', date: '2026-01-01', type: 'Marketing', color: 'from-orange-600 to-red-600' },
    { name: 'Product Intelligence Report', date: '2026-01-07', type: 'Product', color: 'from-indigo-600 to-purple-600' },
    { name: 'Competitive Intelligence Report', date: '2026-01-06', type: 'Competitive', color: 'from-red-600 to-orange-600' },
  ];

  const handleDownload = (reportName: string) => {
    // Create a simple text-based report content
    const reportContent = `COPCCA CRM - ${reportName}
Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

This is a comprehensive ${reportName} containing detailed analytics and insights.

For the full interactive report with charts and AI recommendations, please view it in the application.

---
COPCCA CRM 2026 - AI-Powered Business Intelligence
`;

    // Create a blob and download link
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(`${reportName} downloaded successfully!`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">📊 Reports & AI Insights</h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Comprehensive analytics and intelligence reports</p>
        </div>
        <Button onClick={() => toast.success('Generating new report...')} className="text-sm md:text-base">Generate Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {reports.map((report, index) => (
          <Card key={index} hover className="cursor-pointer" onClick={() => setSelectedReport(report.type)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${report.color} flex items-center justify-center flex-shrink-0`}>
                  <FileText className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 mb-1">{report.name}</h3>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <Calendar size={14} />
                    <span>{report.date}</span>
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded font-medium">
                    {report.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-200">
              <Button variant="ghost" size="sm" icon={Eye} onClick={(e) => {
                e.stopPropagation();
                setSelectedReport(report.type);
              }}>
                View
              </Button>
              <Button variant="ghost" size="sm" icon={Download} onClick={(e) => {
                e.stopPropagation();
                handleDownload(report.name);
              }}>
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <h3 className="text-xs md:text-sm text-slate-600 mb-1 md:mb-2">Total Reports</h3>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">26</p>
        </Card>
        <Card>
          <h3 className="text-xs md:text-sm text-slate-600 mb-1 md:mb-2">Generated This Month</h3>
          <p className="text-2xl md:text-3xl font-bold text-primary-600">6</p>
        </Card>
        <Card>
          <h3 className="text-xs md:text-sm text-slate-600 mb-1 md:mb-2">Most Popular</h3>
          <p className="text-base md:text-lg font-bold text-slate-900">Product Intelligence</p>
        </Card>
      </div>

      {/* Sales Performance Report Modal */}
      <Modal
        isOpen={selectedReport === 'Sales'}
        onClose={() => setSelectedReport(null)}
        title="📈 Sales Performance Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-green-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-green-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-green-800">
                  Sales performance trending upward with <span className="font-bold">₦524K revenue this month (65.5% of ₦800K target)</span>. 
                  Win rate at 50% with average deal size of ₦54K. Top performer: Enterprise segment with 82% close probability. 
                  <span className="font-bold"> Recommendation: Focus on 4 high-probability deals (₦185K weighted forecast)</span> to hit monthly target.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-green-500">
              <h4 className="font-bold text-slate-900 mb-3">💰 Revenue Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Month-to-Date</span>
                  <span className="font-bold text-green-600">₦524K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Target Progress</span>
                  <span className="font-bold text-slate-900">65.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Remaining to Target</span>
                  <span className="font-bold text-orange-600">₦276K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">AI Forecast</span>
                  <span className="font-bold text-primary-600">₦185K</span>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-blue-500">
              <h4 className="font-bold text-slate-900 mb-3">🎯 Pipeline Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Active Deals</span>
                  <span className="font-bold text-slate-900">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Win Rate</span>
                  <span className="font-bold text-green-600">50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg Deal Size</span>
                  <span className="font-bold text-slate-900">₦54K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">At Risk Deals</span>
                  <span className="font-bold text-red-600">1</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Sales Performance Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with sales team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer Analysis Report Modal */}
      <Modal
        isOpen={selectedReport === 'Customer'}
        onClose={() => setSelectedReport(null)}
        title="👥 Customer Analysis Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-blue-800">
                  Customer base of <span className="font-bold">127 active customers with 82% average health score</span>. 
                  Churn risk identified in 12% of base (primarily in at-risk segment). 
                  <span className="font-bold"> Priority: Engage Acme Corp (78% churn risk, ₦50K/mo value)</span> and 2 other high-value at-risk customers immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-blue-500">
              <h4 className="font-bold text-slate-900 mb-3">📊 Customer Segmentation</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">VIP Customers</span>
                  <span className="font-bold text-purple-600">15 (12%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Active Customers</span>
                  <span className="font-bold text-green-600">98 (77%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">At Risk</span>
                  <span className="font-bold text-red-600">8 (6%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">New Leads</span>
                  <span className="font-bold text-blue-600">6 (5%)</span>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-purple-500">
              <h4 className="font-bold text-slate-900 mb-3">💎 Value Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg Health Score</span>
                  <span className="font-bold text-green-600">82/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg Churn Risk</span>
                  <span className="font-bold text-orange-600">12%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Upsell Potential</span>
                  <span className="font-bold text-primary-600">78%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Customer LTV</span>
                  <span className="font-bold text-slate-900">₦1.2M</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Customer Analysis Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with customer success team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revenue Forecast Report Modal */}
      <Modal
        isOpen={selectedReport === 'Finance'}
        onClose={() => setSelectedReport(null)}
        title="💰 Revenue Forecast Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-purple-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-purple-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-purple-800">
                  <span className="font-bold">Q1 2026 forecast: ₦1.8M total revenue</span> based on current pipeline and historical trends. 
                  Month-over-month growth steady at 15%. Product revenue split: CRM Pro (54%), Mobile (15%), Analytics (20%), AI Assistant (11%). 
                  <span className="font-bold"> Risk: ₦165K outstanding debt affecting cash flow</span> - recommend aggressive collection.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-purple-500">
              <h4 className="font-bold text-slate-900 mb-3">📈 Revenue Projections</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">January 2026</span>
                  <span className="font-bold text-purple-600">₦524K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">February 2026</span>
                  <span className="font-bold text-slate-900">₦602K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">March 2026</span>
                  <span className="font-bold text-slate-900">₦693K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Q1 Total</span>
                  <span className="font-bold text-green-600">₦1.82M</span>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-pink-500">
              <h4 className="font-bold text-slate-900 mb-3">💳 Cash Flow</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Collections Rate</span>
                  <span className="font-bold text-green-600">94%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Outstanding Debt</span>
                  <span className="font-bold text-red-600">₦165K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Expected Recovery</span>
                  <span className="font-bold text-orange-600">₦155K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Net Cash Position</span>
                  <span className="font-bold text-primary-600">₦680K</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Revenue Forecast Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with finance team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Marketing Campaign Report Modal */}
      <Modal
        isOpen={selectedReport === 'Marketing'}
        onClose={() => setSelectedReport(null)}
        title="🎯 Marketing Campaign Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-orange-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-orange-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-orange-800">
                  <span className="font-bold">Marketing ROI at 165% with ₦1.5M total revenue generated</span> from 4 active campaigns. 
                  Q1 2026 Launch performing exceptionally (254% ROI, 92/100 AI score). 
                  <span className="font-bold"> Best channel: Email (45% of conversions)</span>. Recommendation: Reallocate 20% budget from ads to email for Q2.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-orange-500">
              <h4 className="font-bold text-slate-900 mb-3">📊 Campaign Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Active Campaigns</span>
                  <span className="font-bold text-orange-600">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Revenue</span>
                  <span className="font-bold text-green-600">₦1.5M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Average ROI</span>
                  <span className="font-bold text-primary-600">165%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Budget Used</span>
                  <span className="font-bold text-slate-900">24%</span>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-red-500">
              <h4 className="font-bold text-slate-900 mb-3">📢 Channel Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="font-bold text-green-600">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Social Media</span>
                  <span className="font-bold text-blue-600">30%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Paid Ads</span>
                  <span className="font-bold text-orange-600">15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">SMS</span>
                  <span className="font-bold text-purple-600">10%</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Marketing Campaign Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with marketing team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Product Intelligence Report Modal */}
      <Modal
        isOpen={selectedReport === 'Product'}
        onClose={() => setSelectedReport(null)}
        title="📦 Product Intelligence Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <Brain className="text-indigo-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-indigo-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-indigo-800">
                  Your product portfolio shows strong growth with <span className="font-bold">COPCCA Mobile leading at 92/100 AI score</span>. 
                  Total monthly revenue of ₦230K with average growth rate of 37%. Key recommendation: <span className="font-bold">Focus resources on Mobile & AI Assistant</span> (highest performers) 
                  while repositioning Analytics product to address market feedback.
                </p>
              </div>
            </div>
          </div>

          {/* Product Performance Summary */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Package className="text-indigo-600" size={20} />
              Product Performance Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">COPCCA CRM Pro</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">GROWING</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">₦125K/mo</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <TrendingUp size={14} />
                    +28% growth
                  </span>
                  <span className="text-slate-600">AI Score: 87</span>
                </div>
              </Card>

              <Card className="border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">COPCCA Analytics</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">STABLE</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">₦45K/mo</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 font-medium flex items-center gap-1">
                    <TrendingUp size={14} />
                    +12% growth
                  </span>
                  <span className="text-slate-600">AI Score: 68</span>
                </div>
              </Card>

              <Card className="border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">COPCCA Mobile</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">LEADER</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">₦35K/mo</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600 font-medium flex items-center gap-1">
                    <TrendingUp size={14} />
                    +45% growth
                  </span>
                  <span className="text-slate-600">AI Score: 92</span>
                </div>
              </Card>

              <Card className="border-l-4 border-pink-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">COPCCA AI Assistant</span>
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded">LEADER</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">₦25K/mo</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-pink-600 font-medium flex items-center gap-1">
                    <TrendingUp size={14} />
                    +52% growth
                  </span>
                  <span className="text-slate-600">AI Score: 95</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Competitive Analysis */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="text-red-600" size={20} />
              Competitive Position
            </h3>
            <div className="space-y-3">
              <Card className="bg-green-50 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-1">Competitive Advantages</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• <span className="font-semibold">40% lower pricing</span> than Salesforce Professional</li>
                      <li>• <span className="font-semibold">Built-in competitive intelligence</span> (unique feature)</li>
                      <li>• <span className="font-semibold">AI-native architecture</span> vs legacy systems</li>
                      <li>• <span className="font-semibold">Mobile-first</span> design for field teams</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="bg-orange-50 border-2 border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 mb-1">Areas for Improvement</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Analytics product needs better reporting dashboard</li>
                      <li>• Limited integrations compared to HubSpot (25 vs 500+)</li>
                      <li>• Enterprise features less mature than competitors</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap className="text-primary-600" size={20} />
              AI Strategic Recommendations
            </h3>
            <div className="space-y-3">
              <Card className="border-l-4 border-primary-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">1</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Double Down on Mobile & AI Assistant</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      These products have highest AI scores (92, 95) and growth rates (45%, 52%). 
                      Allocate 60% of R&D budget here for maximum ROI.
                    </p>
                    <Button size="sm" onClick={() => toast.success('Creating resource allocation plan...')}>
                      Create Action Plan
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">2</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Reposition Analytics Product</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Customer feedback indicates need for better dashboards. Invest in UI overhaul and add predictive analytics features.
                      Potential to increase revenue from ₦45K to ₦75K/mo.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => toast.success('Scheduling product review...')}>
                      Schedule Review
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-green-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center">3</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Increase Pricing on CRM Pro</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Market analysis shows you can raise price from ₦49.99 to ₦59.99 without affecting conversion. 
                      Estimated additional ₦25K/mo revenue.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => toast.success('Running pricing simulation...')}>
                      Run Simulation
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Product Intelligence Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with team')}>
              Share with Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Competitive Intelligence Report Modal */}
      <Modal
        isOpen={selectedReport === 'Competitive'}
        onClose={() => setSelectedReport(null)}
        title="🎯 Competitive Intelligence Report"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <Brain className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-red-900 mb-1">🧠 AI Executive Summary</h3>
                <p className="text-sm text-red-800">
                  <span className="font-bold">HIGH ALERT:</span> RivalTech reduced pricing by 15%, directly threatening 2 deals worth ₦240K. 
                  MarketLeader (85/100 threat score) gaining market share in enterprise segment. 
                  <span className="font-bold"> Immediate action required on pricing and enterprise features.</span> BudgetCRM remains low threat (32 score).
                </p>
              </div>
            </div>
          </div>

          {/* Threat Level Dashboard */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Target className="text-red-600" size={20} />
              Competitor Threat Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">RivalTech</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">HIGH THREAT</span>
                </div>
                <p className="text-2xl font-bold text-red-600 mb-1">78/100</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Position: Challenger</span>
                  <span className="text-red-600 font-medium">28% share</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Latest Activity:</p>
                  <p className="text-xs text-red-700 font-medium">Reduced pricing 15% (Jan 6)</p>
                </div>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">MarketLeader</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">CRITICAL</span>
                </div>
                <p className="text-2xl font-bold text-orange-600 mb-1">85/100</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Position: Leader</span>
                  <span className="text-orange-600 font-medium">42% share</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Latest Activity:</p>
                  <p className="text-xs text-orange-700 font-medium">Launched AI features (Jan 5)</p>
                </div>
              </Card>

              <Card className="border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">BudgetCRM</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">LOW THREAT</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mb-1">32/100</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Position: Follower</span>
                  <span className="text-green-600 font-medium">8% share</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Latest Activity:</p>
                  <p className="text-xs text-green-700 font-medium">No major changes</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Competitive Wins & Losses */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="text-primary-600" size={20} />
              Win/Loss Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-green-50 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-2">Why We Win</h4>
                    <ul className="text-sm text-green-800 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✓</span>
                        <span><span className="font-semibold">Lower price:</span> 40% cheaper than Salesforce, 25% vs HubSpot</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✓</span>
                        <span><span className="font-semibold">Better support:</span> 24/7 local support vs 9-5 international</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✓</span>
                        <span><span className="font-semibold">Unique features:</span> Competitive intelligence built-in</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✓</span>
                        <span><span className="font-semibold">Mobile-first:</span> Best mobile experience in market</span>
                      </li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="text-xs text-green-700"><span className="font-bold">Win Rate:</span> 65% when competing directly</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-red-50 border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 mb-2">Why We Lose</h4>
                    <ul className="text-sm text-red-800 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✗</span>
                        <span><span className="font-semibold">Enterprise features:</span> Missing advanced workflow automation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✗</span>
                        <span><span className="font-semibold">Integrations:</span> Only 25 vs HubSpot's 500+</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✗</span>
                        <span><span className="font-semibold">Brand recognition:</span> Less known than Salesforce/Microsoft</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0">✗</span>
                        <span><span className="font-semibold">Reporting:</span> Limited customization vs Tableau integration</span>
                      </li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-red-300">
                      <p className="text-xs text-red-700"><span className="font-bold">Loss Rate:</span> 35% (mostly large enterprises)</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Strategic Responses */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap className="text-primary-600" size={20} />
              AI Strategic Counter-Moves
            </h3>
            <div className="space-y-3">
              <Card className="border-l-4 border-red-500 bg-red-50">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 text-white font-bold text-sm flex items-center justify-center">!</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-red-900">URGENT: Counter RivalTech Pricing</h4>
                      <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-bold rounded">DO NOW</span>
                    </div>
                    <p className="text-sm text-red-800 mb-3">
                      RivalTech's 15% price cut threatens ₦240K in active deals (Acme Corp, GlobalTech). 
                      <span className="font-bold"> Recommend: Offer time-limited enterprise bundle at 20% discount + 3 months free support.</span>
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => toast.success('Creating counter-offer proposal...')}>
                        Create Counter-Offer
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => toast.success('Alerting sales team...')}>
                        Alert Sales Team
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">1</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Accelerate Enterprise Features Development</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      70% of losses to MarketLeader cite missing enterprise features. Priority: Advanced workflow automation, 
                      custom reporting, and SSO integration. Timeline: 8 weeks. Expected impact: Reduce loss rate from 35% to 20%.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => toast.success('Scheduling sprint planning...')}>
                      Schedule Sprint
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-blue-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">2</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Launch Integration Marketplace</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Partner with top 50 SaaS tools (Slack, Zoom, QuickBooks, etc.) to close integration gap. 
                      Focus on African market tools competitors ignore (M-Pesa, local accounting software).
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => toast.success('Creating partnership plan...')}>
                      Create Plan
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-l-4 border-green-500">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center">3</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Amplify Your Unique Strengths</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      No competitor has built-in competitive intelligence. Create marketing campaign highlighting this: 
                      "While they track customers, we help you beat competitors." Target SMBs struggling against larger players.
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => toast.success('Briefing marketing team...')}>
                      Brief Marketing
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Market Opportunities */}
          <Card className="bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200">
            <div className="flex items-start gap-3">
              <DollarSign className="text-primary-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-primary-900 mb-1">💰 Market Opportunity Detected</h3>
                <p className="text-sm text-primary-800 mb-2">
                  <span className="font-bold">African SMB market growing 45% YoY</span> with low competitor penetration. 
                  Both Salesforce and HubSpot focus on large enterprises. 
                  Opportunity: Position as "The CRM Built for African SMBs" and capture market before they do.
                </p>
                <p className="text-xs text-primary-700 mt-2">
                  <span className="font-semibold">Estimated TAM:</span> ₦2.8B across Nigeria, Kenya, Ghana, South Africa
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-3 pt-4 border-t">
            <Button icon={Download} onClick={() => handleDownload('Competitive Intelligence Report')}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Report shared with executive team')}>
              Share with Executives
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
