import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Check,
  Trash2,
  Filter,
  Search,
  Clock,
  User,
  Calendar,
  ChevronRight,
  Mail,
  MailOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatName, formatRole } from '@/lib/textFormat';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  fullDetails: string;
  time: string;
  date: string;
  read: boolean;
  sender: string;
  senderRole: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  actionLink?: string;
  relatedTo?: string;
}

const demoNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Deal Closed Successfully',
    message: 'Acme Corp signed the contract worth ₦15.5M',
    fullDetails: 'Congratulations! The deal with Acme Corp has been successfully closed. The contract includes:\n\n• Enterprise License (500 users) - ₦12M\n• Implementation Services - ₦2M\n• Annual Support Package - ₦1.5M\n\nNext Steps:\n1. Schedule kickoff meeting within 48 hours\n2. Assign implementation team\n3. Send welcome package to client\n4. Update revenue forecast\n\nThe client has requested an expedited implementation timeline. Please coordinate with the technical team to ensure resources are available.',
    time: '5 minutes ago',
    date: '2026-01-12 14:30',
    read: false,
    sender: 'John Doe',
    senderRole: 'Sales Manager',
    category: 'Sales',
    priority: 'high',
    actionRequired: true,
    actionLink: '/app/pipeline',
    relatedTo: 'Deal #ACM-2026-001',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Task Overdue - Urgent Action Required',
    message: 'Damage compensation to DANGOOD is 33 days overdue',
    fullDetails: 'URGENT: The damage compensation payment to DANGOOD Trading Ltd has been overdue for 33 days.\n\nOriginal Details:\n• Amount Due: ₦850,000\n• Due Date: December 10, 2025\n• Days Overdue: 33 days\n• Late Fee Accrued: ₦42,500 (5%)\n• Total Now Due: ₦892,500\n\nBackground:\nOn November 15, 2025, during shipment handling, our logistics partner damaged 3 units of industrial equipment valued at ₦850,000. The client has provided photographic evidence and filed a formal claim.\n\nImmediate Actions Required:\n1. Approve payment authorization TODAY\n2. Contact client to apologize and confirm payment timeline\n3. Process payment through express channel (same-day if possible)\n4. Review logistics partner contract and file claim with insurance\n5. Send goodwill gesture (discount on next order)\n\nRisk Assessment:\n• Client relationship at HIGH RISK\n• May escalate to legal action if not resolved within 7 days\n• Could impact future orders (₦5M pipeline at risk)\n• Reputation damage in industry\n\nPlease treat this with utmost urgency.',
    time: '1 hour ago',
    date: '2026-01-12 13:45',
    read: false,
    sender: 'Jane Smith',
    senderRole: 'Account Manager',
    category: 'Debt Collection',
    priority: 'urgent',
    actionRequired: true,
    actionLink: '/app/debt-collection',
    relatedTo: 'Case #DANG-2025-078',
  },
  {
    id: '3',
    type: 'info',
    title: 'New Customer Added',
    message: 'GlobalTech Industries added to CRM',
    fullDetails: 'New Customer Profile Created:\n\nCompany: GlobalTech Industries Limited\nIndustry: Technology & Software Development\nSize: 250-500 employees\nLocation: Lagos, Victoria Island\n\nContact Information:\n• Primary Contact: Adebayo Williams (CTO)\n• Email: a.williams@globaltech.ng\n• Phone: +234 803 456 7890\n• Website: www.globaltech.ng\n\nPotential Value:\n• Estimated Annual Revenue: ₦8M - ₦12M\n• Products Interested: Enterprise CRM, Marketing Automation\n• Budget Allocated: ₦10M for 2026\n• Decision Timeline: Q1 2026\n\nLead Source: Industry Conference (Tech Summit 2026)\nAssigned Sales Rep: Mike Johnson\nInitial Meeting: Scheduled for January 18, 2026\n\nCompany Background:\nGlobalTech is a rapidly growing software development company specializing in fintech solutions. They are currently using multiple disconnected tools and are looking for an integrated platform to streamline operations.\n\nKey Pain Points:\n• Poor visibility across sales pipeline\n• Manual reporting consuming 15+ hours/week\n• Difficulty tracking customer interactions across teams\n• No centralized customer data repository\n\nCompetitors: They are also evaluating Salesforce and Microsoft Dynamics, but our pricing and local support are strong differentiators.\n\nNext Steps:\n1. Send welcome email with company overview\n2. Prepare custom demo focusing on their pain points\n3. Research their current tech stack\n4. Prepare case studies from similar companies',
    time: '2 hours ago',
    date: '2026-01-12 12:30',
    read: true,
    sender: 'Mike Johnson',
    senderRole: 'Sales Representative',
    category: 'Customers',
    priority: 'medium',
    actionRequired: false,
    relatedTo: 'Customer #GLB-2026-001',
  },
  {
    id: '4',
    type: 'success',
    title: 'Payment Received',
    message: '₦2.5M received from TechStart Solutions',
    fullDetails: 'Payment Confirmation:\n\nAmount Received: ₦2,500,000.00\nCustomer: TechStart Solutions Limited\nInvoice #: INV-2026-0045\nPayment Method: Bank Transfer\nTransaction Reference: TXN/2026/01/12/000456\nDate Received: January 12, 2026 at 11:15 AM\n\nPayment Breakdown:\n• Subscription Renewal (Annual): ₦2,000,000\n• Additional User Licenses (50): ₦400,000\n• Premium Support Upgrade: ₦100,000\n\nAccount Status:\n• Previous Balance: ₦2,500,000 (Due)\n• Payment Applied: ₦2,500,000\n• Current Balance: ₦0.00 (Fully Paid)\n• Account Status: Active - Good Standing\n• Next Payment Due: January 12, 2027\n\nActions Completed:\n1. ✓ Payment received and verified\n2. ✓ Invoice marked as paid\n3. ✓ Receipt generated and sent to customer\n4. ✓ Account upgraded to Premium Support\n5. ✓ 50 additional user licenses activated\n\nCustomer Account Manager: Sarah Williams\nCustomer Satisfaction Score: 9.5/10\nAccount Health: Excellent\n\nNote: Customer has expressed interest in exploring our Marketing Automation module. Follow-up call scheduled for January 15, 2026.',
    time: '3 hours ago',
    date: '2026-01-12 11:15',
    read: true,
    sender: 'Finance Team',
    senderRole: 'Finance Department',
    category: 'Finance',
    priority: 'low',
    actionRequired: false,
    relatedTo: 'Invoice #INV-2026-0045',
  },
  {
    id: '5',
    type: 'warning',
    title: 'Low Inventory Alert',
    message: 'Product "Enterprise License Keys" running low - 15 units remaining',
    fullDetails: 'Inventory Alert - Action Required:\n\nProduct Details:\n• Product Name: Enterprise License Keys\n• SKU: ENT-LIC-2026\n• Current Stock: 15 units\n• Reorder Point: 20 units\n• Safety Stock: 10 units\n• Status: Below Reorder Point ⚠️\n\nDemand Analysis:\n• Average Monthly Usage: 25 units\n• Current Month Usage: 18 units (12 days)\n• Projected End of Month: 35 units needed\n• Days Until Stockout: ~18 days (at current rate)\n\nPending Orders:\n• 3 deals in negotiation requiring 12 licenses\n• 2 renewal customers requiring 8 licenses\n• Total Committed (not yet delivered): 20 units\n\nSupplier Information:\n• Primary Supplier: TechLicense Global\n• Lead Time: 5-7 business days\n• Minimum Order Quantity: 50 units\n• Unit Cost: ₦150,000\n• Total Reorder Cost: ₦7,500,000\n\nRecommended Actions:\n1. Place reorder immediately (MOQ: 50 units)\n2. Contact pending customers about potential delay\n3. Consider expedited shipping if urgent deals pending\n4. Review reorder point settings (may need increase)\n\nImpact Assessment:\n• HIGH: Risk of losing pending deals if stock runs out\n• MEDIUM: Customer satisfaction impact\n• LOW: Can source from alternative supplier (higher cost)\n\nPlease approve purchase order in procurement system.',
    time: '5 hours ago',
    date: '2026-01-12 09:30',
    read: false,
    sender: 'Inventory System',
    senderRole: 'Automated Alert',
    category: 'Products',
    priority: 'high',
    actionRequired: true,
    actionLink: '/app/products',
    relatedTo: 'Product #ENT-LIC-2026',
  },
  {
    id: '6',
    type: 'info',
    title: 'Marketing Campaign Results',
    message: 'Q4 Email Campaign achieved 8.5% conversion rate',
    fullDetails: 'Campaign Performance Report - Q4 2025:\n\nCampaign Name: "New Year Growth Package"\nCampaign Type: Email Marketing\nDuration: December 1 - December 31, 2025\n\n📊 KEY METRICS:\n\nDelivery Statistics:\n• Total Emails Sent: 12,450\n• Successfully Delivered: 12,180 (97.8%)\n• Bounced: 270 (2.2%)\n• Spam Complaints: 8 (0.06%)\n\nEngagement Metrics:\n• Opens: 4,265 (35.0%)\n• Unique Opens: 3,892 (32.0%)\n• Clicks: 1,524 (12.5% of delivered)\n• Click-to-Open Rate: 39.1%\n• Unsubscribes: 45 (0.37%)\n\nConversion Metrics:\n• Conversions: 1,035 (8.5% of delivered)\n• Revenue Generated: ₦45.2M\n• Cost per Acquisition: ₦8,500\n• Return on Investment: 425%\n• Average Deal Size: ₦43,700\n\n🎯 PERFORMANCE vs TARGETS:\n\n• Open Rate: 35.0% (Target: 25%) ✓ +40%\n• Click Rate: 12.5% (Target: 8%) ✓ +56%\n• Conversion: 8.5% (Target: 5%) ✓ +70%\n• Revenue: ₦45.2M (Target: ₦30M) ✓ +51%\n\n💡 KEY INSIGHTS:\n\n1. Best Performing Segment:\n   - Small Business (50-100 employees)\n   - Conversion Rate: 12.3%\n   - Revenue: ₦18.5M\n\n2. Top Converting Email:\n   - Subject: "Last Chance: 40% Off Growth Package"\n   - Send Date: December 28\n   - Conversion: 15.2%\n\n3. Optimal Send Time:\n   - Tuesday & Thursday\n   - 9:00 AM - 10:00 AM\n   - 42% higher open rates\n\n4. Device Breakdown:\n   - Mobile: 65% (rising trend)\n   - Desktop: 32%\n   - Tablet: 3%\n\n🎬 RECOMMENDATIONS FOR Q1 2026:\n\n1. Increase budget by 30% based on strong ROI\n2. Focus on small business segment\n3. A/B test subject lines with urgency\n4. Optimize emails for mobile devices\n5. Implement progressive profiling\n6. Add video content (increases CTR by 96%)\n\nCampaign Manager: Marketing Team\nApproved Budget: ₦2.5M\nActual Spend: ₦2.2M (Under budget)\n\nFull analytics dashboard available in Marketing module.',
    time: '1 day ago',
    date: '2026-01-11 16:00',
    read: true,
    sender: 'Marketing Team',
    senderRole: 'Marketing Department',
    category: 'Marketing',
    priority: 'low',
    actionRequired: false,
    relatedTo: 'Campaign #Q4-EMAIL-2025',
  },
];

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'success' | 'warning' | 'info' | 'error'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const typeFilters: Array<typeof filterType> = ['all', 'unread', 'success', 'warning', 'info'];

  const categories = ['all', ...Array.from(new Set(notifications.map(n => n.category)))];
  
  const filteredNotifications = notifications.filter(n => {
    const matchesType = filterType === 'all' || (filterType === 'unread' ? !n.read : n.type === filterType);
    const matchesCategory = filterCategory === 'all' || n.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.sender.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-600" size={20} />;
      case 'warning': return <AlertTriangle className="text-orange-600" size={20} />;
      case 'error': return <AlertTriangle className="text-red-600" size={20} />;
      default: return <Info className="text-blue-600" size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-slate-100 text-slate-700 border-slate-300',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Notifications List */}
      <div className="w-2/5 flex flex-col">
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="text-primary-600" size={24} />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                <p className="text-sm text-slate-600">{unreadCount} unread messages</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check size={16} className="mr-2" />
                Mark All Read
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {typeFilters.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type === 'unread' && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    filterCategory !== 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Filter size={14} />
                  {filterCategory !== 'all' ? filterCategory : 'Category'}
                </button>
                {showFilterMenu && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFilterCategory(cat);
                          setShowFilterMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-600">No notifications found</p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${
                  !notification.read ? 'bg-blue-50/50 border-l-blue-500' : 'border-l-transparent'
                } ${selectedNotification?.id === notification.id ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-sm text-slate-900 ${!notification.read ? 'font-bold' : ''}`}>
                        {notification.title}
                      </h3>
                      {!notification.read ? (
                        <Mail className="text-blue-600 flex-shrink-0" size={16} />
                      ) : (
                        <MailOpen className="text-slate-400 flex-shrink-0" size={16} />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                        {notification.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {notification.time}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-400 flex-shrink-0" size={18} />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Notification Details */}
      <div className="flex-1">
        {selectedNotification ? (
          <Card className="p-6 h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(selectedNotification.type)} border-2`}>
                  {getTypeIcon(selectedNotification.type)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedNotification.title}</h2>
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityBadge(selectedNotification.priority)}`}>
                      {selectedNotification.priority.toUpperCase()} PRIORITY
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {selectedNotification.category}
                    </span>
                    {selectedNotification.actionRequired && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-300">
                        ACTION REQUIRED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{formatName(selectedNotification.sender)}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs">{formatRole(selectedNotification.senderRole)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{selectedNotification.date}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteNotification(selectedNotification.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="prose prose-sm max-w-none">
                <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Quick Summary:</p>
                  <p className="text-sm text-slate-600">{selectedNotification.message}</p>
                </div>
                
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.fullDetails}
                </div>

                {selectedNotification.relatedTo && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Related To:</p>
                    <p className="text-sm text-blue-700">{selectedNotification.relatedTo}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              {selectedNotification.actionLink && (
                <Button
                  onClick={() => {
                    const link = selectedNotification.actionLink;
                    if (!link) return;
                    if (link.startsWith('/')) {
                      navigate(link);
                      return;
                    }
                    window.open(link, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex-1"
                >
                  Take Action
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  markAsRead(selectedNotification.id);
                  setSelectedNotification(null);
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-12 h-full flex items-center justify-center">
            <div className="text-center">
              <Bell className="mx-auto text-slate-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Select a notification</h3>
              <p className="text-slate-600">Click on any notification to view full details</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
