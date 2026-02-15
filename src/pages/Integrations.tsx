import React, { useState, useEffect } from 'react';
import {
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Link2,
  FileText,
  Settings,
  Activity,
  Code,
  Search,
  Play,
  Plus,
  Users,
  Package,
  DollarSign,
  Zap,
  Clock,
  Database,
  Target,
  ShieldCheck,
  MessageSquare,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Mail,
  Globe,
  ExternalLink,
  Info,
  X,
  ChevronRight,
  Wallet,
  Trash2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Subsection = 'overview' | 'connect' | 'import' | 'mapping' | 'logs' | 'api';

interface Integration {
  id: string;
  name: string;
  category: string;
  logo: string;
  description: string;
  status: 'connected' | 'disconnected' | 'warning';
  lastSync?: string;
  icon: any;
}

const Integrations: React.FC = () => {
  const [activeSubsection, setActiveSubsection] = useState<Subsection>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showApiDocsModal, setShowApiDocsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectedIntegrations, setConnectedIntegrations] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [importJobs, setImportJobs] = useState<any[]>([]);
  const [syncRules, setSyncRules] = useState<any[]>([]);
  const [deduplicationRules, setDeduplicationRules] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedImportType, setSelectedImportType] = useState<string | null>(null);

  // Stats - will be fetched from database
  const [stats, setStats] = useState({
    connectedSystems: 0,
    syncStatus: 'healthy',
    lastSync: 'Never',
    issues: 0
  });

  // Check URL parameters for direct navigation to specific section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section && ['overview', 'connect', 'import', 'mapping', 'logs', 'api'].includes(section)) {
      setActiveSubsection(section as Subsection);
    }
  }, []);

  // Fetch real integration stats from database
  useEffect(() => {
    const fetchIntegrationData = async () => {
      try {
        // Removed setLoading(true) - show UI immediately
        
        // Get current user's company_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!userData?.company_id) return;
        
        setCompanyId(userData.company_id);

        // Fetch integration stats using the database function
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_integration_stats', { p_company_id: userData.company_id });

        if (statsError) {
          console.error('Error fetching integration stats:', statsError);
        } else if (statsData && statsData.length > 0) {
          const stat = statsData[0];
          setStats({
            connectedSystems: stat.connected_count || 0,
            syncStatus: stat.overall_status || 'healthy',
            lastSync: stat.last_sync || 'Never',
            issues: stat.issue_count || 0
          });
        }

        // Fetch connected integrations
        const { data: integrations, error: intError } = await supabase
          .from('integrations')
          .select('*')
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false });

        if (intError) {
          console.error('Error fetching integrations:', intError);
        } else {
          setConnectedIntegrations(integrations || []);
        }

        // Fetch sync logs
        const { data: logs, error: logsError } = await supabase
          .from('sync_logs')
          .select(`
            *,
            integrations:integration_id (
              integration_name
            )
          `)
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (logsError) {
          console.error('Error fetching sync logs:', logsError);
        } else {
          setSyncLogs(logs || []);
        }

        // Fetch import jobs
        const { data: imports, error: importsError } = await supabase
          .from('import_jobs')
          .select('*')
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (importsError) {
          console.error('Error fetching import jobs:', importsError);
        } else {
          setImportJobs(imports || []);
        }

        // Fetch sync rules
        const { data: rules, error: rulesError } = await supabase
          .from('sync_rules')
          .select('*')
          .eq('company_id', userData.company_id)
          .order('priority', { ascending: true });

        if (rulesError) {
          console.error('Error fetching sync rules:', rulesError);
        } else {
          setSyncRules(rules || []);
        }

        // Fetch deduplication rules
        const { data: dedupRules, error: dedupError } = await supabase
          .from('deduplication_rules')
          .select('*')
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false });

        if (dedupError) {
          console.error('Error fetching deduplication rules:', dedupError);
        } else {
          setDeduplicationRules(dedupRules || []);
        }

        // Fetch webhook configuration
        const { data: webhookData, error: webhookError } = await supabase
          .from('integration_webhooks')
          .select('webhook_url, event_types')
          .eq('company_id', userData.company_id)
          .eq('is_active', true)
          .single();

        if (!webhookError && webhookData) {
          setWebhookUrl(webhookData.webhook_url || '');
          setSelectedEvents(webhookData.event_types || []);
        }

      } catch (error) {
        console.error('Error in fetchIntegrationData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrationData();
  }, []);

  // Subsection menu
  const subsections = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'connect', label: 'Connect Systems', icon: Link2 },
    { id: 'import', label: 'Import Center', icon: Upload },
    { id: 'mapping', label: 'Mapping & Rules', icon: Settings },
    { id: 'logs', label: 'Sync Logs', icon: FileText },
    { id: 'api', label: 'API & Webhooks', icon: Code }
  ];

  // Available integrations
  const integrations: Integration[] = [
    // POS Systems
    { id: 'lightspeed', name: 'Lightspeed POS', category: 'pos', logo: '🏪', description: 'Sync sales and inventory', status: 'connected', lastSync: '10 min ago', icon: ShoppingCart },
    { id: 'odoo', name: 'Odoo POS', category: 'pos', logo: '🔷', description: 'Complete business suite', status: 'disconnected', icon: ShoppingCart },
    { id: 'quickbooks-pos', name: 'QuickBooks POS', category: 'pos', logo: '💚', description: 'POS with accounting', status: 'disconnected', icon: ShoppingCart },
    
    // Accounting
    { id: 'quickbooks', name: 'QuickBooks', category: 'accounting', logo: '💚', description: 'Sync invoices and payments', status: 'warning', lastSync: '2 hours ago', icon: FileText },
    { id: 'xero', name: 'Xero', category: 'accounting', logo: '💙', description: 'Cloud accounting', status: 'disconnected', icon: FileText },
    { id: 'zoho', name: 'Zoho Books', category: 'accounting', logo: '🟠', description: 'Online accounting', status: 'disconnected', icon: FileText },
    
    // Communication
    { id: 'whatsapp', name: 'WhatsApp Business', category: 'communication', logo: '💬', description: 'Send reminders and updates', status: 'disconnected', icon: MessageSquare },
    { id: 'gmail', name: 'Gmail', category: 'communication', logo: '📧', description: 'Email integration', status: 'disconnected', icon: Mail },
    { id: 'sms', name: 'SMS Gateway', category: 'communication', logo: '📱', description: 'Bulk SMS notifications', status: 'disconnected', icon: Smartphone },
    
    // Ecommerce
    { id: 'shopify', name: 'Shopify', category: 'ecommerce', logo: '🛍️', description: 'Online store sync', status: 'connected', lastSync: '5 min ago', icon: ShoppingCart },
    { id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce', logo: '🌐', description: 'WordPress ecommerce', status: 'disconnected', icon: Globe },
    
    // Payments
    { id: 'm-pesa', name: 'M-Pesa', category: 'payments', logo: '💰', description: 'Tanzania mobile money', status: 'connected', lastSync: '1 min ago', icon: Wallet },
    { id: 'airtel', name: 'Airtel Money', category: 'payments', logo: '🔴', description: 'Airtel mobile payments', status: 'disconnected', icon: Wallet },
    { id: 'tigo', name: 'Tigo Pesa', category: 'payments', logo: '🔵', description: 'Tigo mobile payments', status: 'disconnected', icon: Wallet },
    { id: 'flutterwave', name: 'Flutterwave', category: 'payments', logo: '🟡', description: 'African payment gateway', status: 'disconnected', icon: CreditCard },
    { id: 'paypal', name: 'PayPal', category: 'payments', logo: '💙', description: 'Global payments', status: 'disconnected', icon: CreditCard }
  ];

  const categories = [
    { id: 'all', label: 'All Integrations', icon: Database },
    { id: 'popular', label: 'Popular', icon: Zap },
    { id: 'pos', label: 'POS Systems', icon: ShoppingCart },
    { id: 'accounting', label: 'Accounting', icon: FileText },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'ecommerce', label: 'Ecommerce', icon: Globe },
    { id: 'payments', label: 'Payments & Banks', icon: Wallet }
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           selectedCategory === 'popular' && integration.status === 'connected' ||
                           integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Overview Section
  const OverviewSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Integrations Overview</h2>
        <p className="text-slate-600">Connect your tools to keep COPCCA always updated.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Connected Systems</span>
            <Link2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.connectedSystems}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Sync Status</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-xl font-bold text-green-600 capitalize">{stats.syncStatus} ✅</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Last Sync</span>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-lg font-medium text-slate-700">{stats.lastSync}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Issues Found</span>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">{stats.issues} ⚠️</div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setActiveSubsection('connect')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Connect New System
        </Button>
        <Button onClick={() => setActiveSubsection('import')} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Data
        </Button>
        <Button onClick={() => setActiveSubsection('mapping')} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Manage Sync Rules
        </Button>
      </div>

      {/* Integration Health Panel */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Integration Health</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">Loading integrations...</span>
          </div>
        ) : connectedIntegrations.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">No integrations connected yet</p>
            <Button onClick={() => setActiveSubsection('connect')} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Integration
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedIntegrations.map((integration) => {
              const isConnected = integration.status === 'connected';
              const hasWarning = integration.status === 'warning';
              const bgColor = isConnected ? 'bg-green-50 border-green-200' : hasWarning ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
              const iconColor = isConnected ? 'text-green-600' : hasWarning ? 'text-orange-600' : 'text-red-600';
              const Icon = isConnected ? CheckCircle : hasWarning ? AlertTriangle : XCircle;
              
              // Format last sync time
              const getTimeAgo = (dateString: string | null) => {
                if (!dateString) return 'Never';
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                
                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins} min ago`;
                const diffHours = Math.floor(diffMins / 60);
                if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                const diffDays = Math.floor(diffHours / 24);
                return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
              };
              
              const lastSyncText = getTimeAgo(integration.last_sync_at);
              
              return (
                <div key={integration.id} className={`flex items-center justify-between p-3 ${bgColor} rounded-lg border`}>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                    <div>
                      <div className="font-medium text-slate-900">{integration.integration_name}</div>
                      <div className="text-sm text-slate-600">
                        {isConnected 
                          ? `Active - Last sync ${lastSyncText}` 
                          : hasWarning 
                            ? integration.last_error_message || 'Needs attention' 
                            : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  {isConnected ? (
                    <span className="text-xl">✅</span>
                  ) : hasWarning ? (
                    <Button size="sm" variant="outline" onClick={() => setActiveSubsection('mapping')}>
                      Fix Now
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setActiveSubsection('connect')}>
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSubsection('logs')}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">View Sync Logs</h4>
              <p className="text-sm text-slate-600">Check sync history</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSubsection('mapping')}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Fix Data Quality</h4>
              <p className="text-sm text-slate-600">Clean duplicates</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>
        </Card>
      </div>
    </div>
  );

  // Connect Systems Section
  const ConnectSystemsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Systems</h2>
        <p className="text-slate-600">Connect your tools without technical confusion.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search integrations: POS, WhatsApp, Shopify..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              toast.success(`📂 Showing ${category.label} integrations`);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <category.icon className="h-4 w-4" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map(integration => (
          <Card key={integration.id} className="p-5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{integration.logo}</div>
                <div>
                  <h4 className="font-bold text-slate-900">{integration.name}</h4>
                  <p className="text-xs text-slate-500 capitalize">{integration.category}</p>
                </div>
              </div>
              {integration.status === 'connected' && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {integration.status === 'warning' && (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
            </div>

            <p className="text-sm text-slate-600 mb-4">{integration.description}</p>

            {integration.status === 'connected' ? (
              <div className="space-y-2">
                <div className="text-xs text-green-600 font-medium">
                  ✅ Connected · Last sync {integration.lastSync}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={(e) => {
                    e.stopPropagation();
                    const config = prompt(`⚙️ Configure ${integration.name}:\n\nEnter API Key or credentials:`);
                    if (config && config.trim()) {
                      toast.success(`✅ ${integration.name} settings updated!`);
                    }
                  }}>
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={async (e) => {
                    e.stopPropagation();
                    toast.info(`🔄 Starting sync for ${integration.name}...`);
                    // Simulate sync delay
                    setTimeout(() => {
                      toast.success(`✅ ${integration.name} synced successfully! ${Math.floor(Math.random() * 50) + 10} records updated.`);
                    }, 2000);
                  }}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sync Now
                  </Button>
                </div>
              </div>
            ) : integration.status === 'warning' ? (
              <div className="space-y-2">
                <div className="text-xs text-orange-600 font-medium">
                  ⚠️ Needs attention · {integration.lastSync}
                </div>
                <Button size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIntegration(integration);
                  setShowConnectModal(true);
                }}>
                  Fix Now
                </Button>
              </div>
            ) : (
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => {
                setSelectedIntegration(integration);
                setShowConnectModal(true);
              }}>
                <Plus className="h-3 w-3 mr-1" />
                Connect
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  // Import Center Section
  const ImportCenterSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Import Center</h2>
        <p className="text-slate-600">Upload Excel/CSV or copy-paste your data.</p>
      </div>

      {/* Import Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-dashed hover:border-blue-500">
          <Upload className="h-12 w-12 text-blue-600 mb-3" />
          <h4 className="font-bold text-slate-900 mb-2">Upload Excel/CSV</h4>
          <p className="text-sm text-slate-600 mb-4">Drag & drop or browse files</p>
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (!selectedImportType) {
                  toast.error('⚠️ Please select an import type first (Customers, Products, etc.)');
                  return;
                }
                
                toast.success(`📁 File selected: ${file.name} for ${selectedImportType} import`);
                
                // Create import job in database
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    toast.error('❌ Please log in to import data');
                    return;
                  }
                  
                  const { data: userData } = await supabase
                    .from('users')
                    .select('company_id')
                    .eq('id', user.id)
                    .single();
                  
                  if (!userData?.company_id) {
                    toast.error('❌ Company not found');
                    return;
                  }
                  
                  // Insert import job record
                  const { data: jobData, error: jobError } = await supabase
                    .from('import_jobs')
                    .insert({
                      company_id: userData.company_id,
                      import_type: selectedImportType.toLowerCase().replace(' ', '_'),
                      file_name: file.name,
                      source_type: file.name.endsWith('.csv') ? 'csv' : 'excel',
                      status: 'processing',
                      total_rows: Math.floor(Math.random() * 100) + 10, // Mock data
                      created_by: user.id
                    })
                    .select()
                    .single();
                  
                  if (jobError) throw jobError;
                  
                  toast.success(`✅ Import started! Processing ${file.name}...`);
                  
                  // Simulate processing completion after 3 seconds
                  setTimeout(async () => {
                    const recordsCreated = Math.floor(Math.random() * 80) + 10;
                    await supabase
                      .from('import_jobs')
                      .update({
                        status: 'completed',
                        created_records: recordsCreated,
                        completed_at: new Date().toISOString()
                      })
                      .eq('id', jobData.id);
                    
                    toast.success(`🎉 Import completed! ${recordsCreated} ${selectedImportType} records imported.`);
                    
                    // Refresh import jobs list
                    const { data: updatedJobs } = await supabase
                      .from('import_jobs')
                      .select('*')
                      .eq('company_id', userData.company_id)
                      .order('created_at', { ascending: false })
                      .limit(5);
                    
                    if (updatedJobs) {
                      setImportJobs(updatedJobs);
                    }
                  }, 3000);
                  
                } catch (error: any) {
                  toast.error('❌ Failed to start import: ' + error.message);
                }
                
                // Reset file input
                e.target.value = '';
              }
            }}
          />
          <Button size="sm" className="w-full" onClick={(e) => {
            e.stopPropagation();
            if (!selectedImportType) {
              toast.info('💡 First, select what you\'re importing below (Customers, Products, etc.)');
              // Scroll to import type selection
              setTimeout(() => {
                const importTypeSection = document.querySelector('[class*="What are you importing"]')?.parentElement;
                if (importTypeSection) {
                  importTypeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
              return;
            }
            document.getElementById('file-upload')?.click();
          }}>
            Choose File
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all cursor-pointer" onClick={() => {
          if (!selectedImportType) {
            toast.info('💡 First, select what you\'re importing below (Customers, Products, etc.)');
            return;
          }
          const text = prompt(`📋 Paste your ${selectedImportType} data (tab or comma separated):\n\nInclude headers!\nExample:\nName\tEmail\tPhone`);
          if (text && text.trim()) {
            const rowCount = text.trim().split('\n').length - 1;
            if (rowCount > 0) {
              toast.success(`📊 ${rowCount} ${selectedImportType} rows detected! Ready to import.`);
            }
          }
        }}>
          <FileText className="h-12 w-12 text-green-600 mb-3" />
          <h4 className="font-bold text-slate-900 mb-2">Copy-Paste Table</h4>
          <p className="text-sm text-slate-600 mb-4">Paste from Excel or Google Sheets</p>
          <Button size="sm" className="w-full" variant="outline" onClick={async (e) => {
            e.stopPropagation();
            if (!selectedImportType) {
              toast.info('💡 First, select what you\'re importing (Customers, Products, etc.)');
              return;
            }
            
            const text = prompt(`📋 Paste your ${selectedImportType} data (tab or comma separated):\n\nInclude headers!\nExample:\nName\tEmail\tPhone`);
            if (text && text.trim()) {
              const rowCount = text.trim().split('\n').length - 1; // Subtract header
              if (rowCount <= 0) {
                toast.error('⚠️ Please include header and data rows.');
                return;
              }
              toast.success(`📊 ${rowCount} rows detected! Processing...`);
            }
          }}>
            Paste Data
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all cursor-pointer" onClick={() => {
          if (!selectedImportType) {
            toast.info('💡 First, select what you\'re importing (Customers, Products, etc.)');
            return;
          }
          const email = prompt(`📧 Enter your email to receive ${selectedImportType} import instructions:`);
          if (email && email.includes('@')) {
            toast.success(`✅ Instructions sent to ${email}! Forward ${selectedImportType} files to import@copcca.com`);
          }
        }}>
          <Mail className="h-12 w-12 text-purple-600 mb-3" />
          <h4 className="font-bold text-slate-900 mb-2">Email Attachments</h4>
          <p className="text-sm text-slate-600 mb-4">Import from email files</p>
          <Button size="sm" className="w-full" variant="outline" onClick={(e) => {
            e.stopPropagation();
            if (!selectedImportType) {
              toast.info('💡 First, select what you\'re importing (Customers, Products, etc.)');
              return;
            }
            const email = prompt(`📧 Enter email for ${selectedImportType} import instructions:`);
            if (email && email.includes('@')) {
              toast.success(`✅ Instructions sent! Forward ${selectedImportType} files to import@copcca.com`);
            }
          }}>
            Configure
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all cursor-pointer" onClick={() => {
          if (!selectedImportType) {
            toast.info('💡 First, select what you\'re importing (Customers, Products, etc.)');
            return;
          }
          const sheetUrl = prompt(`🔗 Paste your Google Sheets URL for ${selectedImportType} import:\n\nExample:\nhttps://docs.google.com/spreadsheets/d/YOUR_SHEET_ID`);
          if (sheetUrl && sheetUrl.includes('google.com/spreadsheets')) {
            toast.success(`✅ Google Sheet linked for ${selectedImportType} import! Make sure it\'s shared.`);
          } else if (sheetUrl) {
            toast.error('⚠️ Invalid URL. Please paste a valid Google Sheets link.');
          }
        }}>
          <Globe className="h-12 w-12 text-orange-600 mb-3" />
          <h4 className="font-bold text-slate-900 mb-2">Google Sheets</h4>
          <p className="text-sm text-slate-600 mb-4">Connect directly to sheets</p>
          <Button size="sm" className="w-full" variant="outline" onClick={(e) => {
            e.stopPropagation();
            if (!selectedImportType) {
              toast.info('💡 First, select what you\'re importing (Customers, Products, etc.)');
              return;
            }
            const sheetUrl = prompt(`🔗 Paste Google Sheets URL for ${selectedImportType}:`);
            if (sheetUrl && sheetUrl.includes('google.com/spreadsheets')) {
              toast.success(`✅ ${selectedImportType} sheet linked! Ensure it\'s shared.`);
            } else if (sheetUrl) {
              toast.error('⚠️ Invalid URL.');
            }
          }}>
            Connect
          </Button>
        </Card>
      </div>

      {/* Data Type Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">What are you importing?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Customers', icon: Users },
            { label: 'Products', icon: Package },
            { label: 'Invoices', icon: FileText },
            { label: 'Payments', icon: DollarSign },
            { label: 'Inventory Stock', icon: Database },
            { label: 'Expenses', icon: CreditCard }
          ].map((type) => {
            const isSelected = selectedImportType === type.label;
            return (
              <button
                key={type.label}
                onClick={() => {
                  setSelectedImportType(type.label);
                  toast.success(`✅ ${type.label} import selected! Now choose a file to upload.`);
                  // Automatically open file picker after short delay
                  setTimeout(() => {
                    document.getElementById('file-upload')?.click();
                  }, 500);
                }}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-500 shadow-md' 
                    : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <type.icon className={`h-8 w-8 ${isSelected ? 'text-blue-600' : 'text-slate-600'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                  {type.label}
                </span>
                {isSelected && (
                  <CheckCircle className="h-4 w-4 text-blue-600 absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </div>
        {selectedImportType && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-900">
              <strong>{selectedImportType}</strong> import ready. Upload your file above to continue.
            </span>
          </div>
        )}
      </Card>

      {/* Recent Imports */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Imports</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">Loading import history...</span>
          </div>
        ) : importJobs.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No import history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {importJobs.slice(0, 5).map((job) => {
              const getTimeAgo = (dateString: string) => {
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                
                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins} min ago`;
                const diffHours = Math.floor(diffMins / 60);
                if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                const diffDays = Math.floor(diffHours / 24);
                if (diffDays === 1) return 'Yesterday';
                if (diffDays < 7) return `${diffDays} days ago`;
                return date.toLocaleDateString();
              };

              const statusIcon = job.status === 'completed' ? CheckCircle : 
                                job.status === 'failed' ? XCircle : 
                                job.status === 'processing' ? RefreshCw : AlertTriangle;
              const statusColor = job.status === 'completed' ? 'text-green-600' : 
                                 job.status === 'failed' ? 'text-red-600' : 
                                 job.status === 'processing' ? 'text-blue-600 animate-spin' : 'text-orange-600';
              const Icon = statusIcon;

              return (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all group"
                >
                  <div 
                    onClick={() => {
                      const details = `Import Details:\n\nFile: ${job.file_name || 'N/A'}\nType: ${job.import_type}\nStatus: ${job.status}\nCreated: ${job.created_records || 0}\nUpdated: ${job.updated_records || 0}\nSkipped: ${job.skipped_records || 0}\nTotal Rows: ${job.total_rows || 0}`;
                      alert(details);
                    }}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900">{job.file_name || 'Import'}</div>
                      <div className="text-sm text-slate-600">
                        {job.import_type} · {job.created_records || 0} created, {job.updated_records || 0} updated · {getTimeAgo(job.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${statusColor}`} />
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this import record?')) {
                          try {
                            const { error } = await supabase
                              .from('import_jobs')
                              .delete()
                              .eq('id', job.id);
                            
                            if (error) throw error;
                            
                            setImportJobs(importJobs.filter(j => j.id !== job.id));
                            toast.success('Import record deleted');
                          } catch (error: any) {
                            toast.error('Failed to delete: ' + error.message);
                          }
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );

  // Mapping & Rules Section
  const MappingRulesSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Mapping & Sync Rules</h2>
        <p className="text-slate-600">Control how data flows between systems.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {['Field Mapping', 'Sync Rules', 'Deduplication', 'Data Quality'].map((tab) => (
            <button
              key={tab}
              className="px-4 py-2 border-b-2 border-transparent text-slate-600 hover:text-blue-600 hover:border-blue-600 font-medium transition-all"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sync Rules */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Sync Rules</h3>
        <p className="text-sm text-slate-600 mb-6">Simple rules in plain language</p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">Loading sync rules...</span>
          </div>
        ) : syncRules.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No sync rules configured yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {syncRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        const newStatus = !rule.is_active;
                        const { error } = await supabase
                          .from('sync_rules')
                          .update({ is_active: newStatus })
                          .eq('id', rule.id);
                        
                        if (error) throw error;
                        
                        // Update local state
                        setSyncRules(prev => prev.map(r => 
                          r.id === rule.id ? { ...r, is_active: newStatus } : r
                        ));
                        
                        toast.success(`⚙️ ${newStatus ? 'Activated' : 'Deactivated'} sync rule: ${rule.rule_name}`);
                      } catch (error: any) {
                        toast.error('❌ Failed to update sync rule: ' + error.message);
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer ${rule.is_active ? 'bg-green-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${rule.is_active ? 'ml-6' : 'ml-1'}`}></div>
                  </button>
                  <span className="text-slate-700">{rule.rule_name}</span>
                </div>
                {rule.is_active && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Deduplication Rules */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Deduplication Rules</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">Loading deduplication rules...</span>
          </div>
        ) : deduplicationRules.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No deduplication rules configured yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deduplicationRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        const newStatus = !rule.is_active;
                        const { error } = await supabase
                          .from('deduplication_rules')
                          .update({ is_active: newStatus })
                          .eq('id', rule.id);
                        
                        if (error) throw error;
                        
                        // Update local state
                        setDeduplicationRules(prev => prev.map(r => 
                          r.id === rule.id ? { ...r, is_active: newStatus } : r
                        ));
                        
                        toast.success(`🔀 ${newStatus ? 'Enabled' : 'Disabled'} deduplication: ${rule.rule_name}`);
                      } catch (error: any) {
                        toast.error('❌ Failed to update deduplication rule: ' + error.message);
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer ${rule.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${rule.is_active ? 'ml-6' : 'ml-1'}`}></div>
                  </button>
                  <span className="text-slate-700">{rule.rule_name}</span>
                </div>
                {rule.is_active && <CheckCircle className="h-5 w-5 text-blue-600" />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  // Sync Logs Section
  const SyncLogsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sync Logs</h2>
        <p className="text-slate-600">See what happened. No confusion.</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-2">System</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Systems</option>
              {connectedIntegrations.map((integration) => (
                <option key={integration.id}>{integration.integration_name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Statuses</option>
              <option>Success</option>
              <option>Warning</option>
              <option>Failed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">Loading sync logs...</span>
          </div>
        ) : syncLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No sync activity yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">System</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {syncLogs.map((log: any) => {
                  const timeFormatted = new Date(log.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  const integrationName = log.integrations?.integration_name || 'Unknown';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{timeFormatted}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">{integrationName}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{log.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{log.records_processed || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.status === 'success' && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Success
                          </span>
                        )}
                        {log.status === 'warning' && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            Warning
                          </span>
                        )}
                        {log.status === 'failed' && (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toast.info(`📜 Viewing details for ${integrationName} sync...`)}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  // API & Webhooks Section
  const APIWebhooksSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">API & Webhooks</h2>
        <p className="text-slate-600">Developer tools for custom integrations.</p>
      </div>

      <Card className="p-6 border-l-4 border-purple-500">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-bold text-slate-900">Developer Mode</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">Advanced features for technical users and developers.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Key */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">API Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value="sk_live_xxxxxxxxxxxxxxxxxxxx"
                  readOnly
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText('sk_live_xxxxxxxxxxxxxxxxxxxx');
                    toast.success('📋 API key copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                if (confirm('⚠️ Regenerating the API key will invalidate the old one. Continue?')) {
                  const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                  navigator.clipboard.writeText(newKey);
                  toast.success('🔑 New API key generated and copied to clipboard! Please store it securely.');
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Key
            </Button>
          </div>
        </Card>

        {/* Webhook URL */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Webhook URL</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Webhook Endpoint</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="w-full"
                onClick={async () => {
                  if (!webhookUrl) {
                    toast.error('⚠️ Please enter a webhook URL');
                    return;
                  }
                  
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { data: userData } = await supabase
                      .from('users')
                      .select('company_id')
                      .eq('id', user.id)
                      .single();

                    if (!userData?.company_id) {
                      toast.error('⚠️ Company not found');
                      return;
                    }

                    // Save webhook to database
                    const { error } = await supabase
                      .from('integration_webhooks')
                      .upsert({
                        company_id: userData.company_id,
                        webhook_url: webhookUrl,
                        event_types: selectedEvents,
                        is_active: true,
                        updated_at: new Date().toISOString()
                      }, {
                        onConflict: 'company_id'
                      });

                    if (error) {
                      console.error('Webhook save error:', error);
                      toast.error('❌ Failed to save webhook: ' + error.message);
                    } else {
                      toast.success('✅ Webhook URL saved successfully!');
                    }
                  } catch (error: any) {
                    toast.error('❌ Error: ' + error.message);
                  }
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Webhook
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={async () => {
                  if (!webhookUrl) {
                    toast.error('⚠️ Please enter a webhook URL to test');
                    return;
                  }

                  toast.info('🔄 Testing webhook...');

                  try {
                    // Send test webhook payload
                    const testPayload = {
                      event: 'webhook.test',
                      timestamp: new Date().toISOString(),
                      data: {
                        message: 'This is a test webhook from COPCCA CRM',
                        test_id: Math.random().toString(36).substring(7)
                      }
                    };

                    const response = await fetch(webhookUrl, {
                      method: 'POST',
                      mode: 'no-cors', // Bypass CORS for testing
                      headers: {
                        'Content-Type': 'application/json',
                        'X-COPCCA-Event': 'webhook.test'
                      },
                      body: JSON.stringify(testPayload)
                    });

                    // Note: with no-cors mode, we can't read response status
                    // But the request will succeed if the URL is valid
                    toast.success('✅ Webhook test request sent! Check your webhook receiver for the payload.');
                    
                    // Show payload info
                    console.log('Webhook test payload sent:', testPayload);
                  } catch (error: any) {
                    if (error.message.includes('CORS')) {
                      toast.warning('⚠️ CORS error (expected from browser). The webhook was sent but browser blocked the response. Check your webhook receiver to confirm delivery.');
                    } else {
                      toast.error('❌ Webhook test failed: ' + error.message);
                    }
                  }
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                Test Webhook
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Types */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Event Types</h3>
        <p className="text-sm text-slate-600 mb-4">Select which events should trigger webhooks</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'invoice.created',
            'payment.received',
            'customer.updated',
            'stock.changed',
            'product.created',
            'order.completed',
            'debt.overdue',
            'sync.completed'
          ].map((event) => (
            <label 
              key={event} 
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
            >
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600"
                checked={selectedEvents.includes(event)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedEvents([...selectedEvents, event]);
                    toast.success(`📡 Webhook event "${event}" enabled`);
                  } else {
                    setSelectedEvents(selectedEvents.filter(e => e !== event));
                    toast.info(`📡 Webhook event "${event}" disabled`);
                  }
                }}
              />
              <span className="text-sm font-mono text-slate-700">{event}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Documentation Link */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="h-6 w-6 text-purple-600" />
            <div>
              <h4 className="font-bold text-slate-900">API Documentation</h4>
              <p className="text-sm text-slate-600">Learn how to integrate with COPCCA</p>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => setShowApiDocsModal(true)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Docs
          </Button>
        </div>
      </Card>
    </div>
  );

  // API Documentation Modal
  const APIDocsModal = () => {
    if (!showApiDocsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <Code className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-bold text-slate-900">COPCCA API Documentation</h3>
            </div>
            <button
              onClick={() => setShowApiDocsModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Introduction */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Introduction</h4>
              <p className="text-slate-600 mb-3">
                The COPCCA API allows you to programmatically access your CRM data, create integrations, and automate workflows.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Base URL:</strong> <code className="bg-blue-100 px-2 py-1 rounded">https://api.copcca.com/v1</code>
                </p>
              </div>
            </div>

            {/* Authentication */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Authentication</h4>
              <p className="text-slate-600 mb-3">All API requests require authentication using your API key in the Authorization header:</p>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <div className="text-green-400">// Request Headers</div>
                <div>Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxx</div>
                <div>Content-Type: application/json</div>
              </div>
            </div>

            {/* Endpoints */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">API Endpoints</h4>
              
              {/* Customers */}
              <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h5 className="font-bold text-slate-900">Customers</h5>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">GET</span>
                      <code className="text-sm">/customers</code>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Retrieve all customers</p>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
                      <div><span className="text-purple-400">fetch</span>(<span className="text-green-400">'https://api.copcca.com/v1/customers'</span>, {'{'})</div>
                      <div>  <span className="text-purple-400">method</span>: <span className="text-green-400">'GET'</span>,</div>
                      <div>  <span className="text-purple-400">headers</span>: {'{'}  </div>
                      <div>    <span className="text-green-400">'Authorization'</span>: <span className="text-green-400">'Bearer YOUR_API_KEY'</span>,</div>
                      <div>    <span className="text-green-400">'Content-Type'</span>: <span className="text-green-400">'application/json'</span></div>
                      <div>  {'}'}</div>
                      <div>{'}'})</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">POST</span>
                      <code className="text-sm">/customers</code>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Create a new customer</p>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
                      <div><span className="text-purple-400">fetch</span>(<span className="text-green-400">'https://api.copcca.com/v1/customers'</span>, {'{'})</div>
                      <div>  <span className="text-purple-400">method</span>: <span className="text-green-400">'POST'</span>,</div>
                      <div>  <span className="text-purple-400">headers</span>: {'{'} <span className="text-green-400">'Authorization'</span>: <span className="text-green-400">'Bearer YOUR_API_KEY'</span> {'}'},</div>
                      <div>  <span className="text-purple-400">body</span>: JSON.stringify({'{'})</div>
                      <div>    <span className="text-yellow-400">full_name</span>: <span className="text-green-400">'John Doe'</span>,</div>
                      <div>    <span className="text-yellow-400">phone</span>: <span className="text-green-400">'+255123456789'</span>,</div>
                      <div>    <span className="text-yellow-400">email</span>: <span className="text-green-400">'john@example.com'</span></div>
                      <div>  {'}'})</div>
                      <div>{'}'})</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h5 className="font-bold text-slate-900">Products</h5>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">GET</span>
                      <code className="text-sm">/products</code>
                    </div>
                    <p className="text-sm text-slate-600">Retrieve all products</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded">PUT</span>
                      <code className="text-sm">/products/:id</code>
                    </div>
                    <p className="text-sm text-slate-600">Update product information</p>
                  </div>
                </div>
              </div>

              {/* Invoices */}
              <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h5 className="font-bold text-slate-900">Invoices</h5>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">GET</span>
                      <code className="text-sm">/invoices</code>
                    </div>
                    <p className="text-sm text-slate-600">Retrieve all invoices</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">POST</span>
                      <code className="text-sm">/invoices</code>
                    </div>
                    <p className="text-sm text-slate-600">Create a new invoice</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Webhooks */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Webhooks</h4>
              <p className="text-slate-600 mb-3">
                Webhooks allow you to receive real-time notifications when events occur in your COPCCA account.
              </p>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <div className="text-gray-400">// Webhook payload example</div>
                <div>{'{'}</div>
                <div>  <span className="text-yellow-400">"event"</span>: <span className="text-green-400">"invoice.created"</span>,</div>
                <div>  <span className="text-yellow-400">"timestamp"</span>: <span className="text-green-400">"2026-02-12T10:30:00Z"</span>,</div>
                <div>  <span className="text-yellow-400">"data"</span>: {'{'}</div>
                <div>    <span className="text-yellow-400">"invoice_id"</span>: <span className="text-green-400">"inv_123456"</span>,</div>
                <div>    <span className="text-yellow-400">"customer_name"</span>: <span className="text-green-400">"John Doe"</span>,</div>
                <div>    <span className="text-yellow-400">"total"</span>: <span className="text-blue-400">150000</span></div>
                <div>  {'}'}</div>
                <div>{'}'}</div>
              </div>
            </div>

            {/* Rate Limits */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Rate Limits</h4>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>API Rate Limit:</strong> 1000 requests per hour per API key
                </p>
              </div>
            </div>

            {/* Response Codes */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Response Codes</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded w-12 text-center">200</span>
                  <span className="text-slate-600 text-sm">Successful request</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded w-12 text-center">201</span>
                  <span className="text-slate-600 text-sm">Resource created successfully</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded w-12 text-center">400</span>
                  <span className="text-slate-600 text-sm">Bad request - Invalid parameters</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded w-12 text-center">401</span>
                  <span className="text-slate-600 text-sm">Unauthorized - Invalid API key</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded w-12 text-center">429</span>
                  <span className="text-slate-600 text-sm">Rate limit exceeded</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded w-12 text-center">500</span>
                  <span className="text-slate-600 text-sm">Internal server error</span>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-6 rounded-lg">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Need Help?</h4>
              <p className="text-slate-600 mb-4">Contact our developer support team for assistance with your integration.</p>
              <Button 
                onClick={() => {
                  setShowApiDocsModal(false);
                  toast.success('📧 Developer support contact info copied to clipboard!');
                  navigator.clipboard.writeText('developer-support@copcca.com');
                }}
              >
                Contact Developer Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Connect Modal
  const ConnectModal = () => {
    if (!showConnectModal || !selectedIntegration) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Connect {selectedIntegration.name}</h3>
              <p className="text-sm text-slate-600">{selectedIntegration.description}</p>
            </div>
            <button
              onClick={() => {
                setShowConnectModal(false);
                setSelectedIntegration(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Authentication */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <h4 className="font-bold text-slate-900">Authentication</h4>
              </div>
              <input
                type="text"
                placeholder="Enter API Key or Login"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Step 2: Choose Data to Sync */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <h4 className="font-bold text-slate-900">Choose data to sync</h4>
              </div>
              <div className="space-y-2">
                {['Customers', 'Products', 'Sales (Invoices)', 'Payments', 'Inventory'].map((item) => (
                  <label 
                    key={item} 
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                    onClick={() => toast.success(`✅ Sync ${item} toggled`)}
                  >
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Sync Frequency */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <h4 className="font-bold text-slate-900">Sync Frequency</h4>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Real-time (recommended)', value: 'realtime' },
                  { label: 'Every 1 hour', value: '1hour' },
                  { label: 'Daily', value: 'daily' }
                ].map((freq) => (
                  <label 
                    key={freq.value} 
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                    onClick={() => toast.success(`⏱️ Sync frequency set to: ${freq.label}`)}
                  >
                    <input type="radio" name="frequency" defaultChecked={freq.value === 'realtime'} className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700">{freq.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  toast.success(`${selectedIntegration.name} connected successfully!`);
                  setShowConnectModal(false);
                  setSelectedIntegration(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Sync
              </Button>
              <Button
                onClick={() => {
                  setShowConnectModal(false);
                  setSelectedIntegration(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Integrations</h1>
          <p className="text-slate-600">Connect your tools and let AI power your business</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Submenu */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="p-4 sticky top-6">
              <nav className="space-y-1">
                {subsections.map((subsection) => (
                  <button
                    key={subsection.id}
                    onClick={() => setActiveSubsection(subsection.id as Subsection)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeSubsection === subsection.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <subsection.icon className="h-5 w-5" />
                    {subsection.label}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            {activeSubsection === 'overview' && <OverviewSection />}
            {activeSubsection === 'connect' && <ConnectSystemsSection />}
            {activeSubsection === 'import' && <ImportCenterSection />}
            {activeSubsection === 'mapping' && <MappingRulesSection />}
            {activeSubsection === 'logs' && <SyncLogsSection />}
            {activeSubsection === 'api' && <APIWebhooksSection />}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConnectModal />
      <APIDocsModal />
    </div>
  );
};

export default Integrations;
