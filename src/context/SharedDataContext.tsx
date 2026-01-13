/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Shared data interfaces
export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'lead';
  segment: string;
  lifetime_value: number;
  outstanding_balance: number;
  lead_source?: string;
  lead_score?: number;
  assigned_sales_rep?: string;
  created_date: string;
  last_contact: string;
  tags: string[];
}

export interface Deal {
  id: string;
  customer_id: string;
  customer_name: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  products: string[];
  expected_close_date: string;
  sales_rep: string;
  lead_source?: string;
  competitors?: string[];
  created_date: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  reorder_point: number;
  category: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
  total_sold: number;
  revenue_generated: number;
}

export interface Invoice {
  id: string;
  customer_id: string;
  customer_name: string;
  deal_id?: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'overdue' | 'pending';
  days_overdue?: number;
  products: { product_id: string; product_name: string; quantity: number; price: number }[];
  created_date: string;
}

export interface SupportTicket {
  id: string;
  customer_id: string;
  customer_name: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_date: string;
  resolved_date?: string;
  related_products?: string[];
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  campaign_id?: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assigned_to?: string;
  created_date: string;
  converted_customer_id?: string;
}

export interface CompetitorDeal {
  id: string;
  deal_id: string;
  customer_name: string;
  competitors: string[];
  our_strengths: string[];
  competitor_strengths: string[];
  outcome?: 'won' | 'lost';
  win_factors?: string[];
  loss_reasons?: string[];
}

interface SharedDataContextType {
  // Data
  customers: Customer[];
  deals: Deal[];
  products: Product[];
  invoices: Invoice[];
  supportTickets: SupportTicket[];
  leads: Lead[];
  competitorDeals: CompetitorDeal[];

  // Setters
  setCustomers: (customers: Customer[]) => void;
  setDeals: (deals: Deal[]) => void;
  setProducts: (products: Product[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setSupportTickets: (tickets: SupportTicket[]) => void;
  setLeads: (leads: Lead[]) => void;
  setCompetitorDeals: (deals: CompetitorDeal[]) => void;

  // Helper functions
  getCustomerById: (id: string) => Customer | undefined;
  getDealsByCustomer: (customerId: string) => Deal[];
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  getTicketsByCustomer: (customerId: string) => SupportTicket[];
  getProductById: (id: string) => Product | undefined;
  getLeadById: (id: string) => Lead | undefined;
  convertLeadToCustomer: (leadId: string) => Customer | null;
  createDealFromLead: (leadId: string, dealData: Partial<Deal>) => Deal | null;
  getOverdueInvoices: () => Invoice[];
  getLowStockProducts: () => Product[];
  getCustomerLifetimeValue: (customerId: string) => number;
  getCompetitorDealsByDeal: (dealId: string) => CompetitorDeal | undefined;
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

// Demo data
const demoCustomers: Customer[] = [];

const demoDeals: Deal[] = [];

const demoProducts: Product[] = [];

const demoInvoices: Invoice[] = [];

const demoTickets: SupportTicket[] = [];

const demoLeads: Lead[] = [];

const demoCompetitorDeals: CompetitorDeal[] = [];

export const SharedDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers);
  const [deals, setDeals] = useState<Deal[]>(demoDeals);
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(demoTickets);
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [competitorDeals, setCompetitorDeals] = useState<CompetitorDeal[]>(demoCompetitorDeals);

  const getCustomerById = (id: string) => customers.find(c => c.id === id);
  const getDealsByCustomer = (customerId: string) => deals.filter(d => d.customer_id === customerId);
  const getInvoicesByCustomer = (customerId: string) => invoices.filter(i => i.customer_id === customerId);
  const getTicketsByCustomer = (customerId: string) => supportTickets.filter(t => t.customer_id === customerId);
  const getProductById = (id: string) => products.find(p => p.id === id);
  const getLeadById = (id: string) => leads.find(l => l.id === id);
  const getOverdueInvoices = () => invoices.filter(i => i.status === 'overdue');
  const getLowStockProducts = () => products.filter(p => p.stock <= p.reorder_point);
  const getCompetitorDealsByDeal = (dealId: string) => competitorDeals.find(cd => cd.deal_id === dealId);

  const getCustomerLifetimeValue = (customerId: string) => {
    const customerDeals = getDealsByCustomer(customerId);
    return customerDeals.reduce((sum, deal) => sum + (deal.stage === 'closed-won' ? deal.value : 0), 0);
  };

  const convertLeadToCustomer = (leadId: string): Customer | null => {
    const lead = getLeadById(leadId);
    if (!lead) return null;

    const newCustomer: Customer = {
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: '',
      status: 'active',
      segment: 'New',
      lifetime_value: 0,
      outstanding_balance: 0,
      lead_source: lead.source,
      lead_score: lead.score,
      assigned_sales_rep: lead.assigned_to,
      created_date: new Date().toISOString().split('T')[0],
      last_contact: new Date().toISOString().split('T')[0],
      tags: ['New Customer'],
    };

    setCustomers([...customers, newCustomer]);
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: 'converted', converted_customer_id: newCustomer.id } : l));
    
    return newCustomer;
  };

  const createDealFromLead = (leadId: string, dealData: Partial<Deal>): Deal | null => {
    const lead = getLeadById(leadId);
    if (!lead) return null;

    let customer = customers.find(c => c.email === lead.email);
    if (!customer) {
      customer = convertLeadToCustomer(leadId) || undefined;
    }
    if (!customer) return null;

    const newDeal: Deal = {
      id: `DEAL-${String(deals.length + 1).padStart(3, '0')}`,
      customer_id: customer.id,
      customer_name: customer.company,
      title: dealData.title || `Deal for ${customer.company}`,
      value: dealData.value || 0,
      stage: dealData.stage || 'qualified',
      probability: dealData.probability || 50,
      products: dealData.products || [],
      expected_close_date: dealData.expected_close_date || '',
      sales_rep: lead.assigned_to || '',
      lead_source: lead.source,
      created_date: new Date().toISOString().split('T')[0],
    };

    setDeals([...deals, newDeal]);
    return newDeal;
  };

  const value: SharedDataContextType = {
    customers,
    deals,
    products,
    invoices,
    supportTickets,
    leads,
    competitorDeals,
    setCustomers,
    setDeals,
    setProducts,
    setInvoices,
    setSupportTickets,
    setLeads,
    setCompetitorDeals,
    getCustomerById,
    getDealsByCustomer,
    getInvoicesByCustomer,
    getTicketsByCustomer,
    getProductById,
    getLeadById,
    convertLeadToCustomer,
    createDealFromLead,
    getOverdueInvoices,
    getLowStockProducts,
    getCustomerLifetimeValue,
    getCompetitorDealsByDeal,
  };

  return <SharedDataContext.Provider value={value}>{children}</SharedDataContext.Provider>;
};

export const useSharedData = () => {
  const context = useContext(SharedDataContext);
  if (!context) {
    throw new Error('useSharedData must be used within SharedDataProvider');
  }
  return context;
};
