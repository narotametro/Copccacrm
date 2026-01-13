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
const demoCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'John Adebayo',
    company: 'Acme Corp',
    email: 'j.adebayo@acmecorp.ng',
    phone: '+234 803 123 4567',
    status: 'active',
    segment: 'Enterprise',
    lifetime_value: 15500000,
    outstanding_balance: 0,
    lead_source: 'Conference',
    lead_score: 95,
    assigned_sales_rep: 'Sarah Johnson',
    created_date: '2025-06-15',
    last_contact: '2026-01-10',
    tags: ['VIP', 'Enterprise', 'Manufacturing'],
  },
  {
    id: 'CUST-002',
    name: 'Jane Smith',
    company: 'GlobalTech Industries',
    email: 'j.smith@globaltech.ng',
    phone: '+234 803 234 5678',
    status: 'active',
    segment: 'Mid-Market',
    lifetime_value: 8200000,
    outstanding_balance: 0,
    lead_source: 'Email Campaign',
    lead_score: 88,
    assigned_sales_rep: 'Michael Chen',
    created_date: '2025-08-20',
    last_contact: '2026-01-09',
    tags: ['Tech', 'Growth'],
  },
  {
    id: 'CUST-003',
    name: 'David Okonkwo',
    company: 'DANGOOD Trading',
    email: 'd.okonkwo@dangood.ng',
    phone: '+234 803 345 6789',
    status: 'active',
    segment: 'SMB',
    lifetime_value: 3500000,
    outstanding_balance: 892500,
    lead_source: 'Referral',
    lead_score: 72,
    assigned_sales_rep: 'Jane Smith',
    created_date: '2025-09-10',
    last_contact: '2025-12-10',
    tags: ['Overdue', 'Trading'],
  },
];

const demoDeals: Deal[] = [
  {
    id: 'DEAL-001',
    customer_id: 'CUST-001',
    customer_name: 'Acme Corp',
    title: 'Enterprise CRM License',
    value: 15500000,
    stage: 'closed-won',
    probability: 100,
    products: ['PROD-001', 'PROD-002'],
    expected_close_date: '2026-01-10',
    sales_rep: 'Sarah Johnson',
    lead_source: 'Conference',
    competitors: ['Salesforce', 'Microsoft Dynamics'],
    created_date: '2025-11-15',
  },
  {
    id: 'DEAL-002',
    customer_id: 'CUST-002',
    customer_name: 'GlobalTech Industries',
    title: 'Cloud Migration Package',
    value: 8200000,
    stage: 'negotiation',
    probability: 75,
    products: ['PROD-001', 'PROD-003'],
    expected_close_date: '2026-02-01',
    sales_rep: 'Michael Chen',
    lead_source: 'Email Campaign',
    competitors: ['HubSpot'],
    created_date: '2025-12-01',
  },
];

const demoProducts: Product[] = [
  {
    id: 'PROD-001',
    name: 'Enterprise License',
    sku: 'ENT-LIC-2026',
    price: 12000000,
    stock: 15,
    reorder_point: 20,
    category: 'Software',
    status: 'low_stock',
    total_sold: 24,
    revenue_generated: 288000000,
  },
  {
    id: 'PROD-002',
    name: 'Implementation Services',
    sku: 'IMP-SRV-2026',
    price: 2000000,
    stock: 999,
    reorder_point: 0,
    category: 'Services',
    status: 'active',
    total_sold: 24,
    revenue_generated: 48000000,
  },
  {
    id: 'PROD-003',
    name: 'Cloud Migration Package',
    sku: 'CLD-MIG-2026',
    price: 5000000,
    stock: 45,
    reorder_point: 30,
    category: 'Services',
    status: 'active',
    total_sold: 12,
    revenue_generated: 60000000,
  },
];

const demoInvoices: Invoice[] = [
  {
    id: 'INV-001',
    customer_id: 'CUST-001',
    customer_name: 'Acme Corp',
    deal_id: 'DEAL-001',
    amount: 15500000,
    due_date: '2026-02-10',
    status: 'pending',
    products: [
      { product_id: 'PROD-001', product_name: 'Enterprise License', quantity: 1, price: 12000000 },
      { product_id: 'PROD-002', product_name: 'Implementation Services', quantity: 1, price: 2000000 },
    ],
    created_date: '2026-01-10',
  },
  {
    id: 'INV-002',
    customer_id: 'CUST-003',
    customer_name: 'DANGOOD Trading',
    amount: 892500,
    due_date: '2025-12-10',
    status: 'overdue',
    days_overdue: 33,
    products: [
      { product_id: 'PROD-002', product_name: 'Damage Compensation', quantity: 1, price: 850000 },
    ],
    created_date: '2025-11-15',
  },
];

const demoTickets: SupportTicket[] = [
  {
    id: 'TKT-001',
    customer_id: 'CUST-001',
    customer_name: 'Acme Corp',
    title: 'Setup assistance needed',
    description: 'Need help configuring enterprise features',
    status: 'in_progress',
    priority: 'high',
    assigned_to: 'Support Team',
    created_date: '2026-01-11',
    related_products: ['PROD-001'],
  },
  {
    id: 'TKT-002',
    customer_id: 'CUST-002',
    customer_name: 'GlobalTech Industries',
    title: 'Integration question',
    description: 'How to integrate with existing CRM?',
    status: 'open',
    priority: 'medium',
    assigned_to: 'Tech Support',
    created_date: '2026-01-12',
    related_products: ['PROD-003'],
  },
];

const demoLeads: Lead[] = [
  {
    id: 'LEAD-001',
    name: 'Ahmed Ibrahim',
    email: 'a.ibrahim@techstart.ng',
    company: 'TechStart Solutions',
    source: 'Website Form',
    campaign_id: 'CAMP-Q4-2025',
    score: 85,
    status: 'qualified',
    assigned_to: 'Sarah Johnson',
    created_date: '2026-01-10',
  },
  {
    id: 'LEAD-002',
    name: 'Mary Okoro',
    email: 'm.okoro@innovate.ng',
    company: 'Innovate Ltd',
    source: 'LinkedIn',
    score: 72,
    status: 'contacted',
    assigned_to: 'Michael Chen',
    created_date: '2026-01-09',
  },
];

const demoCompetitorDeals: CompetitorDeal[] = [
  {
    id: 'COMP-001',
    deal_id: 'DEAL-001',
    customer_name: 'Acme Corp',
    competitors: ['Salesforce', 'Microsoft Dynamics'],
    our_strengths: ['Manufacturing-specific features', 'Compliance certification', 'Lower TCO'],
    competitor_strengths: ['Brand recognition', 'Larger ecosystem'],
    outcome: 'won',
    win_factors: ['Compliance certification was critical', 'Better pricing', 'Local support'],
  },
  {
    id: 'COMP-002',
    deal_id: 'DEAL-002',
    customer_name: 'GlobalTech Industries',
    competitors: ['HubSpot'],
    our_strengths: ['Better scalability', 'Real-time collaboration', 'AI capabilities'],
    competitor_strengths: ['Simpler interface', 'More marketing resources'],
  },
];

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
