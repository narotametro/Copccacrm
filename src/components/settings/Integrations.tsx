import { Cloud, Database, RefreshCw, CheckCircle2, AlertCircle, Upload, Settings, Link2, Calendar, Clock, PlayCircle, Trash2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from './shared/PageHeader';

interface Integration {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  status: 'connected' | 'available' | 'error';
  lastSync?: string;
  recordsCount?: number;
  apiEndpoint?: string;
  dataTypes: string[];
}

interface ImportHistory {
  id: string;
  integration: string;
  dataType: string;
  recordsImported: number;
  status: 'success' | 'failed' | 'in-progress';
  timestamp: string;
  duration: string;
  errors?: number;
}

export function Integrations() {
  const [activeTab, setActiveTab] = useState<'available' | 'connected' | 'history'>('connected');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataSource, setDataSource] = useState('');
  const [dataType, setDataType] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const integrations: Integration[] = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      type: 'CRM',
      icon: '☁️',
      description: 'Import customers, opportunities, and sales data',
      status: 'connected',
      lastSync: '2024-11-09 10:30 AM',
      recordsCount: 1245,
      apiEndpoint: 'https://api.salesforce.com/v1',
      dataTypes: ['Customers', 'Sales Orders', 'Opportunities', 'Contacts'],
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      type: 'Accounting',
      icon: '💰',
      description: 'Sync invoices, payments, and financial data',
      status: 'connected',
      lastSync: '2024-11-09 09:15 AM',
      recordsCount: 892,
      apiEndpoint: 'https://api.quickbooks.com/v3',
      dataTypes: ['Invoices', 'Payments', 'Customers', 'Vendors'],
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      type: 'CRM',
      icon: '🎯',
      description: 'Import marketing and sales pipeline data',
      status: 'available',
      apiEndpoint: 'https://api.hubspot.com/v1',
      dataTypes: ['Contacts', 'Deals', 'Companies', 'Marketing Data'],
    },
    {
      id: 'sap',
      name: 'SAP ERP',
      type: 'ERP',
      icon: '🏢',
      description: 'Enterprise resource planning integration',
      status: 'available',
      apiEndpoint: 'https://api.sap.com/v2',
      dataTypes: ['Orders', 'Inventory', 'Customers', 'Finance'],
    },
    {
      id: 'shopify',
      name: 'Shopify',
      type: 'E-Commerce',
      icon: '🛍️',
      description: 'Import store orders and customer data',
      status: 'error',
      lastSync: '2024-11-08 03:45 PM',
      apiEndpoint: 'https://api.shopify.com/v1',
      dataTypes: ['Orders', 'Customers', 'Products', 'Payments'],
    },
    {
      id: 'oracle',
      name: 'Oracle NetSuite',
      type: 'ERP',
      icon: '⚡',
      description: 'Cloud ERP and financial management',
      status: 'available',
      apiEndpoint: 'https://api.netsuite.com/v1',
      dataTypes: ['Sales Orders', 'Customers', 'Finance', 'Inventory'],
    },
  ];

  const importHistory: ImportHistory[] = [
    {
      id: '1',
      integration: 'Salesforce',
      dataType: 'Customers',
      recordsImported: 234,
      status: 'success',
      timestamp: '2024-11-09 10:30 AM',
      duration: '2m 15s',
    },
    {
      id: '2',
      integration: 'QuickBooks',
      dataType: 'Invoices',
      recordsImported: 156,
      status: 'success',
      timestamp: '2024-11-09 09:15 AM',
      duration: '1m 42s',
    },
    {
      id: '3',
      integration: 'Shopify',
      dataType: 'Orders',
      recordsImported: 0,
      status: 'failed',
      timestamp: '2024-11-08 03:45 PM',
      duration: '0m 23s',
      errors: 5,
    },
    {
      id: '4',
      integration: 'Salesforce',
      dataType: 'Opportunities',
      recordsImported: 89,
      status: 'success',
      timestamp: '2024-11-08 02:20 PM',
      duration: '1m 08s',
    },
    {
      id: '5',
      integration: 'QuickBooks',
      dataType: 'Payments',
      recordsImported: 312,
      status: 'success',
      timestamp: '2024-11-08 11:30 AM',
      duration: '3m 45s',
    },
  ];

  const getStatusBadge = (status: string) => {
    const configs = {
      connected: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
      available: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Cloud },
      error: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
    };
    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getImportStatusBadge = (status: string) => {
    const configs = {
      success: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', icon: RefreshCw },
    };
    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const connectedIntegrations = integrations.filter(i => i.status === 'connected');
  const availableIntegrations = integrations.filter(i => i.status !== 'connected');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Auto-detect data source from file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') setDataSource('csv');
    else if (ext === 'xlsx' || ext === 'xls') setDataSource('excel');
    else if (ext === 'json') setDataSource('json');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !dataType) {
      alert('Please select a file and data type');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate file upload and processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully imported ${dataType} data from ${selectedFile.name}`);
      setShowImportDialog(false);
      setSelectedFile(null);
      setDataSource('');
      setDataType('');
    } catch (error) {
      alert('Failed to import data');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Back Button */}
      <a
        href="#/home"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft size={20} />
        <span>Back to Home</span>
      </a>
      
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Data Integrations"
          description="Connect and import data from external systems"
        />
        <button 
          onClick={() => setShowImportDialog(true)}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md"
        >
          <Upload size={20} />
          Import Data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Link2 className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl mb-1">{connectedIntegrations.length}</p>
          <p className="text-sm text-white/90">Connected Systems</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Database className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl mb-1">2,137</p>
          <p className="text-sm text-white/90">Total Records Imported</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <RefreshCw className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl mb-1">5</p>
          <p className="text-sm text-white/90">Syncs Today</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl mb-1">10:30 AM</p>
          <p className="text-sm text-white/90">Last Sync</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex items-center gap-1 p-1">
            {[
              { id: 'connected', label: 'Connected', icon: Link2, count: connectedIntegrations.length },
              { id: 'available', label: 'Available', icon: Cloud, count: availableIntegrations.length },
              { id: 'history', label: 'Import History', icon: Calendar, count: importHistory.length },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Connected Tab */}
        {activeTab === 'connected' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connectedIntegrations.map((integration, index) => {
                const gradients = [
                  'from-blue-50 to-indigo-50 border-blue-200',
                  'from-green-50 to-emerald-50 border-green-200',
                  'from-purple-50 to-pink-50 border-purple-200',
                ];
                const gradient = gradients[index % gradients.length];
                return (
                <div key={integration.id} className={`bg-gradient-to-br ${gradient} border rounded-lg p-6 hover:shadow-lg transition-all`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {integration.icon}
                      </div>
                      <div>
                        <h3 className="text-lg mb-1">{integration.name}</h3>
                        <p className="text-xs text-gray-500">{integration.type}</p>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last Sync</span>
                      <span className="text-gray-700">{integration.lastSync}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Records Synced</span>
                      <span className="text-gray-700">{integration.recordsCount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Data Types</p>
                    <div className="flex flex-wrap gap-2">
                      {integration.dataTypes.map((type) => (
                        <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex-1 px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm flex items-center justify-center gap-2">
                      <RefreshCw size={14} />
                      Sync Now
                    </button>
                    <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      <Settings size={14} />
                    </button>
                    <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Available Tab */}
        {activeTab === 'available' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableIntegrations.map((integration, index) => {
                const gradients = [
                  'from-orange-50 to-amber-50 border-orange-200',
                  'from-teal-50 to-cyan-50 border-teal-200',
                  'from-rose-50 to-pink-50 border-rose-200',
                ];
                const gradient = gradients[index % gradients.length];
                return (
                <div key={integration.id} className={`bg-gradient-to-br ${gradient} border rounded-lg p-6 hover:shadow-lg transition-all`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {integration.icon}
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>

                  <h3 className="text-lg mb-1">{integration.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{integration.type}</p>
                  <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Supports</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.dataTypes.slice(0, 3).map((type) => (
                        <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {type}
                        </span>
                      ))}
                      {integration.dataTypes.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{integration.dataTypes.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2">
                    <PlayCircle size={14} />
                    Connect Now
                  </button>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Import History Tab */}
        {activeTab === 'history' && (
          <div className="p-6">
            <div className="space-y-3">
              {importHistory.map((record, index) => {
                const statusColors = {
                  success: 'from-green-50 to-emerald-50 border-green-200',
                  failed: 'from-red-50 to-rose-50 border-red-200',
                  'in-progress': 'from-blue-50 to-sky-50 border-blue-200',
                };
                const color = statusColors[record.status];
                return (
                <div key={record.id} className={`bg-gradient-to-r ${color} border rounded-lg p-4 hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Database className="text-gray-600" size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm mb-1">{record.integration} → {record.dataType}</h4>
                        <p className="text-xs text-gray-500">{record.timestamp}</p>
                      </div>
                    </div>
                    {getImportStatusBadge(record.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Records</p>
                      <p className="text-sm">{record.recordsImported.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm">{record.duration}</p>
                    </div>
                    {record.errors !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500">Errors</p>
                        <p className="text-sm text-red-600">{record.errors}</p>
                      </div>
                    )}
                  </div>

                  {record.status === 'failed' && (
                    <div className="mt-3 flex items-center gap-2">
                      <button className="px-3 py-1 bg-pink-500 text-white rounded text-xs hover:bg-pink-600 transition-colors">
                        Retry Import
                      </button>
                      <button className="px-3 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50 transition-colors">
                        View Errors
                      </button>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Import Data Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Upload className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl">Import Data</h3>
                    <p className="text-sm text-white/80">Upload data from external files</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowImportDialog(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Source Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Data Source *</label>
                <select 
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select source...</option>
                  <option value="csv">CSV File</option>
                  <option value="excel">Excel File</option>
                  <option value="json">JSON File</option>
                  <option value="salesforce">Salesforce</option>
                  <option value="quickbooks">QuickBooks</option>
                </select>
              </div>

              {/* Data Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Data Type *</label>
                <select 
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select type...</option>
                  <option value="customers">Customers</option>
                  <option value="sales">Sales Orders</option>
                  <option value="invoices">Invoices</option>
                  <option value="payments">Payments</option>
                  <option value="products">Products</option>
                  <option value="contacts">Contacts</option>
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload File *</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-500'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  {selectedFile ? (
                    <div className="space-y-3">
                      <CheckCircle2 className="mx-auto text-green-500" size={48} />
                      <div>
                        <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setDataSource('');
                        }}
                        className="text-sm text-pink-600 hover:text-pink-700"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-sm text-gray-600 mb-1">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        Supported formats: CSV, Excel (.xlsx, .xls), JSON
                      </p>
                    </>
                  )}
                  <input 
                    id="file-input"
                    type="file" 
                    className="hidden" 
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              </div>

              {/* Mapping Options */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="text-white" size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm mb-1">Auto-mapping Available</h4>
                    <p className="text-xs text-gray-600">
                      We'll automatically map your data fields to COPCCA CRM fields based on column headers
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setSelectedFile(null);
                    setDataSource('');
                    setDataType('');
                  }}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!selectedFile || !dataType || isProcessing}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Start Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}