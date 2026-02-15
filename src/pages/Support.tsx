import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  XCircle,
  Package,
  TrendingUp,
  Brain,
  BarChart3,
  Edit3
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useSharedData, SupportTicket } from '@/context/SharedDataContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SalesHubProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  brands?: {
    id: string;
    name: string;
  }[] | null;
  categories?: {
    id: string;
    name: string;
  }[] | null;
}

export const Support: React.FC = () => {
  const navigate = useNavigate();
  const { supportTickets, setSupportTickets } = useSharedData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [salesHubProducts, setSalesHubProducts] = useState<SalesHubProduct[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load Sales Hub products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const { data: userProfile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', userData.user.id)
          .single();

        if (!userProfile?.company_id) return;

        const { data: products } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            price,
            stock_quantity,
            brands (id, name),
            categories (id, name)
          `)
          .eq('company_id', userProfile.company_id)
          .order('name');

        if (products) {
          setSalesHubProducts(products as SalesHubProduct[]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, []);

  // Handle ticket status update
  const handleUpdateStatus = (ticketId: string, newStatus: SupportTicket['status']) => {
    const updatedTickets = supportTickets.map(ticket => {
      if (ticket.id === ticketId) {
        const updates: Partial<SupportTicket> = { status: newStatus };
        if (newStatus === 'resolved' || newStatus === 'closed') {
          updates.resolved_date = new Date().toISOString().split('T')[0];
        }
        return { ...ticket, ...updates };
      }
      return ticket;
    });
    setSupportTickets(updatedTickets);
    toast.success(`Ticket status updated to ${newStatus.replace('_', ' ')}`);
  };

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = supportTickets.length;
    const open = supportTickets.filter(t => t.status === 'open').length;
    const inProgress = supportTickets.filter(t => t.status === 'in_progress').length;
    const resolved = supportTickets.filter(t => t.status === 'resolved').length;
    const closed = supportTickets.filter(t => t.status === 'closed').length;

    // Calculate repeated issues by customer
    const customerIssues: Record<string, { count: number; tickets: typeof supportTickets }> = {};
    supportTickets.forEach(ticket => {
      if (!customerIssues[ticket.customer_id]) {
        customerIssues[ticket.customer_id] = { count: 0, tickets: [] };
      }
      customerIssues[ticket.customer_id].count++;
      customerIssues[ticket.customer_id].tickets.push(ticket);
    });

    // Calculate repeated issues by product (if product field exists)
    const productIssues: Record<string, { count: number; tickets: typeof supportTickets }> = {};
    supportTickets.forEach(ticket => {
      if (ticket.related_products && ticket.related_products.length > 0) {
        ticket.related_products.forEach(product => {
          if (!productIssues[product]) {
            productIssues[product] = { count: 0, tickets: [] };
          }
          productIssues[product].count++;
          productIssues[product].tickets.push(ticket);
        });
      }
    });

    // Find customers with most issues
    const topCustomerIssues = Object.entries(customerIssues)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([, data]) => ({
        customer_name: data.tickets[0]?.customer_name || 'Unknown',
        count: data.count
      }));

    // Find products with most issues
    const topProductIssues = Object.entries(productIssues)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([product, data]) => ({
        product,
        count: data.count
      }));

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      customerIssues,
      productIssues,
      topCustomerIssues,
      topProductIssues
    };
  }, [supportTickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return supportTickets.filter(ticket => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.customer_name.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.id.toLowerCase().includes(searchLower) ||
        (ticket.related_products && ticket.related_products.some(p => p.toLowerCase().includes(searchLower)));

      // Status filter
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [supportTickets, searchTerm, statusFilter, priorityFilter]);

  // AI Insights
  const aiInsights = useMemo(() => {
    const insights = [];

    // High priority tickets needing attention
    const urgentTickets = supportTickets.filter(t => t.priority === 'urgent' && t.status === 'open');
    if (urgentTickets.length > 0) {
      insights.push({
        type: 'urgent',
        title: `${urgentTickets.length} Urgent Ticket${urgentTickets.length > 1 ? 's' : ''} Need Immediate Attention`,
        description: 'These tickets require immediate action to prevent customer dissatisfaction.',
        action: 'Review Now',
        priority: 'high'
      });
    }

    // Repeated customer issues
    const repeatedCustomers = analytics.topCustomerIssues.filter(c => c.count >= 3);
    if (repeatedCustomers.length > 0) {
      insights.push({
        type: 'pattern',
        title: `${repeatedCustomers.length} Customer${repeatedCustomers.length > 1 ? 's Have' : ' Has'} Multiple Issues`,
        description: `${repeatedCustomers[0].customer_name} has ${repeatedCustomers[0].count} tickets. Consider proactive outreach.`,
        action: 'View Details',
        priority: 'medium'
      });
    }

    // Product quality concerns
    if (analytics.topProductIssues.length > 0 && analytics.topProductIssues[0].count >= 3) {
      insights.push({
        type: 'quality',
        title: `Product Quality Alert: ${analytics.topProductIssues[0].product}`,
        description: `${analytics.topProductIssues[0].count} tickets related to this product. May indicate a quality issue.`,
        action: 'Investigate',
        priority: 'high'
      });
    }

    // Response time improvement
    const oldOpenTickets = supportTickets.filter(t => {
      if (t.status !== 'open') return false;
      const created = new Date(t.created_date);
      const daysSince = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 7;
    });
    if (oldOpenTickets.length > 0) {
      insights.push({
        type: 'response',
        title: `${oldOpenTickets.length} Ticket${oldOpenTickets.length > 1 ? 's' : ''} Open for Over 7 Days`,
        description: 'Long response times can negatively impact customer satisfaction.',
        action: 'Prioritize',
        priority: 'medium'
      });
    }

    // Success metrics
    const resolutionRate = analytics.total > 0 ? ((analytics.resolved + analytics.closed) / analytics.total * 100).toFixed(1) : 0;
    if (parseFloat(resolutionRate as string) >= 80) {
      insights.push({
        type: 'success',
        title: `Excellent Resolution Rate: ${resolutionRate}%`,
        description: 'Your team is doing a great job resolving customer issues.',
        action: 'Keep It Up',
        priority: 'low'
      });
    }

    return insights;
  }, [supportTickets, analytics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={() => navigate('/app/customers')}
        >
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-600 mt-1">Manage and track all customer support requests</p>
        </div>

      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Tickets</p>
              <p className="text-2xl font-bold text-slate-900">{analytics.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Open</p>
              <p className="text-2xl font-bold text-slate-900">{analytics.open}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-slate-900">{analytics.inProgress}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Resolved</p>
              <p className="text-2xl font-bold text-slate-900">{analytics.resolved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <XCircle className="text-slate-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Closed</p>
              <p className="text-2xl font-bold text-slate-900">{analytics.closed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-primary-600" size={24} />
            <h2 className="text-lg font-semibold text-slate-900">AI Insights & Recommendations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'high' ? 'bg-red-50 border-red-500' :
                  insight.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-green-50 border-green-500'
                }`}
              >
                <h3 className="font-semibold text-slate-900 mb-1">{insight.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{insight.description}</p>
                <Button size="sm" variant="outline">
                  {insight.action}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Repeated Issues Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers with Issues */}
        {analytics.topCustomerIssues.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="text-orange-600" size={24} />
              <h2 className="text-lg font-semibold text-slate-900">Customers with Most Issues</h2>
            </div>
            <div className="space-y-3">
              {analytics.topCustomerIssues.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-red-100 text-red-700' :
                      index === 1 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-slate-900">{customer.customer_name}</span>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-slate-700">
                    {customer.count} ticket{customer.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Products with Issues */}
        {analytics.topProductIssues.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="text-red-600" size={24} />
              <h2 className="text-lg font-semibold text-slate-900">Products with Most Issues</h2>
            </div>
            <div className="space-y-3">
              {analytics.topProductIssues.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-red-100 text-red-700' :
                      index === 1 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-slate-900">{product.product}</span>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-slate-700">
                    {product.count} issue{product.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by customer, product, SKU, or ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="mx-auto mb-4 opacity-20" size={64} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tickets Found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first support ticket to get started'}
            </p>
            <Button icon={Plus} onClick={() => navigate('/app/customers')}>
              Create Ticket
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing {filteredTickets.length} of {supportTickets.length} ticket{supportTickets.length !== 1 ? 's' : ''}
              </p>
            </div>
            {filteredTickets.map((ticket) => {
              // Calculate customer issue count
              const customerTicketCount = analytics.customerIssues[ticket.customer_id]?.count || 0;
              const isRepeatCustomer = customerTicketCount > 1;

              // Calculate product issue count
              const productIssueCounts = ticket.related_products?.map(product => ({
                product,
                count: analytics.productIssues[product]?.count || 0
              })) || [];

              return (
                <Card key={ticket.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{ticket.title}</h3>
                        {isRepeatCustomer && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            Repeat Customer ({customerTicketCount} tickets)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{ticket.customer_name}</p>
                      <p className="text-slate-700 mb-3">{ticket.description}</p>
                      
                      {/* Show related products */}
                      {ticket.related_products && ticket.related_products.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-slate-600 mb-1">Related Products:</p>
                          <div className="flex flex-wrap gap-2">
                            {ticket.related_products.map((productString, idx) => {
                              const productCount = productIssueCounts.find(p => p.product === productString)?.count || 0;
                              
                              // Try to parse product info from string
                              const skuMatch = productString.match(/SKU:\s*([^)]+)/);
                              const sku = skuMatch ? skuMatch[1].trim() : '';
                              
                              // Find matching product from Sales Hub
                              const salesHubProduct = sku ? salesHubProducts.find(p => p.sku === sku) : null;
                              
                              return (
                                <div
                                  key={idx}
                                  className={`px-3 py-2 text-xs rounded-lg border ${
                                    productCount > 1
                                      ? 'bg-red-50 border-red-200 text-red-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Package size={14} className="text-slate-500" />
                                    <div>
                                      <p className="font-medium">
                                        {salesHubProduct?.name || productString.split('(')[0].trim()}
                                      </p>
                                      {sku && (
                                        <p className="text-slate-600">SKU: {sku}</p>
                                      )}
                                      {salesHubProduct?.brands && salesHubProduct.brands.length > 0 && (
                                        <p className="text-slate-600">Brand: {salesHubProduct.brands[0].name}</p>
                                      )}
                                      {productCount > 1 && (
                                        <p className="font-bold text-red-600 mt-1">
                                          ⚠️ {productCount} issues reported
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>ID: {ticket.id}</span>
                        <span>Created: {ticket.created_date}</span>
                        {ticket.resolved_date && <span>Resolved: {ticket.resolved_date}</span>}
                        {ticket.assigned_to && <span>Assigned to: {ticket.assigned_to}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {/* Status Dropdown */}
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateStatus(ticket.id, e.target.value as SupportTicket['status'])}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border-2 cursor-pointer ${
                          ticket.status === 'open' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-300' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="open">OPEN</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="resolved">RESOLVED</option>
                        <option value="closed">CLOSED</option>
                      </select>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Edit3}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Edit Ticket Modal */}
      {selectedTicket && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTicket(null);
          }}
          title="Edit Support Ticket"
          size="lg"
        >
          <div className="space-y-4">
            {/* Ticket Info */}
            <Card className="border-l-4 border-blue-500 bg-blue-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Ticket ID</p>
                  <p className="text-sm text-blue-900 font-semibold">{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Customer</p>
                  <p className="text-sm text-blue-900 font-semibold">{selectedTicket.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Created</p>
                  <p className="text-sm text-blue-900">{selectedTicket.created_date}</p>
                </div>
                {selectedTicket.resolved_date && (
                  <div>
                    <p className="text-xs text-blue-700 font-medium">Resolved</p>
                    <p className="text-sm text-blue-900">{selectedTicket.resolved_date}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
              <p className="text-slate-900 font-semibold">{selectedTicket.title}</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <p className="text-slate-700 p-3 bg-slate-50 rounded-lg">{selectedTicket.description}</p>
            </div>

            {/* Related Products */}
            {selectedTicket.related_products && selectedTicket.related_products.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Related Products</label>
                <div className="space-y-2">
                  {selectedTicket.related_products.map((productString, idx) => {
                    const skuMatch = productString.match(/SKU:\s*([^)]+)/);
                    const sku = skuMatch ? skuMatch[1].trim() : '';
                    const salesHubProduct = sku ? salesHubProducts.find(p => p.sku === sku) : null;
                    
                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start gap-3">
                          <Package className="text-slate-500 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {salesHubProduct?.name || productString.split('(')[0].trim()}
                            </p>
                            {sku && (
                              <p className="text-sm text-slate-600">SKU: {sku}</p>
                            )}
                            {salesHubProduct?.brands && salesHubProduct.brands.length > 0 && (
                              <p className="text-sm text-slate-600">Brand: {salesHubProduct.brands[0].name}</p>
                            )}
                            {salesHubProduct?.categories && salesHubProduct.categories.length > 0 && (
                              <p className="text-sm text-slate-600">Category: {salesHubProduct.categories[0].name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => {
                    handleUpdateStatus(selectedTicket.id, e.target.value as SupportTicket['status']);
                    setSelectedTicket({ ...selectedTicket, status: e.target.value as SupportTicket['status'] });
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  value={selectedTicket.priority}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-700"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Assigned To */}
            {selectedTicket.assigned_to && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assigned To</label>
                <p className="text-slate-900">{selectedTicket.assigned_to}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTicket(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Support;
