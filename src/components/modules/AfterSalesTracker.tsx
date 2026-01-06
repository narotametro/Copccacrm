import { ShoppingBag, TrendingUp, Package, DollarSign, Shield, Phone, Mail, Plus, Minus, Search, AlertCircle, CheckCircle2, Tag, Percent, Pencil, Trash2, X, User, MapPin, Upload, Download, Calendar, RefreshCw, FileText, Filter, ChevronLeft, ChevronRight, Star, Award, ThumbsUp, Bot, MessageSquare, PhoneCall, Zap, Play, Pause } from 'lucide-react';
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { StatCard } from './shared/StatCard';
import { SearchInput } from './shared/SearchInput';
import { PageHeader } from './shared/PageHeader';
import { useAfterSales, useDebtCollection } from '../lib/use-data';
import { UserViewBanner } from './shared/UserViewBanner';
import { useAuth } from '../lib/auth-context';
import { DataModeBanner } from './DataModeBanner';
import { useCurrency } from '../lib/currency-context';
import { toast } from 'sonner@2.0.3';
import { PerformanceDataForm } from './PerformanceDataForm';
import { formatName } from '../lib/utils';
import { AIAgentsModal } from './AIAgentsModal';
import { SkeletonLoader } from './shared/SkeletonLoader';
import { CountrySelector } from './CountrySelector';

export const AfterSalesTracker = memo(function AfterSalesTracker() {
  const { records, loading, create, update, remove } = useAfterSales();
  const { records: debtRecords } = useDebtCollection();
  const { selectedUserId, user } = useAuth();
  const { currency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);
  const [showAssignCategoryModal, setShowAssignCategoryModal] = useState(false);
  const [customerToAssign, setCustomerToAssign] = useState<any | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<any | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  // Ref to prevent infinite loop in auto-selection
  const hasAutoSelectedRef = useRef(false);
  const lastRecordsLengthRef = useRef(0);
  
  const [newCustomer, setNewCustomer] = useState({
    customer: '',
    contacts: [{ name: '', phone: '', phoneCountryCode: '+1', email: '', whatsapp: '', whatsappCountryCode: '+1' }],
    city: '',
    address: '',
  });
  const [performanceEntry, setPerformanceEntry] = useState({
    category: '',
    value: '',
    customCategoryName: '',
    products: [{ name: '', quantity: '' }],
    revenueTimeline: '1-month',
    // New fields for enhanced data entry
    pricingProducts: [{ product: '', unitPrice: '' }],
    revenueMonths: [{ month: '', revenue: '' }],
    lastOrderProducts: [{ product: '', quantity: '' }],
    priceProtectionProducts: [{ product: '', quantity: '', unitPrice: '' }],
    returnProducts: [{ product: '', quantity: '', problem: '' }],
    salesCycleDuration: '',
    salesCycleUnit: 'days',
    customValues: [{ value: '' }],
  });
  const [editingPerformanceId, setEditingPerformanceId] = useState<string | null>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [customDataCategories, setCustomDataCategories] = useState<Array<{id: string, label: string}>>([]);
  const [newFilterCategory, setNewFilterCategory] = useState({
    id: '',
    label: '',
    color: 'bg-purple-100 text-purple-700',
  });
  const [customFilterCategories, setCustomFilterCategories] = useState<Array<{id: string, label: string, color: string}>>([]);
  const [currentStatPage, setCurrentStatPage] = useState(0);
  const [showAIAgentsModal, setShowAIAgentsModal] = useState(false);
  const [aiAgents, setAiAgents] = useState<Array<{
    id: string;
    name: string;
    status: 'active' | 'paused';
    channel: 'voice' | 'sms' | 'whatsapp';
    targetPerformance: string;
    schedule: string;
    message: string;
    createdAt: string;
  }>>([
    {
      id: '1',
      name: 'At-Risk Customer Recovery',
      status: 'active',
      channel: 'whatsapp',
      targetPerformance: 'needsAttention',
      schedule: 'Weekly on Monday',
      message: 'Hi {customer}, we noticed you haven\'t ordered in a while. How can we help improve our service?',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Star Customer Appreciation',
      status: 'active',
      channel: 'voice',
      targetPerformance: 'star',
      schedule: 'Monthly on 1st',
      message: 'Thank you for being a valued customer! We appreciate your continued partnership.',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [showDeleteAgentModal, setShowDeleteAgentModal] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<any | null>(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    channel: 'whatsapp' as 'voice' | 'sms' | 'whatsapp',
    targetPerformance: 'needsAttention',
    schedule: 'Weekly',
    message: '',
  });

  const isViewingOtherUser = selectedUserId && selectedUserId !== user?.id;

  // Generate AI-driven description based on data insights
  const generateAIDescription = () => {
    const totalCustomers = records.length;
    const starCount = performanceCounts.star;
    const needsAttention = performanceCounts.needsAttention;
    
    if (totalCustomers === 0) {
      return "Start building stronger customer relationships by adding your first customer";
    }
    
    if (starCount > totalCustomers * 0.3) {
      return `Outstanding performance! ${starCount} star customers are driving exceptional growth. Monitor service quality, inventory, and competitive pricing to maintain excellence`;
    }
    
    if (needsAttention > totalCustomers * 0.2) {
      return `${needsAttention} customers need immediate attention. Focus on improving service quality, resolving product issues, and competitive pricing strategies`;
    }
    
    return "Track customer revenue, service satisfaction, and strengthen after-sales relationships";
  };

  // Calculate AI-based sales performance percentage
  const calculateSalesPerformance = (customer: any, allCustomers: any[]) => {
    // Get customer's total revenue
    const revenueData = customer.performanceData?.revenueGenerated || [];
    const revenueArray = Array.isArray(revenueData) ? revenueData : [revenueData];
    
    let customerTotalRevenue = 0;
    revenueArray.forEach((entry: any) => {
      if (entry.months) {
        entry.months.forEach((m: any) => {
          if (m.revenue && m.revenue.trim()) {
            customerTotalRevenue += parseFloat(m.revenue) || 0;
          }
        });
      }
    });

    // Calculate all customers' revenues
    const allRevenues = allCustomers.map(c => {
      const revData = c.performanceData?.revenueGenerated || [];
      const revArray = Array.isArray(revData) ? revData : [revData];
      let total = 0;
      revArray.forEach((entry: any) => {
        if (entry.months) {
          entry.months.forEach((m: any) => {
            if (m.revenue && m.revenue.trim()) {
              total += parseFloat(m.revenue) || 0;
            }
          });
        }
      });
      return total;
    }).filter(r => r > 0);

    if (allRevenues.length === 0 || customerTotalRevenue === 0) {
      return 50; // Default middle value if no data
    }

    // Calculate percentile rank
    const lowerRevenues = allRevenues.filter(r => r < customerTotalRevenue).length;
    const percentile = (lowerRevenues / allRevenues.length) * 100;

    return Math.round(percentile);
  };

  // Performance categories for filtering
  const performanceCategories = [
    { id: 'star', label: 'Star Performer', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-700' },
    { id: 'good', label: 'Good', color: 'bg-blue-100 text-blue-700' },
    { id: 'average', label: 'Average', color: 'bg-gray-100 text-gray-700' },
    { id: 'needs-attention', label: 'Needs Attention', color: 'bg-red-100 text-red-700' },
    ...customFilterCategories,
  ];

  // Performance data categories (excluding salesPerformance as it's AI-calculated)
  const performanceDataCategories = [
    { id: 'serviceRating', label: 'Service Rating', icon: CheckCircle2 },
    { id: 'productAvailable', label: 'Product Available', icon: Package },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'returnInformation', label: 'Return Information', icon: RefreshCw },
    { id: 'revenueGenerated', label: 'Revenue Generated', icon: Tag },
    { id: 'priceProtection', label: 'Price Protection', icon: Shield },
    { id: 'offer', label: 'Offer', icon: Percent },
    { id: 'averageSalesCycle', label: 'Average Sales Cycle', icon: Calendar },
    { id: 'lastOrder', label: 'Last Order', icon: FileText },
    ...customDataCategories.map(cat => ({ ...cat, icon: Tag })),
  ];

  // Calculate stats from real data
  const avgSalesPerformance = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.salesPerformance || 0), 0) / records.length)
    : 0;
  
  const avgServiceRating = records.length > 0
    ? (records.reduce((sum, r) => sum + (r.serviceRating || 0), 0) / records.length).toFixed(1)
    : '0.0';
  
  const priceProtectionCount = records.filter(r => r.performanceData?.priceProtection).length;

  // Performance category counts
  const performanceCounts = {
    star: records.filter(r => r.performanceCategory === 'star').length,
    excellent: records.filter(r => r.performanceCategory === 'excellent').length,
    good: records.filter(r => r.performanceCategory === 'good').length,
    average: records.filter(r => r.performanceCategory === 'average').length,
    needsAttention: records.filter(r => r.performanceCategory === 'needs-attention').length,
  };

  // Calculate average sales cycle overall and by category
  const calculateAvgSalesCycle = (customerRecords: any[]) => {
    const cycles = customerRecords
      .map(r => r.performanceData?.averageSalesCycle)
      .filter(c => c && !isNaN(parseInt(c)))
      .map(c => parseInt(c));
    return cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 0;
  };

  const avgSalesCycle = calculateAvgSalesCycle(records);
  const salesCycleByCategory = {
    star: calculateAvgSalesCycle(records.filter(r => r.performanceCategory === 'star')),
    excellent: calculateAvgSalesCycle(records.filter(r => r.performanceCategory === 'excellent')),
    good: calculateAvgSalesCycle(records.filter(r => r.performanceCategory === 'good')),
    average: calculateAvgSalesCycle(records.filter(r => r.performanceCategory === 'average')),
    needsAttention: calculateAvgSalesCycle(records.filter(r => r.performanceCategory === 'needs-attention')),
  };

  const stats = [
    {
      label: 'Total Active Customers',
      value: records.length.toString(),
      icon: ShoppingBag,
      color: 'bg-pink-500',
    },
    {
      label: 'Star Performers',
      value: performanceCounts.star.toString(),
      icon: Star,
      color: 'bg-yellow-500',
    },
    {
      label: 'Excellent Performance',
      value: performanceCounts.excellent.toString(),
      icon: Award,
      color: 'bg-green-500',
    },
    {
      label: 'Good Performance',
      value: performanceCounts.good.toString(),
      icon: ThumbsUp,
      color: 'bg-blue-500',
    },
    {
      label: 'Average Performance',
      value: performanceCounts.average.toString(),
      icon: CheckCircle2,
      color: 'bg-gray-500',
    },
    {
      label: 'Needs Attention',
      value: performanceCounts.needsAttention.toString(),
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  // Get unique cities from customers
  const uniqueCities = Array.from(new Set(records.filter(r => r.city).map(r => r.city))).sort();

  // Get unique performance categories that are actually used
  const usedPerformanceCategories = Array.from(
    new Set(records.filter(r => r.performanceCategory).map(r => r.performanceCategory))
  );

  // Helper function to calculate total revenue for a customer
  const getCustomerTotalRevenue = (customer: any) => {
    const revenueData = customer.performanceData?.revenueGenerated || [];
    const revenueArray = Array.isArray(revenueData) ? revenueData : [revenueData];
    let total = 0;
    revenueArray.forEach((entry: any) => {
      if (entry.months) {
        entry.months.forEach((m: any) => {
          if (m.revenue && m.revenue.trim()) {
            total += parseFloat(m.revenue) || 0;
          }
        });
      }
    });
    return total;
  };

  // Filtered records sorted by revenue (high to low) - Memoized to prevent infinite loops
  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        const matchesSearch = searchQuery === '' ||
          record.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.contacts?.some((c: any) => 
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          record.city?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCity = filterCity === 'all' || record.city === filterCity;
        const matchesPerformance = filterPerformance === 'all' || record.performanceCategory === filterPerformance;
        
        return matchesSearch && matchesCity && matchesPerformance;
      })
      .sort((a, b) => {
        // Sort by total revenue, highest to lowest
        const revenueA = getCustomerTotalRevenue(a);
        const revenueB = getCustomerTotalRevenue(b);
        return revenueB - revenueA;
      });
  }, [records, searchQuery, filterCity, filterPerformance]);

  // Debug: Log records changes and reset auto-select flag when user changes
  useEffect(() => {
    console.log('📋 [AfterSalesTracker] Records updated:', {
      totalRecords: records.length,
      selectedUserId,
      isViewingOtherUser,
      isAdmin: user?.role === 'admin',
      viewingAllMembers: user?.role === 'admin' && !selectedUserId,
      customers: records.map(r => ({ 
        id: r.id, 
        name: r.customer,
        _userId: r._userId, 
        _userName: r._userName 
      }))
    });
    
    // Reset auto-select flag when user changes so we can auto-select new top performer
    hasAutoSelectedRef.current = false;
  }, [records, selectedUserId, user]);

  // Auto-select top performer (first customer) when user changes or data loads
  useEffect(() => {
    // Only auto-select if:
    // 1. Records have changed (new data loaded)
    // 2. We haven't already auto-selected for this dataset
    const recordsChanged = records.length !== lastRecordsLengthRef.current;
    
    if (filteredRecords.length > 0 && (recordsChanged || !hasAutoSelectedRef.current)) {
      // Always select the top performer (first record, sorted by revenue)
      const topPerformer = filteredRecords[0];
      const revenue = getCustomerTotalRevenue(topPerformer);
      console.log('🏆 Auto-selecting TOP PERFORMER:', {
        customer: topPerformer.customer,
        revenue,
        userId: topPerformer._userId,
        userName: topPerformer._userName
      });
      setSelectedCustomer(topPerformer);
      hasAutoSelectedRef.current = true;
      lastRecordsLengthRef.current = records.length;
      
      // Show a subtle notification for user context (only on initial load, not on user changes)
      if (selectedUserId && topPerformer._userName && recordsChanged) {
        toast.success(`Top Performer: ${formatName(topPerformer.customer)} (${formatName(topPerformer._userName)})`, {
          duration: 2000,
          icon: '🏆'
        });
      }
    } else if (filteredRecords.length === 0) {
      console.log('📭 No customers found, clearing selection');
      setSelectedCustomer(null);
      hasAutoSelectedRef.current = false;
    }
  }, [filteredRecords, selectedUserId]); // Now safe to depend on filteredRecords since it's memoized

  // Sync selected customer with updated records data (e.g., after editing)
  useEffect(() => {
    if (selectedCustomer) {
      const updatedCustomer = records.find(r => r.id === selectedCustomer.id);
      if (updatedCustomer && JSON.stringify(updatedCustomer) !== JSON.stringify(selectedCustomer)) {
        console.log('🔄 Syncing selected customer with updated data:', updatedCustomer.customer);
        setSelectedCustomer(updatedCustomer);
      } else if (!updatedCustomer) {
        // Customer was deleted, clear selection (will trigger auto-select of top performer)
        console.log('❌ Selected customer no longer exists, clearing selection');
        setSelectedCustomer(null);
      }
    }
  }, [records]);

  // Filter customers by search query in dropdown
  const customerSearchResults = filteredRecords.filter(customer =>
    customer.customer.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (customer.city && customer.city.toLowerCase().includes(customerSearchQuery.toLowerCase()))
  );

  const handleAddCustomer = async () => {
    if (!newCustomer.customer) {
      toast.error('Business name is required');
      return;
    }

    const validContacts = newCustomer.contacts.filter(c => c.name && c.phone);
    if (validContacts.length === 0) {
      toast.error('At least one contact person with name and phone number is required');
      return;
    }

    try {
      // Process phone numbers: remove leading zero and add country code
      const processedContacts = validContacts.map(contact => {
        // Process phone number
        let cleanPhone = contact.phone.replace(/\D/g, ''); // Remove non-digits
        if (cleanPhone.startsWith('0')) {
          cleanPhone = cleanPhone.substring(1); // Remove leading zero
        }
        const phoneCountryCode = contact.phoneCountryCode || '+1';
        const fullPhone = `${phoneCountryCode}${cleanPhone}`;

        // Process WhatsApp number
        let fullWhatsApp = contact.whatsapp || '';
        if (fullWhatsApp) {
          let cleanWhatsApp = fullWhatsApp.replace(/\D/g, '');
          if (cleanWhatsApp.startsWith('0')) {
            cleanWhatsApp = cleanWhatsApp.substring(1); // Remove leading zero
          }
          const whatsappCountryCode = contact.whatsappCountryCode || '+1';
          fullWhatsApp = `${whatsappCountryCode}${cleanWhatsApp}`;
        }

        return {
          ...contact,
          phone: fullPhone,
          whatsapp: fullWhatsApp,
        };
      });

      const customerData = {
        customer: newCustomer.customer,
        contacts: processedContacts,
        city: newCustomer.city,
        address: newCustomer.address,
        salesPerformance: 0,
        serviceRating: 3,
        lastOrder: new Date().toISOString().split('T')[0],
        products: [],
        issues: 0,
        status: 'good',
        performanceCategory: 'average',
        performanceData: {},
      };
      
      await create(customerData);
      
      setShowAddModal(false);
      setNewCustomer({ 
        customer: '', 
        contacts: [{ name: '', phone: '', phoneCountryCode: '+1', email: '', whatsapp: '', whatsappCountryCode: '+1' }],
        city: '',
        address: '',
      });
      toast.success('Customer added successfully');
    } catch (error) {
      console.error('Failed to add customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const handleEditCustomer = async () => {
    if (!editingRecord || !newCustomer.customer) {
      toast.error('Business name is required');
      return;
    }

    const validContacts = newCustomer.contacts.filter(c => c.name && c.phone);
    if (validContacts.length === 0) {
      toast.error('At least one contact person with name and phone number is required');
      return;
    }

    try {
      // Process phone numbers: remove leading zero and add country code
      const processedContacts = validContacts.map(contact => {
        // Process phone number
        let cleanPhone = contact.phone.replace(/\D/g, ''); // Remove non-digits
        if (cleanPhone.startsWith('0')) {
          cleanPhone = cleanPhone.substring(1); // Remove leading zero
        }
        const phoneCountryCode = contact.phoneCountryCode || '+1';
        const fullPhone = `${phoneCountryCode}${cleanPhone}`;

        // Process WhatsApp number
        let fullWhatsApp = contact.whatsapp || '';
        if (fullWhatsApp) {
          let cleanWhatsApp = fullWhatsApp.replace(/\D/g, '');
          if (cleanWhatsApp.startsWith('0')) {
            cleanWhatsApp = cleanWhatsApp.substring(1); // Remove leading zero
          }
          const whatsappCountryCode = contact.whatsappCountryCode || '+1';
          fullWhatsApp = `${whatsappCountryCode}${cleanWhatsApp}`;
        }

        return {
          ...contact,
          phone: fullPhone,
          whatsapp: fullWhatsApp,
        };
      });

      await update(editingRecord.id, {
        customer: newCustomer.customer,
        contacts: processedContacts,
        city: newCustomer.city,
        address: newCustomer.address,
      });
      setShowEditModal(false);
      setEditingRecord(null);
      setNewCustomer({ 
        customer: '', 
        contacts: [{ name: '', phone: '', email: '', whatsapp: '' }],
        city: '',
        address: '',
      });
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingRecord) return;

    try {
      await remove(deletingRecord.id);
      setShowDeleteModal(false);
      setDeletingRecord(null);
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const addContactField = () => {
    setNewCustomer({
      ...newCustomer,
      contacts: [...newCustomer.contacts, { name: '', phone: '', phoneCountryCode: '+1', email: '', whatsapp: '', whatsappCountryCode: '+1' }]
    });
  };

  const removeContactField = (index: number) => {
    if (newCustomer.contacts.length > 1) {
      setNewCustomer({
        ...newCustomer,
        contacts: newCustomer.contacts.filter((_, i) => i !== index)
      });
    }
  };

  const updateContactField = (index: number, field: string, value: string) => {
    const updatedContacts = [...newCustomer.contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setNewCustomer({
      ...newCustomer,
      contacts: updatedContacts
    });
  };

  // Helper functions for managing product arrays in performance entry
  const addProductField = (field: 'products' | 'pricingProducts' | 'lastOrderProducts' | 'priceProtectionProducts' | 'returnProducts') => {
    const defaultValues = {
      products: { name: '', quantity: '' },
      pricingProducts: { product: '', unitPrice: '' },
      lastOrderProducts: { product: '', quantity: '' },
      priceProtectionProducts: { product: '', quantity: '', unitPrice: '' },
      returnProducts: { product: '', quantity: '', problem: '' },
    };
    setPerformanceEntry({
      ...performanceEntry,
      [field]: [...performanceEntry[field], defaultValues[field]]
    });
  };

  const removeProductField = (field: 'products' | 'pricingProducts' | 'lastOrderProducts' | 'priceProtectionProducts' | 'returnProducts', index: number) => {
    if (performanceEntry[field].length > 1) {
      setPerformanceEntry({
        ...performanceEntry,
        [field]: performanceEntry[field].filter((_: any, i: number) => i !== index)
      });
    }
  };

  const updateProductField = (arrayField: string, index: number, field: string, value: string) => {
    const updated = [...(performanceEntry as any)[arrayField]];
    updated[index] = { ...updated[index], [field]: value };
    setPerformanceEntry({
      ...performanceEntry,
      [arrayField]: updated
    });
  };

  const getDefaultPerformanceEntry = () => ({
    category: '',
    value: '',
    customCategoryName: '',
    products: [{ name: '', quantity: '' }],
    revenueTimeline: '1-month',
    pricingProducts: [{ product: '', unitPrice: '' }],
    revenueMonths: [{ month: '', revenue: '' }],
    lastOrderProducts: [{ product: '', quantity: '' }],
    priceProtectionProducts: [{ product: '', quantity: '', unitPrice: '' }],
    returnProducts: [{ product: '', quantity: '', problem: '' }],
    salesCycleDuration: '',
    salesCycleUnit: 'days',
    customValues: [{ value: '' }],
  });

  const handleEditPerformanceEntry = (category: string, entry: any) => {
    setEditingPerformanceId(entry.id);
    
    // Prepare the form based on category
    const baseEntry = getDefaultPerformanceEntry();
    baseEntry.category = category;

    // Populate with existing data
    switch (category) {
      case 'productAvailable':
        baseEntry.products = entry.products || [{ name: '', quantity: '' }];
        break;
      case 'pricing':
        baseEntry.pricingProducts = entry.products || [{ product: '', unitPrice: '' }];
        break;
      case 'revenueGenerated':
        baseEntry.revenueMonths = entry.months || baseEntry.revenueMonths;
        break;
      case 'lastOrder':
        baseEntry.lastOrderProducts = entry.products || [{ product: '', quantity: '' }];
        break;
      case 'priceProtection':
        baseEntry.priceProtectionProducts = entry.products || [{ product: '', quantity: '', unitPrice: '' }];
        break;
      case 'returnInformation':
        baseEntry.returnProducts = entry.products || [{ product: '', quantity: '', problem: '' }];
        break;
      case 'averageSalesCycle':
        baseEntry.salesCycleDuration = entry.duration || '';
        baseEntry.salesCycleUnit = entry.unit || 'days';
        break;
      default:
        // Handle custom categories with multiple values
        if (entry.values) {
          baseEntry.customValues = entry.values;
        } else {
          baseEntry.value = entry.value || '';
        }
        break;
    }

    setPerformanceEntry(baseEntry);
    setShowPerformanceModal(true);
  };

  const handleDeletePerformanceEntry = async (category: string, entryId: string) => {
    if (!selectedCustomer) return;
    
    try {
      const existingEntries = selectedCustomer.performanceData?.[category] || [];
      const entriesArray = Array.isArray(existingEntries) ? existingEntries : [existingEntries];
      const updatedEntries = entriesArray.filter((entry: any) => entry.id !== entryId);
      
      const updatedPerformanceData = {
        ...(selectedCustomer.performanceData || {}),
        [category]: updatedEntries,
      };

      const updatedCustomer = await update(selectedCustomer.id, {
        performanceData: updatedPerformanceData,
      });

      setSelectedCustomer(updatedCustomer);
      toast.success('Entry deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete entry:', error);
      toast.error(`Failed to delete entry: ${error.message || 'Unknown error'}`);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const customers: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 2) continue;

      const customer: any = {
        customer: '',
        contacts: [],
        city: '',
        address: '',
        salesPerformance: 0,
        serviceRating: 3,
        lastOrder: new Date().toISOString().split('T')[0],
        products: [],
        issues: 0,
        status: 'good',
        performanceCategory: 'average',
        performanceData: {},
      };

      headers.forEach((header, idx) => {
        const value = values[idx] || '';
        
        if (header.includes('business') || header.includes('company') || header.includes('name')) {
          customer.customer = value;
        } else if (header.includes('contact') && header.includes('name')) {
          if (!customer.contacts[0]) customer.contacts[0] = { name: '', phone: '', email: '', whatsapp: '' };
          customer.contacts[0].name = value;
        } else if (header.includes('phone')) {
          if (!customer.contacts[0]) customer.contacts[0] = { name: '', phone: '', email: '', whatsapp: '' };
          customer.contacts[0].phone = value;
        } else if (header.includes('email')) {
          if (!customer.contacts[0]) customer.contacts[0] = { name: '', phone: '', email: '', whatsapp: '' };
          customer.contacts[0].email = value;
        } else if (header.includes('whatsapp')) {
          if (!customer.contacts[0]) customer.contacts[0] = { name: '', phone: '', email: '', whatsapp: '' };
          customer.contacts[0].whatsapp = value;
        } else if (header.includes('city') || header.includes('town')) {
          customer.city = value;
        } else if (header.includes('address')) {
          customer.address = value;
        }
      });

      if (customer.contacts.length === 0) {
        customer.contacts = [{ name: '', phone: '', email: '' }];
      }

      if (customer.customer) {
        customers.push(customer);
      }
    }

    return customers;
  };

  const handleImportCustomers = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      const text = await importFile.text();
      const customers = parseCSV(text);

      if (customers.length === 0) {
        toast.error('No valid customers found in the file. Please check the format.');
        setImporting(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const customer of customers) {
        try {
          await create(customer);
          successCount++;
        } catch (error) {
          console.error('Failed to import customer:', customer.customer, error);
          failCount++;
        }
      }

      if (failCount === 0) {
        toast.success(`Successfully imported ${successCount} customer${successCount > 1 ? 's' : ''}!`);
      } else {
        toast.warning(`Import completed: ${successCount} succeeded, ${failCount} failed`);
      }
      
      setShowImportModal(false);
      setImportFile(null);
    } catch (error) {
      console.error('Failed to import customers:', error);
      toast.error('Failed to import customers. Please check the file format.');
    } finally {
      setImporting(false);
    }
  };

  const handleAddPerformanceData = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    // Validate based on category type - no value required for salesPerformance (AI calculated)
    if (performanceEntry.category === 'salesPerformance') {
      toast.error('Sales Performance is automatically calculated by AI based on revenue data. Please add revenue data instead.');
      return;
    }
    
    if (performanceEntry.category === 'productAvailable') {
      const hasValidProduct = performanceEntry.products.some(p => p.name.trim() && p.quantity.trim());
      if (!hasValidProduct) {
        toast.error('Please add at least one product with name and quantity');
        return;
      }
    } else if (performanceEntry.category === 'revenueGenerated') {
      // Revenue is handled by the form
    } else if (!performanceEntry.value && performanceEntry.category !== 'customize') {
      // For other categories, value might be needed
    }

    // Handle custom category
    if (performanceEntry.category === 'customize') {
      if (!performanceEntry.customCategoryName.trim()) {
        toast.error('Please enter a custom category name');
        return;
      }

      const validValues = performanceEntry.customValues.filter((v: any) => v.value.trim());
      if (validValues.length === 0) {
        toast.error('Please add at least one value');
        return;
      }
      
      const customId = performanceEntry.customCategoryName.toLowerCase().replace(/\s+/g, '_');
      
      // Add to custom categories if not exists
      if (!customDataCategories.find(c => c.id === customId)) {
        setCustomDataCategories([...customDataCategories, {
          id: customId,
          label: performanceEntry.customCategoryName,
        }]);
      }

      try {
        // Get existing entries or create new array
        const timestamp = new Date().toISOString();
        const entryId = editingPerformanceId || `entry_${Date.now()}`;
        
        const existingEntries = selectedCustomer.performanceData?.[customId] || [];
        const entriesArray = Array.isArray(existingEntries) ? existingEntries : (existingEntries ? [existingEntries] : []);
        
        const valueToSave: any = { values: validValues, timestamp, id: entryId };

        let updatedEntries;
        if (editingPerformanceId) {
          updatedEntries = entriesArray.map((entry: any) => 
            entry.id === editingPerformanceId ? valueToSave : entry
          );
        } else {
          updatedEntries = [...entriesArray, valueToSave];
        }

        const updatedPerformanceData = {
          ...(selectedCustomer.performanceData || {}),
          [customId]: updatedEntries,
        };

        console.log('Saving custom category data:', { customId, updatedEntries });

        const updatedCustomer = await update(selectedCustomer.id, {
          performanceData: updatedPerformanceData,
        });

        // Instant update
        setSelectedCustomer(updatedCustomer);
        setPerformanceEntry(getDefaultPerformanceEntry());
        setEditingPerformanceId(null);
        setShowPerformanceModal(false);
        toast.success('Performance data added successfully');
      } catch (error) {
        console.error('Failed to add performance data:', error);
        toast.error('Failed to add performance data');
      }
    } else {
      if (!performanceEntry.category) {
        toast.error('Please select a category');
        return;
      }

      try {
        let valueToSave: any = {};
        const timestamp = new Date().toISOString();
        const entryId = editingPerformanceId || `entry_${Date.now()}`;

        // Validate and prepare data based on category
        switch (performanceEntry.category) {
          case 'productAvailable':
            const validProducts = performanceEntry.products.filter(p => p.name.trim() && p.quantity.trim());
            if (validProducts.length === 0) {
              toast.error('Please add at least one product with name and quantity');
              return;
            }
            valueToSave = { products: validProducts, timestamp };
            break;

          case 'pricing':
            const validPricing = performanceEntry.pricingProducts.filter(p => p.product.trim() && p.unitPrice.trim());
            if (validPricing.length === 0) {
              toast.error('Please add at least one product with unit price');
              return;
            }
            valueToSave = { products: validPricing, timestamp };
            break;

          case 'revenueGenerated':
            const validRevenue = performanceEntry.revenueMonths.filter(m => m.month.trim() && m.revenue.trim());
            if (validRevenue.length === 0) {
              toast.error('Please select a month and enter revenue');
              return;
            }
            // Calculate total revenue
            const totalRevenue = validRevenue.reduce((sum, m) => sum + (parseFloat(m.revenue) || 0), 0);
            valueToSave = { months: validRevenue, total: totalRevenue, timestamp };
            break;

          case 'lastOrder':
            const validLastOrder = performanceEntry.lastOrderProducts.filter(p => p.product.trim() && p.quantity.trim());
            if (validLastOrder.length === 0) {
              toast.error('Please add at least one product with quantity');
              return;
            }
            valueToSave = { products: validLastOrder, timestamp };
            break;

          case 'priceProtection':
            const validProtection = performanceEntry.priceProtectionProducts.filter(p => 
              p.product.trim() && p.quantity.trim() && p.unitPrice.trim()
            );
            if (validProtection.length === 0) {
              toast.error('Please add at least one product with quantity and unit price');
              return;
            }
            const totalProtected = validProtection.reduce((sum, p) => 
              sum + (parseFloat(p.quantity) * parseFloat(p.unitPrice)), 0
            );
            valueToSave = { products: validProtection, total: totalProtected, timestamp };
            break;

          case 'returnInformation':
            const validReturns = performanceEntry.returnProducts.filter(p => 
              p.product.trim() && p.quantity.trim() && p.problem.trim()
            );
            if (validReturns.length === 0) {
              toast.error('Please add at least one product with quantity and problem');
              return;
            }
            valueToSave = { products: validReturns, timestamp };
            break;

          case 'averageSalesCycle':
            if (!performanceEntry.salesCycleDuration.trim()) {
              toast.error('Please enter sales cycle duration');
              return;
            }
            valueToSave = { 
              duration: performanceEntry.salesCycleDuration, 
              unit: performanceEntry.salesCycleUnit,
              timestamp 
            };
            break;

          default:
            if (!performanceEntry.value.trim()) {
              toast.error('Please fill in all fields');
              return;
            }
            valueToSave = { value: performanceEntry.value, timestamp };
            break;
        }

        const categoryKey = performanceEntry.category;
        const existingEntries = selectedCustomer.performanceData?.[categoryKey] || [];
        const entriesArray = Array.isArray(existingEntries) ? existingEntries : (existingEntries ? [existingEntries] : []);
        
        let updatedEntries;
        if (editingPerformanceId) {
          updatedEntries = entriesArray.map((entry: any) => 
            entry.id === editingPerformanceId ? { ...valueToSave, id: entryId } : entry
          );
        } else {
          updatedEntries = [...entriesArray, { ...valueToSave, id: entryId }];
        }

        const updatedPerformanceData = {
          ...(selectedCustomer.performanceData || {}),
          [categoryKey]: updatedEntries,
        };

        console.log('Saving performance data:', { categoryKey, updatedEntries });

        // Calculate AI-based sales performance if revenue was updated
        let salesPerformanceUpdate: any = {};
        if (performanceEntry.category === 'revenueGenerated') {
          const tempCustomer = { 
            ...selectedCustomer, 
            performanceData: updatedPerformanceData 
          };
          const newSalesPerformance = calculateSalesPerformance(tempCustomer, records);
          salesPerformanceUpdate = { salesPerformance: newSalesPerformance };
        }

        // Save to database and immediately update UI
        const updatedCustomer = await update(selectedCustomer.id, {
          performanceData: updatedPerformanceData,
          ...salesPerformanceUpdate,
        });

        // Instant UI update
        setSelectedCustomer(updatedCustomer);
        setPerformanceEntry(getDefaultPerformanceEntry());
        setEditingPerformanceId(null);
        setShowPerformanceModal(false);
        toast.success(editingPerformanceId ? 'Performance data updated successfully' : 'Performance data added successfully');
      } catch (error: any) {
        console.error('Failed to save performance data:', error);
        toast.error(`Failed to save performance data: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleAddFilterCategory = () => {
    if (!newFilterCategory.label.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const categoryId = newFilterCategory.label.toLowerCase().replace(/\s+/g, '-');
    
    if (performanceCategories.find(c => c.id === categoryId)) {
      toast.error('This category already exists');
      return;
    }

    setCustomFilterCategories([...customFilterCategories, {
      id: categoryId,
      label: newFilterCategory.label,
      color: newFilterCategory.color,
    }]);

    setNewFilterCategory({ id: '', label: '', color: 'bg-purple-100 text-purple-700' });
    toast.success('Category added successfully');
  };

  const handleDeleteFilterCategory = (categoryId: string) => {
    setCustomFilterCategories(customFilterCategories.filter(c => c.id !== categoryId));
    toast.success('Category removed');
  };

  const handleAssignPerformanceCategory = async (categoryId: string) => {
    if (!customerToAssign) {
      toast.error('No customer selected');
      return;
    }

    try {
      console.log('Assigning performance category:', {
        customerId: customerToAssign.id,
        categoryId,
        customerName: customerToAssign.customer
      });
      
      const updatedCustomer = await update(customerToAssign.id, {
        performanceCategory: categoryId,
      });
      
      console.log('Performance category assigned successfully:', updatedCustomer);
      
      // Update selected customer if it's the same one
      if (selectedCustomer?.id === customerToAssign.id) {
        setSelectedCustomer(updatedCustomer);
      }
      
      setShowAssignCategoryModal(false);
      setCustomerToAssign(null);
      toast.success('Performance category assigned successfully');
    } catch (error: any) {
      console.error('Failed to assign category:', {
        error: error.message,
        stack: error.stack,
        customerId: customerToAssign.id,
        categoryId
      });
      toast.error(`Failed to assign category: ${error.message || 'Unknown error'}`);
    }
  };

  const getPerformanceCategoryBadge = (category: string) => {
    const cat = performanceCategories.find(c => c.id === category);
    return cat || performanceCategories[3]; // Default to 'average'
  };

  return (
    <div className="p-8 space-y-6">
      {/* Data Mode Banner - shows which data is being viewed */}
      <DataModeBanner recordCount={records.length} entityName="customers" />
      
      <PageHeader 
        title="After-Sales Follow-up"
        description={generateAIDescription()}
        actionLabel="Add Customer"
        onAction={() => setShowAddModal(true)}
        actions={
          !isViewingOtherUser && (
            <div className="relative">
              <button
                onClick={() => setShowImportMenu(!showImportMenu)}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                </div>
              </button>
              
              {showImportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowImportMenu(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <button
                      onClick={() => {
                        setShowAIAgentsModal(true);
                        setShowImportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-t-lg"
                    >
                      <Bot size={18} className="text-purple-600" />
                      <span>AI Follow-up Agents</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowImportModal(true);
                        setShowImportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Upload size={18} className="text-blue-600" />
                      <span>Import Customers</span>
                    </button>
                    <a
                      href="data:text/csv;charset=utf-8,Business Name,Contact Name,Phone Number,Email,WhatsApp,Town/City,Physical Address%0AExample Corp,John Doe,+1234567890,john@example.com,+1234567890,New York,123 Main St"
                      download="customer_import_template.csv"
                      onClick={() => setShowImportMenu(false)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-b-lg block"
                    >
                      <Download size={18} className="text-green-600" />
                      <span>Download Template</span>
                    </a>
                  </div>
                </>
              )}
            </div>
          )
        }
      />

      {/* Stats Grid - Small Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.color} rounded-lg p-4 shadow-md`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className="text-white" />
              </div>
              <div className="text-2xl mb-1 text-white">{stat.value}</div>
              <div className="text-xs text-white/90">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* All Customers Button */}
        <div className="relative">
          <button
            onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-pink-300 transition-all flex items-center gap-2"
          >
            <User size={18} className="text-gray-400" />
            <span className="text-gray-700">All Customers ({filteredRecords.length})</span>
            <ChevronRight size={18} className={`text-gray-400 transition-transform ${showCustomerDropdown ? 'rotate-90' : ''}`} />
          </button>

          {/* Customer Dropdown */}
          {showCustomerDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowCustomerDropdown(false)}
              ></div>
              <div className="absolute top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 flex flex-col">
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Search customers..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Customer List */}
                <div className="overflow-y-auto flex-1">
                  {customerSearchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No customers found
                    </div>
                  ) : (
                    customerSearchResults.map((customer) => {
                      const categoryBadge = getPerformanceCategoryBadge(customer.performanceCategory || 'average');
                      const isSelected = selectedCustomer?.id === customer.id;
                      return (
                        <div
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerDropdown(false);
                            setCustomerSearchQuery('');
                          }}
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                            isSelected ? 'bg-pink-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{formatName(customer.customer)}</h4>
                              {/* Show team member name when viewing all members */}
                              {!selectedUserId && customer._userName && (
                                <p className="text-xs text-purple-600 flex items-center gap-1 mt-0.5">
                                  <User size={10} />
                                  {formatName(customer._userName)}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${categoryBadge.color}`}>
                              {categoryBadge.label}
                            </span>
                          </div>
                          {customer.city && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin size={12} />
                              {formatName(customer.city)}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* City Filter */}
        <div className="relative">
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none bg-white"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Performance Filter with Manage Button */}
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={filterPerformance}
              onChange={(e) => setFilterPerformance(e.target.value)}
              className="px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none bg-white"
            >
              <option value="all">All Performance</option>
              {usedPerformanceCategories.map((category) => {
                const cat = getPerformanceCategoryBadge(category);
                return <option key={category} value={category}>{cat.label}</option>;
              })}
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {!isViewingOtherUser && (
            <button
              onClick={() => setShowCategoryManagerModal(true)}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
              title="Manage Categories"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      {/* User View Banner */}
      {isViewingOtherUser && <UserViewBanner />}

      {/* Loading State - Show skeleton instead of overlay */}
      {loading ? (
        <div className="p-6">
          <SkeletonLoader />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
          {isViewingOtherUser ? (
            <>
              <p className="mb-2">This user has no customers yet</p>
              <p className="text-sm">They haven't added any customer records</p>
            </>
          ) : searchQuery || filterCity !== 'all' || filterPerformance !== 'all' ? (
            <>
              <p className="mb-2">No customers found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </>
          ) : (
            <>
              <p className="mb-2">No customers yet</p>
              <p className="text-sm">Click "Add Customer" to get started</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected Customer Card */}
          {selectedCustomer && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white shadow-md">
                    {formatName(selectedCustomer.customer).charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{formatName(selectedCustomer.customer)}</h3>
                      {/* Top Performer Badge - shown when this is the first (top revenue) customer */}
                      {filteredRecords[0]?.id === selectedCustomer.id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm">
                          <Star size={12} className="fill-white" />
                          TOP PERFORMER
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {/* Show team member name when viewing all members */}
                      {!selectedUserId && selectedCustomer._userName && (
                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                          <User size={14} />
                          {formatName(selectedCustomer._userName)}
                        </span>
                      )}
                      {!selectedUserId && selectedCustomer._userName && selectedCustomer.city && <span>•</span>}
                      {selectedCustomer.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {formatName(selectedCustomer.city)}
                        </span>
                      )}
                      {selectedCustomer.contacts && selectedCustomer.contacts.length > 0 && (
                        <span>• {selectedCustomer.contacts.length} contact{selectedCustomer.contacts.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {/* Empty State - No Customer Selected */}
          {!selectedCustomer && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={48} className="text-pink-400" />
              </div>
              <h3 className="text-xl text-gray-700 mb-2">Select a Customer</h3>
              <p className="text-sm text-gray-500 mb-4">Click the "All Customers" button at the top to choose a customer</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-lg text-sm">
                <User size={16} />
                <span>All Customers</span>
              </div>
            </div>
          )}

          {/* Customer Details */}
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Contact Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl mb-3">Contact Information</h2>
                    <div className="space-y-3">
                      {selectedCustomer.contacts && selectedCustomer.contacts.length > 0 ? (
                        selectedCustomer.contacts.map((contact: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <span className="flex items-center gap-2">
                              <User size={16} />
                              <span className="font-medium">{formatName(contact.name)}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <Phone size={16} />
                              {contact.phone}
                            </span>
                            {contact.email && (
                              <span className="flex items-center gap-2">
                                <Mail size={16} />
                                {contact.email}
                              </span>
                            )}
                            {contact.whatsapp && (
                              <span className="flex items-center gap-2">
                                <MessageSquare size={16} />
                                {contact.whatsapp}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No contact information available</p>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <MapPin size={16} />
                          <span>{formatName(selectedCustomer.address)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isViewingOtherUser && (
                      <>
                        <button
                          onClick={() => {
                            setEditingRecord(selectedCustomer);
                            setNewCustomer({
                              customer: selectedCustomer.customer || '',
                              contacts: selectedCustomer.contacts || [{ name: '', phone: '', email: '' }],
                              city: selectedCustomer.city || '',
                              address: selectedCustomer.address || '',
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                        >
                          <Pencil size={18} className="text-gray-400 group-hover:text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingRecord(selectedCustomer);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        >
                          <Trash2 size={18} className="text-gray-400 group-hover:text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* AI-Calculated Sales Performance Display */}
              {(() => {
                const currentPerformance = calculateSalesPerformance(selectedCustomer, records);
                const hasRevenueData = selectedCustomer.performanceData?.revenueGenerated && 
                  (Array.isArray(selectedCustomer.performanceData.revenueGenerated) 
                    ? selectedCustomer.performanceData.revenueGenerated.length > 0 
                    : true);
                
                if (!hasRevenueData) return null;

                // Calculate total revenue for display
                const revenueData = selectedCustomer.performanceData?.revenueGenerated || [];
                const revenueArray = Array.isArray(revenueData) ? revenueData : [revenueData];
                let totalRevenue = 0;
                revenueArray.forEach((entry: any) => {
                  if (entry.months) {
                    entry.months.forEach((m: any) => {
                      if (m.revenue && m.revenue.trim()) {
                        totalRevenue += parseFloat(m.revenue) || 0;
                      }
                    });
                  }
                });

                // Get debt collection data for this customer
                const customerDebt = debtRecords.find(d => 
                  d.customer?.toLowerCase() === selectedCustomer.customer?.toLowerCase()
                );
                const pendingPayment = customerDebt?.amount || 0;

                // Analyze products from last order
                const lastOrderData = selectedCustomer.performanceData?.lastOrder || [];
                const lastOrderArray = Array.isArray(lastOrderData) ? lastOrderData : [lastOrderData];
                const productAnalysis: { [key: string]: number } = {};
                
                lastOrderArray.forEach((entry: any) => {
                  if (entry.products) {
                    entry.products.forEach((p: any) => {
                      const productName = p.product || p.name;
                      const qty = parseFloat(p.quantity) || 0;
                      if (productName) {
                        productAnalysis[productName] = (productAnalysis[productName] || 0) + qty;
                      }
                    });
                  }
                });

                const topProduct = Object.entries(productAnalysis)
                  .sort(([, a], [, b]) => b - a)[0];

                // Determine performance tier
                const getPerformanceTier = (percentage: number) => {
                  if (percentage >= 90) return { label: 'Star Performer', color: 'from-yellow-400 to-amber-500', textColor: 'text-yellow-900', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
                  if (percentage >= 75) return { label: 'Excellent', color: 'from-green-400 to-emerald-500', textColor: 'text-green-900', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
                  if (percentage >= 50) return { label: 'Good', color: 'from-blue-400 to-cyan-500', textColor: 'text-blue-900', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
                  if (percentage >= 25) return { label: 'Average', color: 'from-gray-400 to-slate-500', textColor: 'text-gray-900', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
                  return { label: 'Needs Attention', color: 'from-red-400 to-rose-500', textColor: 'text-red-900', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
                };

                const tier = getPerformanceTier(currentPerformance);

                return (
                  <div className={`bg-gradient-to-br ${tier.color} rounded-xl p-8 shadow-xl border-2 ${tier.borderColor}`}>
                    {/* Main Performance Section */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-white">
                        <div className="flex items-center gap-3 mb-3">
                          <TrendingUp size={28} className="drop-shadow-md" />
                          <h3 className="text-2xl drop-shadow-md font-bold">Sales Performance</h3>
                        </div>
                        <div className="flex items-end gap-6">
                          <div>
                            <div className="text-6xl drop-shadow-lg mb-2 font-bold">{currentPerformance}%</div>
                            <div className="text-sm text-white/90 drop-shadow-sm font-semibold">Percentile Rank</div>
                          </div>
                          <div className={`${tier.bgColor} ${tier.textColor} px-5 py-3 rounded-xl shadow-lg mb-2`}>
                            <div className="text-xs opacity-75 font-semibold">Performance Tier</div>
                            <div className="text-xl font-bold">{tier.label}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-white space-y-4">
                        <div>
                          <div className="text-sm text-white/90 mb-1 drop-shadow-sm font-semibold">Total Revenue</div>
                          <div className="text-4xl drop-shadow-lg font-bold">{currency} {totalRevenue.toLocaleString()}</div>
                        </div>
                        {pendingPayment > 0 && (
                          <div>
                            <div className="text-sm text-white/90 mb-1 drop-shadow-sm font-semibold">Pending Payment</div>
                            <div className="text-2xl drop-shadow-lg font-bold text-red-200">{currency} {pendingPayment.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* AI Insights Section */}
                    <div className="space-y-3 pt-6 border-t border-white/20">
                      {/* Performance Insight */}
                      <div className="text-sm text-white/95 flex items-start gap-2 font-semibold">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>
                          {currentPerformance >= 75 && "This customer is a top performer! Consider offering premium services or loyalty rewards."}
                          {currentPerformance >= 50 && currentPerformance < 75 && "This customer is performing well. Focus on maintaining the relationship and identifying upsell opportunities."}
                          {currentPerformance >= 25 && currentPerformance < 50 && "This customer has average performance. Look for ways to increase engagement and order frequency."}
                          {currentPerformance < 25 && "This customer needs immediate attention. Schedule a follow-up call to identify issues and re-engage them."}
                        </span>
                      </div>
                      
                      {/* Product Insights */}
                      {topProduct && (
                        <div className="text-sm text-white/95 flex items-start gap-2 font-semibold">
                          <Package size={16} className="mt-0.5 flex-shrink-0" />
                          <span>
                            Top Product: <span className="font-bold">{topProduct[0]}</span> ({topProduct[1]} units ordered)
                            {Object.keys(productAnalysis).length > 1 && ` - ${Object.keys(productAnalysis).length} different products purchased`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Sales Performance Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg">Sales Performance</h3>
                  {!isViewingOtherUser && (
                    <button
                      onClick={() => setShowPerformanceModal(true)}
                      className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Data
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Show all categories that have data */}
                  {performanceDataCategories.map((category) => {
                    const Icon = category.icon;
                    const rawValue = selectedCustomer.performanceData?.[category.id];
                    
                    if (!rawValue) return null;

                    // Convert to array format
                    const entries = Array.isArray(rawValue) ? rawValue : [rawValue];
                    
                    // Choose gradient color based on category
                    const categoryColors: { [key: string]: string } = {
                      'serviceRating': 'from-green-50 to-emerald-50 border-green-200',
                      'productAvailable': 'from-blue-50 to-cyan-50 border-blue-200',
                      'pricing': 'from-purple-50 to-violet-50 border-purple-200',
                      'returnInformation': 'from-red-50 to-rose-50 border-red-200',
                      'revenueGenerated': 'from-yellow-50 to-amber-50 border-yellow-200',
                      'priceProtection': 'from-indigo-50 to-blue-50 border-indigo-200',
                      'offer': 'from-pink-50 to-rose-50 border-pink-200',
                      'averageSalesCycle': 'from-teal-50 to-cyan-50 border-teal-200',
                      'lastOrder': 'from-orange-50 to-amber-50 border-orange-200',
                    };
                    
                    const bgClass = categoryColors[category.id] || 'from-gray-50 to-slate-50 border-gray-200';
                    
                    return (
                      <div key={category.id} className={`p-5 bg-gradient-to-br ${bgClass} rounded-xl border-2 shadow-sm`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Icon size={20} className="text-gray-700" />
                          </div>
                          <span className="font-bold text-gray-800">{category.label}</span>
                        </div>
                        
                        <div className="space-y-3">
                          {entries.map((entry: any, index: number) => {
                            const timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : null;
                            
                            // Check if entry has actual content before rendering
                            const hasContent = 
                              (category.id === 'productAvailable' && entry.products?.length > 0) ||
                              (category.id === 'pricing' && entry.products?.length > 0) ||
                              (category.id === 'revenueGenerated' && entry.months?.length > 0) ||
                              (category.id === 'lastOrder' && entry.products?.length > 0) ||
                              (category.id === 'priceProtection' && entry.products?.length > 0) ||
                              (category.id === 'returnInformation' && entry.products?.length > 0) ||
                              (category.id === 'averageSalesCycle' && entry.duration) ||
                              (!['productAvailable', 'pricing', 'revenueGenerated', 'lastOrder', 'priceProtection', 'returnInformation', 'averageSalesCycle'].includes(category.id) && (entry.values || entry.value || entry));
                            
                            // Skip rendering if there's no content
                            if (!hasContent) return null;
                            
                            return (
                              <div key={index} className="p-4 bg-white rounded-lg border-2 border-gray-100 shadow-sm">
                                {/* Timestamp and Edit Button - Only show if there's content */}
                                {(timestamp || (!isViewingOtherUser && entry.id)) && (
                                  <div className="flex items-center justify-between mb-2">
                                    {timestamp && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {timestamp}
                                      </span>
                                    )}
                                    {!isViewingOtherUser && entry.id && (
                                      <div className="flex gap-1 ml-auto">
                                        <button
                                          onClick={() => handleEditPerformanceEntry(category.id, entry)}
                                          className="p-1 hover:bg-blue-50 rounded transition-colors group"
                                          title="Edit"
                                        >
                                          <Pencil size={14} className="text-gray-400 group-hover:text-blue-600" />
                                        </button>
                                        <button
                                          onClick={() => handleDeletePerformanceEntry(category.id, entry.id)}
                                          className="p-1 hover:bg-red-50 rounded transition-colors group"
                                          title="Delete"
                                        >
                                          <Trash2 size={14} className="text-gray-400 group-hover:text-red-600" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Entry Content */}
                                {category.id === 'productAvailable' && entry.products && (
                                  <div className="space-y-2">
                                    {entry.products.map((p: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                                        <span className="font-bold text-gray-800">{p.name}</span>
                                        <span className="text-sm font-semibold text-blue-700">Qty: {p.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {category.id === 'pricing' && entry.products && (
                                  <div className="space-y-2">
                                    {entry.products.map((p: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between bg-purple-50 p-2 rounded-lg">
                                        <span className="font-bold text-gray-800">{p.product}</span>
                                        <span className="text-sm font-bold text-purple-700">{currency} {p.unitPrice}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {category.id === 'revenueGenerated' && entry.months && (
                                  <>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                      {entry.months.filter((m: any) => m.revenue).map((m: any, i: number) => (
                                        <div key={i} className="bg-yellow-50 p-2 rounded-lg">
                                          <div className="text-xs text-gray-600 font-semibold">{m.month}</div>
                                          <div className="text-sm font-bold text-gray-900">{currency} {parseFloat(m.revenue).toLocaleString()}</div>
                                        </div>
                                      ))}
                                    </div>
                                    {entry.total && (
                                      <div className="mt-3 p-3 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg border-2 border-yellow-300">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-gray-800">Total Revenue:</span>
                                          <span className="text-xl font-bold text-amber-700">{currency} {entry.total.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}

                                {category.id === 'lastOrder' && entry.products && (
                                  <div className="space-y-2">
                                    {entry.products.map((p: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between bg-orange-50 p-2 rounded-lg">
                                        <span className="font-bold text-gray-800">{p.product}</span>
                                        <span className="text-sm font-semibold text-orange-700">Qty: {p.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {category.id === 'priceProtection' && entry.products && (
                                  <div className="space-y-2">
                                    {entry.products.map((p: any, i: number) => (
                                      <div key={i} className="bg-indigo-50 p-2 rounded-lg">
                                        <div className="font-bold text-gray-800">{p.product}</div>
                                        <div className="text-sm font-semibold text-indigo-700">{p.quantity} units @ {currency} {p.unitPrice}</div>
                                      </div>
                                    ))}
                                    {entry.total && (
                                      <div className="mt-2 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border-2 border-indigo-300">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-gray-800">Total Protected:</span>
                                          <span className="text-lg font-bold text-indigo-700">{currency} {entry.total.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {category.id === 'returnInformation' && entry.products && (
                                  <div className="space-y-3">
                                    {entry.products.map((p: any, i: number) => (
                                      <div key={i} className="bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                                        <div className="font-bold text-gray-800 mb-1">{p.product} - Qty: {p.quantity}</div>
                                        <div className="text-sm text-gray-700"><span className="font-semibold">Issue:</span> {p.problem}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {category.id === 'averageSalesCycle' && entry.duration && (
                                  <div className="bg-teal-50 p-3 rounded-lg">
                                    <span className="text-2xl font-bold text-teal-700">{entry.duration}</span>
                                    <span className="ml-2 text-sm font-semibold text-gray-700">{entry.unit}</span>
                                  </div>
                                )}

                                {/* Default display for other categories */}
                                {!['productAvailable', 'pricing', 'revenueGenerated', 'lastOrder', 'priceProtection', 'returnInformation', 'averageSalesCycle'].includes(category.id) && (
                                  <div className="space-y-2">
                                    {entry.values ? (
                                      entry.values.map((v: any, i: number) => (
                                        <div key={i} className="bg-gray-50 p-2 rounded-lg">
                                          <span className="font-semibold text-gray-800">• {v.value}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="bg-gray-50 p-2 rounded-lg font-semibold text-gray-800">
                                        {entry.value || String(entry)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {Object.keys(selectedCustomer.performanceData || {}).length === 0 && 
                 !selectedCustomer.salesPerformance && 
                 !selectedCustomer.serviceRating && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No performance data available. Click "Add Data" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddEditCustomerModal
          title="Add New Customer"
          customer={newCustomer}
          onCustomerChange={setNewCustomer}
          onSubmit={handleAddCustomer}
          onClose={() => setShowAddModal(false)}
          addContactField={addContactField}
          removeContactField={removeContactField}
          updateContactField={updateContactField}
        />
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <AddEditCustomerModal
          title="Edit Customer"
          customer={newCustomer}
          onCustomerChange={setNewCustomer}
          onSubmit={handleEditCustomer}
          onClose={() => setShowEditModal(false)}
          addContactField={addContactField}
          removeContactField={removeContactField}
          updateContactField={updateContactField}
          isEdit
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg mb-1">Delete Customer</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete {deletingRecord?.customer}? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Import Customers</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload a CSV file with customer information. Download the template for the correct format.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFile}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="cursor-pointer text-sm text-pink-500 hover:text-pink-600"
                >
                  {importFile ? importFile.name : 'Choose a CSV file'}
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImportCustomers}
                  disabled={!importFile || importing}
                  className="flex-1 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Performance Data Modal */}
      {showPerformanceModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">{editingPerformanceId ? 'Edit Performance Data' : 'Add Performance Data'}</h3>
              <button
                onClick={() => {
                  setShowPerformanceModal(false);
                  setPerformanceEntry(getDefaultPerformanceEntry());
                  setEditingPerformanceId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Category</label>
                <select
                  value={performanceEntry.category}
                  onChange={(e) => setPerformanceEntry({ ...performanceEntry, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select a category...</option>
                  {performanceDataCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                  <option value="customize">Customize (Add New Category)</option>
                </select>
              </div>
              
              {performanceEntry.category === 'customize' && (
                <div>
                  <label className="block text-sm mb-2">Custom Category Name</label>
                  <input
                    type="text"
                    value={performanceEntry.customCategoryName}
                    onChange={(e) => setPerformanceEntry({ ...performanceEntry, customCategoryName: e.target.value })}
                    placeholder="e.g., Customer Loyalty Score"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              {/* Use PerformanceDataForm for specialized categories */}
              {performanceEntry.category && performanceEntry.category !== 'customize' && (
                <PerformanceDataForm
                  performanceEntry={performanceEntry}
                  setPerformanceEntry={setPerformanceEntry}
                  category={performanceEntry.category}
                />
              )}

              {/* Multiple values input for customize */}
              {performanceEntry.category === 'customize' && (
                <div>
                  <label className="block text-sm mb-2">Values</label>
                  {performanceEntry.customValues.map((item: any, index: number) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => {
                          const updated = [...performanceEntry.customValues];
                          updated[index] = { value: e.target.value };
                          setPerformanceEntry({ ...performanceEntry, customValues: updated });
                        }}
                        placeholder="Enter value..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      {performanceEntry.customValues.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = performanceEntry.customValues.filter((_: any, i: number) => i !== index);
                            setPerformanceEntry({ ...performanceEntry, customValues: updated });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPerformanceEntry({
                        ...performanceEntry,
                        customValues: [...performanceEntry.customValues, { value: '' }]
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                  >
                    <Plus size={16} /> Add Another Value
                  </button>
                </div>
              )}


              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleAddPerformanceData}
                  className="flex-1 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  {editingPerformanceId ? 'Update Data' : 'Add Data'}
                </button>
                <button
                  onClick={() => {
                    setShowPerformanceModal(false);
                    setPerformanceEntry(getDefaultPerformanceEntry());
                    setEditingPerformanceId(null);
                  }}
                  className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManagerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg">Manage Performance Categories</h3>
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Add New Category */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm mb-3">Add New Category</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={newFilterCategory.label}
                    onChange={(e) => setNewFilterCategory({ ...newFilterCategory, label: e.target.value })}
                    placeholder="e.g., Top Tier, Premium"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Badge Color</label>
                  <select
                    value={newFilterCategory.color}
                    onChange={(e) => setNewFilterCategory({ ...newFilterCategory, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="bg-purple-100 text-purple-700">Purple</option>
                    <option value="bg-blue-100 text-blue-700">Blue</option>
                    <option value="bg-green-100 text-green-700">Green</option>
                    <option value="bg-yellow-100 text-yellow-700">Yellow</option>
                    <option value="bg-red-100 text-red-700">Red</option>
                    <option value="bg-pink-100 text-pink-700">Pink</option>
                    <option value="bg-indigo-100 text-indigo-700">Indigo</option>
                    <option value="bg-orange-100 text-orange-700">Orange</option>
                  </select>
                </div>
                <button
                  onClick={handleAddFilterCategory}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Category
                </button>
              </div>
            </div>

            {/* Existing Categories */}
            <div>
              <h4 className="text-sm mb-3">Existing Categories</h4>
              <div className="space-y-2">
                {performanceCategories.map((cat) => {
                  const isCustom = customFilterCategories.find(c => c.id === cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs ${cat.color}`}>
                          {cat.label}
                        </span>
                        {!isCustom && (
                          <span className="text-xs text-gray-500">(Default)</span>
                        )}
                      </div>
                      {isCustom && (
                        <button
                          onClick={() => handleDeleteFilterCategory(cat.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Performance Category Modal */}
      {showAssignCategoryModal && customerToAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Assign Performance Category</h3>
              <button
                onClick={() => {
                  setShowAssignCategoryModal(false);
                  setCustomerToAssign(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Select a performance category for <span className="font-semibold">{customerToAssign.customer}</span>
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {performanceCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleAssignPerformanceCategory(cat.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all hover:border-pink-500 ${
                    customerToAssign.performanceCategory === cat.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className={`px-3 py-1 rounded-full text-xs ${cat.color}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowAssignCategoryModal(false);
                  setCustomerToAssign(null);
                }}
                className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Agents Modal */}
      <AIAgentsModal 
        isOpen={showAIAgentsModal}
        onClose={() => setShowAIAgentsModal(false)}
        customers={filteredRecords}
      />
    </div>
  );
});

// Reusable Modal Component for Add/Edit Customer
function AddEditCustomerModal({ 
  title, 
  customer, 
  onCustomerChange, 
  onSubmit, 
  onClose,
  addContactField,
  removeContactField,
  updateContactField,
  isEdit = false
}: {
  title: string;
  customer: any;
  onCustomerChange: (customer: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  addContactField: () => void;
  removeContactField: (index: number) => void;
  updateContactField: (index: number, field: string, value: string) => void;
  isEdit?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl mb-1">{title}</h3>
            <p className="text-sm text-white/80">{isEdit ? 'Update customer information' : 'Create a new after-sales follow-up record'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customer.customer}
              onChange={(e) => onCustomerChange({ ...customer, customer: e.target.value })}
              placeholder="e.g., Tech Solutions Inc."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Contact Persons */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm">
                Contact Persons <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addContactField}
                className="text-pink-500 hover:text-pink-600 text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                Add Contact
              </button>
            </div>
            {customer.contacts.map((contact: any, index: number) => (
              <div key={index} className="space-y-3 p-3 bg-gray-50 rounded-lg relative">
                {customer.contacts.length > 1 && (
                  <button
                    onClick={() => removeContactField(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContactField(index, 'name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <CountrySelector
                          value={contact.phoneCountryCode || '+1'}
                          onChange={(code) => updateContactField(index, 'phoneCountryCode', code)}
                          className="w-32"
                        />
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => updateContactField(index, 'phone', e.target.value)}
                          placeholder="234567890 (no leading 0)"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContactField(index, 'email', e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">WhatsApp Number (Optional)</label>
                    <div className="flex gap-2">
                      <CountrySelector
                        value={contact.whatsappCountryCode || '+1'}
                        onChange={(code) => updateContactField(index, 'whatsappCountryCode', code)}
                        className="w-32"
                      />
                      <input
                        type="tel"
                        value={contact.whatsapp || ''}
                        onChange={(e) => updateContactField(index, 'whatsapp', e.target.value)}
                        placeholder="234567890 (no leading 0)"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Town/City</label>
              <input
                type="text"
                value={customer.city}
                onChange={(e) => onCustomerChange({ ...customer, city: e.target.value })}
                placeholder="e.g., New York"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Physical Address</label>
              <input
                type="text"
                value={customer.address}
                onChange={(e) => onCustomerChange({ ...customer, address: e.target.value })}
                placeholder="e.g., 123 Main St"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              {isEdit ? 'Update Customer' : 'Add Customer'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
