# Integrations Tab - Technical Reference

## 📋 Component Overview

**File:** `src/pages/Integrations.tsx`  
**Type:** React Functional Component  
**Lines of Code:** ~1,200  
**Dependencies:** React, Lucide Icons, Card/Button UI components, Supabase, Sonner (toast)

---

## 🏗️ Architecture

### Component Structure
```
Integrations (Main)
├── OverviewSection
├── ConnectSystemsSection
├── ImportCenterSection
├── MappingRulesSection
├── SyncLogsSection
├── InsightsCenterSection
├── APIWebhooksSection
└── ConnectModal
```

### State Management
```typescript
// Active view
const [activeSubsection, setActiveSubsection] = useState<Subsection>('overview');

// Search & filters
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('all');

// Modal state
const [showConnectModal, setShowConnectModal] = useState(false);
const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

// Stats (populated from backend)
const [stats, setStats] = useState({
  connectedSystems: 3,
  syncStatus: 'healthy',
  lastSync: '12 minutes ago',
  issues: 2
});
```

---

## 🔌 Data Models

### Integration Interface
```typescript
interface Integration {
  id: string;                    // unique identifier
  name: string;                  // display name
  category: string;              // pos|accounting|communication|ecommerce|payments
  logo: string;                  // emoji or image URL
  description: string;           // short description
  status: 'connected' | 'disconnected' | 'warning';
  lastSync?: string;             // human-readable time
  icon: any;                     // Lucide icon component
}
```

### Sync Log Interface
```typescript
interface SyncLog {
  id: string;
  time: string;                  // human-readable timestamp
  system: string;                // integration name
  action: string;                // e.g., "Imported invoices"
  records: number;               // number of records processed
  status: 'success' | 'warning' | 'failed';
}
```

### Subsection Type
```typescript
type Subsection = 'overview' | 'connect' | 'import' | 'mapping' | 'logs' | 'insights' | 'api';
```

---

## 🎨 UI Components Used

### External Components
```typescript
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
```

### Icons
```typescript
import {
  Download, Upload, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  Link2, FileText, Settings, Activity, Brain, Code, Search, Play,
  Plus, TrendingUp, Users, Package, DollarSign, AlertCircle, Zap,
  Clock, Database, Target, BarChart3, ShieldCheck, MessageSquare,
  ShoppingCart, CreditCard, Smartphone, Mail, Globe, ArrowRight,
  ExternalLink, Filter, ChevronDown, Info, X, ChevronRight, Wallet
} from 'lucide-react';
```

---

## 📊 Backend Integration Points

### Expected Database Tables
*(To be created for full functionality)*

#### `integrations` Table
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL,  -- pos, accounting, etc.
  integration_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'disconnected',
  config JSONB,  -- API keys, settings
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `sync_logs` Table
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  records_processed INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL,  -- success, warning, failed
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `integration_mappings` Table
```sql
CREATE TABLE integration_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  external_field VARCHAR(100) NOT NULL,
  copcca_field VARCHAR(100) NOT NULL,
  transform_rule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `sync_rules` Table
```sql
CREATE TABLE sync_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL,  -- sync_auto, deduplicate, etc.
  rule_name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supabase Functions Needed

#### 1. Get Integration Stats
```typescript
// Function: get_integration_stats
async function getIntegrationStats(companyId: string) {
  const { data, error } = await supabase
    .rpc('get_integration_stats', { p_company_id: companyId });
  
  return {
    connectedSystems: data.connected_count,
    syncStatus: data.overall_status,
    lastSync: data.last_sync,
    issues: data.issue_count
  };
}
```

#### 2. Get Sync Logs
```typescript
async function getSyncLogs(companyId: string, filters: any) {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  return data;
}
```

#### 3. Connect Integration
```typescript
async function connectIntegration(companyId: string, integrationData: any) {
  const { data, error } = await supabase
    .from('integrations')
    .insert({
      company_id: companyId,
      integration_type: integrationData.category,
      integration_name: integrationData.name,
      status: 'connected',
      config: integrationData.config
    });
  
  return data;
}
```

---

## 🎯 Key Features Implementation

### 1. **Search & Filter**
```typescript
const filteredIntegrations = integrations.filter(integration => {
  const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       integration.description.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = selectedCategory === 'all' || 
                         selectedCategory === 'popular' && integration.status === 'connected' ||
                         integration.category === selectedCategory;
  return matchesSearch && matchesCategory;
});
```

### 2. **Connect Flow (Modal)**
```typescript
const ConnectModal = () => {
  // Step-by-step wizard:
  // 1. Authentication (API key input)
  // 2. Choose data to sync (checkboxes)
  // 3. Sync frequency (radio buttons: realtime, 1hour, daily)
  // 4. Confirm & start sync
  
  const handleConnect = async () => {
    // Call backend to save integration
    await connectIntegration(companyId, selectedIntegration);
    toast.success(`${selectedIntegration.name} connected successfully!`);
    setShowConnectModal(false);
  };
};
```

### 3. **Sync Status Indicators**
```typescript
// Green = Active, Orange = Warning, Red = Disconnected
{integration.status === 'connected' && <CheckCircle className="h-5 w-5 text-green-600" />}
{integration.status === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-600" />}
{integration.status === 'disconnected' && <XCircle className="h-5 w-5 text-red-600" />}
```

### 4. **AI Insights Loop**
```typescript
// Visual flow representation
<div className="flex items-center justify-center gap-3">
  <div>Invoices + POS + Inventory + Payments</div>
  <ArrowRight />
  <div>KPI Engine</div>
  <ArrowRight />
  <div>AI Insights</div>
  <ArrowRight />
  <div>Actions</div>
  <ArrowRight />
  <div>Growth 📈</div>
</div>
```

---

## 🔗 Integration Categories

### Available Categories
```typescript
const categories = [
  { id: 'all', label: 'All Integrations' },
  { id: 'popular', label: 'Popular' },
  { id: 'pos', label: 'POS Systems' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'communication', label: 'Communication' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'payments', label: 'Payments & Banks' }
];
```

### Pre-configured Integrations
```typescript
const integrations: Integration[] = [
  // POS
  { id: 'lightspeed', name: 'Lightspeed POS', category: 'pos', ... },
  { id: 'odoo', name: 'Odoo POS', category: 'pos', ... },
  
  // Accounting
  { id: 'quickbooks', name: 'QuickBooks', category: 'accounting', ... },
  { id: 'xero', name: 'Xero', category: 'accounting', ... },
  
  // Communication
  { id: 'whatsapp', name: 'WhatsApp Business', category: 'communication', ... },
  
  // Ecommerce
  { id: 'shopify', name: 'Shopify', category: 'ecommerce', ... },
  
  // Payments
  { id: 'm-pesa', name: 'M-Pesa', category: 'payments', ... },
  { id: 'airtel', name: 'Airtel Money', category: 'payments', ... }
];
```

---

## 🛠️ Extending the Feature

### Adding a New Integration

1. **Add to integrations array:**
```typescript
{
  id: 'stripe',
  name: 'Stripe',
  category: 'payments',
  logo: '💳',
  description: 'Global payment processing',
  status: 'disconnected',
  icon: CreditCard
}
```

2. **Create backend handler:**
```typescript
// src/lib/integrations/stripe.ts
export async function connectStripe(apiKey: string, companyId: string) {
  // Validate API key
  // Store in integrations table
  // Set up webhook
}

export async function syncStripePayments(companyId: string) {
  // Fetch payments from Stripe API
  // Transform data
  // Insert into COPCCA database
  // Log sync
}
```

3. **Add to connect modal logic:**
```typescript
if (selectedIntegration.id === 'stripe') {
  // Show Stripe-specific fields
  // Handle Stripe OAuth flow
}
```

### Adding a New Subsection

1. **Add to Subsection type:**
```typescript
type Subsection = 'overview' | 'connect' | 'import' | 'mapping' | 'logs' | 'insights' | 'api' | 'custom';
```

2. **Add to submenu:**
```typescript
const subsections = [
  // ... existing
  { id: 'custom', label: 'Custom Section', icon: CustomIcon }
];
```

3. **Create section component:**
```typescript
const CustomSection = () => (
  <div className="space-y-6">
    <h2>Custom Section</h2>
    {/* Content */}
  </div>
);
```

4. **Add to render logic:**
```typescript
{activeSubsection === 'custom' && <CustomSection />}
```

---

## 🎨 Styling Guide

### Color Palette
```css
/* Status colors */
--success: #10B981 (green-600)
--warning: #F59E0B (orange-600)
--error: #EF4444 (red-600)
--info: #3B82F6 (blue-600)

/* UI colors */
--primary: #3B82F6 (blue-600)
--secondary: #8B5CF6 (purple-600)
--background: linear-gradient(to-br, from-slate-50, to-slate-100)
```

### Card Pattern
```tsx
<Card className="p-6 hover:shadow-lg transition-all">
  {/* Content */}
</Card>
```

### Button Pattern
```tsx
<Button className="bg-blue-600 hover:bg-blue-700">
  <Icon className="h-4 w-4 mr-2" />
  Action
</Button>
```

---

## 🔒 Security Considerations

### API Key Storage
```typescript
// DO NOT store plain-text API keys in frontend state
// Always encrypt before sending to backend
const encryptedKey = await encryptAPIKey(apiKey);

// Store in database with encryption
await supabase.from('integrations').insert({
  config: { api_key_encrypted: encryptedKey }
});
```

### RLS Policies
```sql
-- Users can only see their company's integrations
CREATE POLICY "Users can view company integrations"
ON integrations FOR SELECT
USING (company_id IN (
  SELECT company_id FROM users WHERE id = auth.uid()
));

-- Only admins can connect sensitive integrations
CREATE POLICY "Admins can manage integrations"
ON integrations FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## 📈 Performance Optimization

### Lazy Loading
```typescript
// Load integration icons only when needed
const IntegrationIcon = lazy(() => import('./icons/IntegrationIcon'));

// Load large subsections on demand
const InsightsCenterSection = lazy(() => import('./sections/InsightsCenter'));
```

### Pagination for Logs
```typescript
// Limit logs to 50 per page, load more on scroll
const [page, setPage] = useState(1);
const LOGS_PER_PAGE = 50;

const { data, error } = await supabase
  .from('sync_logs')
  .select('*')
  .range((page - 1) * LOGS_PER_PAGE, page * LOGS_PER_PAGE - 1);
```

### Debounced Search
```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Integration filtering by category
- [ ] Search functionality
- [ ] Status indicator logic
- [ ] Modal open/close state

### Integration Tests
- [ ] Connect new integration flow
- [ ] Sync log retrieval
- [ ] Import data flow
- [ ] Mapping rules save/load

### E2E Tests
- [ ] User can connect WhatsApp integration
- [ ] User can view sync logs
- [ ] User can import CSV file
- [ ] AI recommendations display correctly

---

## 📝 Future Enhancements

### Phase 2
- [ ] Real-time sync status updates (WebSocket)
- [ ] Custom integration builder (no-code)
- [ ] Scheduled sync jobs
- [ ] Multi-branch sync management

### Phase 3
- [ ] AI-powered field mapping
- [ ] Conflict resolution UI
- [ ] Integration marketplace
- [ ] Zapier-style workflow builder

---

## 🆘 Troubleshooting

### Common Issues

#### Issue: Modal doesn't close
```typescript
// Ensure both state variables are reset
setShowConnectModal(false);
setSelectedIntegration(null);
```

#### Issue: Sync logs not loading
```typescript
// Check RLS policies
// Verify company_id in query
// Check Supabase connection
```

#### Issue: Icons not displaying
```typescript
// Ensure all icons are imported
import { Icon } from 'lucide-react';

// Check icon prop type
icon: Icon  // Should be component reference, not string
```

---

## 📞 Developer Support

**Questions?** Contact:
- Email: dev@copcca.com
- Slack: #integrations-dev
- Docs: https://docs.copcca.com/dev/integrations

---

**Last Updated:** February 12, 2026  
**Version:** 1.0.0  
**Author:** COPCCA Development Team
