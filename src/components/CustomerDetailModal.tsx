import React, { useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  Calendar,
  Banknote,
  TrendingUp,
  AlertTriangle,
  FileText,
  Wrench,
  ExternalLink,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSharedData, Customer } from '@/context/SharedDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatName } from '@/lib/textFormat';

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, onClose }) => {
  const { formatCurrency } = useCurrency();
  const { getDealsByCustomer, getInvoicesByCustomer, getTicketsByCustomer } = useSharedData();
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'invoices' | 'support'>('overview');

  const customerDeals = getDealsByCustomer(customer.id);
  const customerInvoices = getInvoicesByCustomer(customer.id);
  const customerTickets = getTicketsByCustomer(customer.id);

  const totalDeals = customerDeals.length;
  const wonDeals = customerDeals.filter(d => d.stage === 'closed-won').length;
  const totalInvoices = customerInvoices.length;
  const overdueInvoices = customerInvoices.filter(i => i.status === 'overdue').length;
  const openTickets = customerTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300';
      case 'inactive': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'lead': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'closed-won': return 'bg-green-100 text-green-700';
      case 'closed-lost': return 'bg-red-100 text-red-700';
      case 'negotiation': return 'bg-orange-100 text-orange-700';
      case 'proposal': return 'bg-purple-100 text-purple-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-3xl border-2 border-white/30">
                {customer.company.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-1">{customer.company}</h2>
                <p className="text-white/90 mb-2">{formatName(customer.name)} • {customer.segment}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(customer.status)} bg-white`}>
                    {customer.status.toUpperCase()}
                  </span>
                  {customer.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-b">
          <Card className="p-4 text-center">
            <Banknote className="mx-auto text-green-600 mb-2" size={24} />
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(customer.lifetime_value)}</div>
            <div className="text-xs text-slate-600 mt-1">Lifetime Value</div>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="mx-auto text-blue-600 mb-2" size={24} />
            <div className="text-2xl font-bold text-slate-900">{totalDeals}</div>
            <div className="text-xs text-slate-600 mt-1">Total Deals ({wonDeals} Won)</div>
          </Card>
          <Card className="p-4 text-center">
            <FileText className="mx-auto text-purple-600 mb-2" size={24} />
            <div className="text-2xl font-bold text-slate-900">{totalInvoices}</div>
            <div className="text-xs text-slate-600 mt-1">Invoices ({overdueInvoices} Overdue)</div>
          </Card>
          <Card className="p-4 text-center">
            <Wrench className="mx-auto text-orange-600 mb-2" size={24} />
            <div className="text-2xl font-bold text-slate-900">{customerTickets.length}</div>
            <div className="text-xs text-slate-600 mt-1">Support Tickets ({openTickets} Open)</div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b">
          {([
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'deals', label: `Deals (${totalDeals})`, icon: TrendingUp },
            { id: 'invoices', label: `Invoices (${totalInvoices})`, icon: FileText },
            { id: 'support', label: `Support (${customerTickets.length})`, icon: Wrench },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="text-primary-600" size={20} />
                      <div>
                        <div className="text-xs text-slate-600">Email</div>
                        <div className="font-medium text-slate-900">{customer.email}</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Phone className="text-green-600" size={20} />
                      <div>
                        <div className="text-xs text-slate-600">Phone</div>
                        <div className="font-medium text-slate-900">{customer.phone}</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="text-blue-600" size={20} />
                      <div>
                        <div className="text-xs text-slate-600">Customer Since</div>
                        <div className="font-medium text-slate-900">{customer.created_date}</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="text-purple-600" size={20} />
                      <div>
                        <div className="text-xs text-slate-600">Last Contact</div>
                        <div className="font-medium text-slate-900">{customer.last_contact}</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Sales Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Sales Information</h3>
                <Card className="p-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Lead Source</div>
                      <div className="font-medium text-slate-900">{customer.lead_source || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Lead Score</div>
                      <div className="font-medium text-slate-900">{customer.lead_score || 'N/A'}/100</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Assigned Sales Rep</div>
                      <div className="font-medium text-slate-900">{customer.assigned_sales_rep || 'Unassigned'}</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Outstanding Balance Alert */}
              {customer.outstanding_balance > 0 && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <h4 className="font-bold text-red-900 mb-1">Outstanding Balance</h4>
                      <p className="text-sm text-red-700 mb-2">
                        This customer has an overdue balance of {formatCurrency(customer.outstanding_balance)}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => window.location.href = '/app/debt-collection'}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        View in Debt Collection
                        <ExternalLink size={14} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="space-y-3">
              {customerDeals.length === 0 ? (
                <Card className="p-8 text-center">
                  <TrendingUp className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="text-slate-600">No deals found for this customer</p>
                </Card>
              ) : (
                customerDeals.map((deal) => (
                  <Card key={deal.id} className="p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1">{deal.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStageColor(deal.stage)}`}>
                            {deal.stage}
                          </span>
                          <span className="text-xs text-slate-600">• {deal.sales_rep}</span>
                          <span className="text-xs text-slate-600">• Created {deal.created_date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">{formatCurrency(deal.value)}</div>
                        <div className="text-xs text-slate-600">{deal.probability}% probability</div>
                      </div>
                    </div>
                    {deal.products.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Package size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-600">{deal.products.length} product(s)</span>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-3">
              {customerInvoices.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="text-slate-600">No invoices found for this customer</p>
                </Card>
              ) : (
                customerInvoices.map((invoice) => (
                  <Card key={invoice.id} className={`p-4 ${invoice.status === 'overdue' ? 'border-red-300 bg-red-50' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1">Invoice {invoice.id}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                            invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {invoice.status}
                          </span>
                          {invoice.days_overdue && (
                            <span className="text-xs text-red-600 font-medium">
                              {invoice.days_overdue} days overdue
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">{formatCurrency(invoice.amount)}</div>
                        <div className="text-xs text-slate-600">Due: {invoice.due_date}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      {invoice.products.length} item(s) • Created {invoice.created_date}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-3">
              {customerTickets.length === 0 ? (
                <Card className="p-8 text-center">
                  <Wrench className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="text-slate-600">No support tickets found for this customer</p>
                </Card>
              ) : (
                customerTickets.map((ticket) => (
                  <Card key={ticket.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1">{ticket.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">{ticket.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 border border-red-300' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ticket.priority}
                          </span>
                          {ticket.assigned_to && (
                            <span className="text-xs text-slate-600">• Assigned to {ticket.assigned_to}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      Created {ticket.created_date}
                      {ticket.resolved_date && ` • Resolved ${ticket.resolved_date}`}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/app/sales'}
            >
              <TrendingUp size={16} className="mr-2" />
              View in Sales
            </Button>
            {customer.outstanding_balance > 0 && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/app/debt-collection'}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <AlertTriangle size={16} className="mr-2" />
                Manage Debt
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
