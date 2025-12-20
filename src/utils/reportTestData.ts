/**
 * Test data generator for Enhanced Daily Reports
 * Use this to populate demo data and test report functionality
 */

export function generateTestAfterSalesData(count: number = 10) {
  const statuses = ['active', 'pending', 'completed', 'on_hold'];
  const priorities = ['Low', 'Medium', 'High'];
  const customers = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Metro Systems', 'Peak Industries'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    customerName: customers[Math.floor(Math.random() * customers.length)],
    contactPerson: `Contact ${i + 1}`,
    email: `contact${i + 1}@example.com`,
    phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    lastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    salesPerformance: Math.floor(Math.random() * 100),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    notes: `Test notes for customer ${i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateTestKPIData(count: number = 5) {
  const metrics = ['Revenue', 'Customer Satisfaction', 'Conversion Rate', 'Response Time', 'Sales Growth'];
  const trends = ['up', 'down', 'stable'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    name: metrics[i % metrics.length],
    targetValue: Math.floor(Math.random() * 100) + 50,
    actualValue: Math.floor(Math.random() * 150),
    unit: i % 2 === 0 ? '%' : 'units',
    trend: trends[Math.floor(Math.random() * trends.length)],
    category: 'Sales',
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateTestCompetitorData(count: number = 5) {
  const competitors = ['CompeteX', 'MarketLeader', 'IndustryPro', 'GlobalRival', 'TechCompete'];
  const strengths = ['Weak', 'Moderate', 'Strong'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    name: competitors[i % competitors.length],
    strength: strengths[Math.floor(Math.random() * strengths.length)],
    marketShare: Math.floor(Math.random() * 30),
    products: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => `Product ${j + 1}`),
    website: `https://${competitors[i % competitors.length].toLowerCase()}.com`,
    notes: `Competitor analysis notes ${i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateTestSalesData(count: number = 8) {
  const types = ['sales', 'marketing'];
  const statuses = ['active', 'pending', 'completed'];
  const priorities = ['Low', 'Medium', 'High'];
  const strategies = [
    'Email Campaign',
    'Social Media Marketing',
    'Direct Sales',
    'Partnership Program',
    'Content Marketing',
    'SEO Optimization',
    'Paid Advertising',
    'Event Marketing',
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    name: strategies[i % strategies.length],
    type: types[i % 2],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    description: `Strategy description for ${strategies[i % strategies.length]}`,
    startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    budget: Math.floor(Math.random() * 50000) + 10000,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateTestDebtData(count: number = 12) {
  const statuses = ['pending', 'overdue', 'paid', 'partial'];
  const customers = ['Client A', 'Client B', 'Client C', 'Client D', 'Client E'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    customerName: customers[Math.floor(Math.random() * customers.length)],
    invoiceNumber: `INV-${String(1000 + i).padStart(4, '0')}`,
    amountDue: Math.floor(Math.random() * 10000) + 1000,
    amountPaid: Math.floor(Math.random() * 5000),
    dueDate: new Date(Date.now() + (Math.random() - 0.5) * 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    email: `client${i + 1}@example.com`,
    notes: `Payment notes for invoice ${i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateTestTaskData(count: number = 15) {
  const statuses = ['assigned', 'in_progress', 'completed'];
  const priorities = ['low', 'medium', 'high'];
  const titles = [
    'Follow up with customer',
    'Prepare sales report',
    'Review competitor analysis',
    'Update marketing strategy',
    'Contact overdue accounts',
    'Analyze KPI metrics',
    'Schedule team meeting',
    'Create presentation',
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    title: titles[i % titles.length],
    description: `Task description for ${titles[i % titles.length]}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    assignedTo: Math.floor(Math.random() * 5) + 1,
    assignedBy: 1,
    assignedToName: `User ${Math.floor(Math.random() * 5) + 1}`,
    assignedByName: 'Admin User',
    dueDate: new Date(Date.now() + (Math.random() - 0.3) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateCompleteTestData() {
  return {
    afterSalesData: generateTestAfterSalesData(10),
    kpiData: generateTestKPIData(5),
    competitorsData: generateTestCompetitorData(5),
    salesData: generateTestSalesData(8),
    debtData: generateTestDebtData(12),
    tasksData: generateTestTaskData(15),
  };
}

// Helper to generate historical report data for testing
export function generateHistoricalReports(count: number = 5) {
  const periods = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() - i * 1000000,
    period: periods[Math.floor(Math.random() * periods.length)],
    createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'Test User',
    summary: {
      total: Math.floor(Math.random() * 10) + 5,
      critical: Math.floor(Math.random() * 3),
      warning: Math.floor(Math.random() * 4),
      success: Math.floor(Math.random() * 5),
      actionable: Math.floor(Math.random() * 6),
    },
  }));
}
