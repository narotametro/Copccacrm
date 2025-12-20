import { useMemo } from 'react';
import { ShoppingBag, BarChart3, TrendingUp, Target, Megaphone, DollarSign, CheckCircle2 } from 'lucide-react';

interface NotificationData {
  afterSalesData?: any[];
  kpiData?: any[];
  competitorsData?: any[];
  salesData?: any[];
  debtData?: any[];
  tasksData?: any[];
}

export function useNotifications({
  afterSalesData = [],
  kpiData = [],
  competitorsData = [],
  salesData = [],
  debtData = [],
  tasksData = [],
}: NotificationData) {
  const notifications = useMemo(() => {
    const activities: any[] = [];
    const now = new Date();
    
    // After-sales activities
    afterSalesData.forEach(item => {
      const updatedAt = new Date(item.updatedAt || item.createdAt);
      const timeDiff = now.getTime() - updatedAt.getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      
      activities.push({
        id: `aftersales-${item.id}`,
        type: 'aftersales',
        category: 'After-Sales',
        icon: ShoppingBag,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        title: `${item.customerName} - Follow-up update`,
        description: `Status: ${item.status || 'N/A'} | Product: ${item.productName || 'N/A'}`,
        details: {
          customer: item.customerName,
          product: item.productName,
          status: item.status,
          performance: `${item.salesPerformance || 0}%`,
          contactMethod: item.contactMethod,
          phone: item.contactInfo,
        },
        time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo/24)}d ago`,
        priority: item.priority === 'High' ? 'high' : item.priority === 'Medium' ? 'medium' : 'low',
        timestamp: updatedAt.getTime(),
      });
    });
    
    // KPI activities
    kpiData.forEach(item => {
      const achievement = ((item.actualValue || 0) / (item.targetValue || 1)) * 100;
      const updatedAt = new Date(item.updatedAt || item.createdAt);
      const timeDiff = now.getTime() - updatedAt.getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      
      activities.push({
        id: `kpi-${item.id}`,
        type: 'kpi',
        category: 'KPI Tracking',
        icon: BarChart3,
        color: achievement >= 100 ? 'text-green-600' : 'text-yellow-600',
        bgColor: achievement >= 100 ? 'bg-green-50' : 'bg-yellow-50',
        title: `${item.name} - ${achievement.toFixed(0)}% achieved`,
        description: `Target: ${item.targetValue} | Actual: ${item.actualValue} | ${item.unit || ''}`,
        details: {
          metric: item.name,
          target: item.targetValue,
          actual: item.actualValue,
          unit: item.unit,
          achievement: `${achievement.toFixed(1)}%`,
          period: item.period,
        },
        time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo/24)}d ago`,
        priority: achievement < 50 ? 'high' : achievement < 80 ? 'medium' : 'low',
        timestamp: updatedAt.getTime(),
      });
    });
    
    // Competitor activities
    competitorsData.forEach(item => {
      const updatedAt = new Date(item.updatedAt || item.createdAt);
      const timeDiff = now.getTime() - updatedAt.getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      
      activities.push({
        id: `competitor-${item.id}`,
        type: 'competitor',
        category: 'Competitors',
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        title: `${item.name} - Market update`,
        description: `Strength: ${item.strength} | Market Share: ${item.marketShare || 'N/A'}%`,
        details: {
          competitor: item.name,
          strength: item.strength,
          marketShare: `${item.marketShare || 0}%`,
          products: item.products?.length || 0,
          website: item.website,
        },
        time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo/24)}d ago`,
        priority: item.strength === 'Strong' ? 'high' : 'medium',
        timestamp: updatedAt.getTime(),
      });
    });
    
    // Sales & Marketing activities
    salesData.forEach(item => {
      const updatedAt = new Date(item.updatedAt || item.createdAt);
      const timeDiff = now.getTime() - updatedAt.getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      
      activities.push({
        id: `${item.type}-${item.id}`,
        type: item.type,
        category: item.type === 'sales' ? 'Sales' : 'Marketing',
        icon: item.type === 'sales' ? Target : Megaphone,
        color: item.type === 'sales' ? 'text-green-600' : 'text-orange-600',
        bgColor: item.type === 'sales' ? 'bg-green-50' : 'bg-orange-50',
        title: `${item.name} - ${item.status}`,
        description: `Priority: ${item.priority} | Target: ${item.targetAudience || 'N/A'}`,
        details: {
          strategy: item.name,
          status: item.status,
          priority: item.priority,
          type: item.type === 'sales' ? 'Sales' : 'Marketing',
          targetAudience: item.targetAudience,
          budget: item.budget,
        },
        time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo/24)}d ago`,
        priority: item.priority === 'High' ? 'high' : item.priority === 'Medium' ? 'medium' : 'low',
        timestamp: updatedAt.getTime(),
      });
    });
    
    // Debt collection activities
    debtData.forEach(item => {
      const updatedAt = new Date(item.updatedAt || item.createdAt);
      const timeDiff = now.getTime() - updatedAt.getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const dueDate = new Date(item.dueDate);
      const isOverdue = dueDate < now && item.status !== 'paid';
      
      activities.push({
        id: `debt-${item.id}`,
        type: 'debt',
        category: 'Debt Collection',
        icon: DollarSign,
        color: isOverdue ? 'text-red-600' : 'text-yellow-600',
        bgColor: isOverdue ? 'bg-red-50' : 'bg-yellow-50',
        title: `${item.customerName} - ${item.status}`,
        description: `Amount: $${item.amountDue?.toFixed(2) || '0.00'} | ${isOverdue ? 'OVERDUE' : 'Due: ' + dueDate.toLocaleDateString()}`,
        details: {
          customer: item.customerName,
          amount: `$${item.amountDue?.toFixed(2) || '0.00'}`,
          status: item.status,
          dueDate: dueDate.toLocaleDateString(),
          isOverdue: isOverdue,
          phone: item.contactInfo,
        },
        time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo/24)}d ago`,
        priority: isOverdue ? 'high' : 'medium',
        timestamp: updatedAt.getTime(),
      });
    });
    
    // Task activities
    tasksData.forEach(item => {
      const updatedAt = new Date(item.updatedAt || item.createdAt);
      const timeDiff = now.getTime() - updatedAt.getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const dueDate = new Date(item.dueDate);
      const isOverdue = dueDate < now && item.status !== 'completed';
      
      activities.push({
        id: `task-${item.id}`,
        type: 'task',
        category: 'Tasks',
        icon: CheckCircle2,
        color: item.status === 'completed' ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-blue-600',
        bgColor: item.status === 'completed' ? 'bg-green-50' : isOverdue ? 'bg-red-50' : 'bg-blue-50',
        title: `${item.title} - ${item.status}`,
        description: `Due: ${dueDate.toLocaleDateString()} | Priority: ${item.priority || 'medium'}`,
        details: {
          task: item.title,
          status: item.status,
          priority: item.priority,
          dueDate: dueDate.toLocaleDateString(),
          assignedTo: item.assignedToName || 'Unassigned',
          description: item.description,
        },
        time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo/24)}d ago`,
        priority: isOverdue ? 'high' : item.priority === 'high' ? 'high' : 'medium',
        timestamp: updatedAt.getTime(),
      });
    });
    
    // Sort by timestamp (most recent first) and limit to 50
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
  }, [afterSalesData, kpiData, competitorsData, salesData, debtData, tasksData]);
  
  return notifications;
}
