-- =====================================================
-- COPCCA CRM: Integrations System Database Schema
-- =====================================================
-- This creates tables for managing third-party integrations,
-- sync logs, field mappings, and sync rules.

-- =====================================================
-- 1. INTEGRATIONS TABLE
-- =====================================================
-- Stores connected third-party integrations
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Integration Details
  integration_type VARCHAR(50) NOT NULL, -- pos, accounting, communication, ecommerce, payments
  integration_name VARCHAR(100) NOT NULL, -- Lightspeed, QuickBooks, WhatsApp, etc.
  integration_id VARCHAR(50) NOT NULL, -- unique identifier (lightspeed, quickbooks, etc.)
  
  -- Status
  status VARCHAR(20) DEFAULT 'disconnected', -- connected, disconnected, warning, error
  is_active BOOLEAN DEFAULT true,
  
  -- Configuration
  config JSONB, -- API keys, tokens, settings (encrypted)
  sync_frequency VARCHAR(20) DEFAULT 'realtime', -- realtime, 1hour, daily
  sync_data_types TEXT[], -- ['customers', 'products', 'sales', 'payments', 'inventory']
  
  -- Sync Status
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status VARCHAR(20), -- success, warning, failed
  last_sync_records INTEGER DEFAULT 0,
  last_error_message TEXT,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- Statistics
  total_syncs INTEGER DEFAULT 0,
  successful_syncs INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  total_records_synced BIGINT DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(company_id, integration_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_company ON integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active) WHERE is_active = true;

-- =====================================================
-- 2. SYNC LOGS TABLE
-- =====================================================
-- Tracks all sync operations and their results
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Sync Details
  action VARCHAR(100) NOT NULL, -- Imported invoices, Synced payments, etc.
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL, -- success, warning, failed
  error_message TEXT,
  error_details JSONB,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Metadata
  metadata JSONB, -- Additional context, filters used, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_company ON sync_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at DESC);

-- =====================================================
-- 3. INTEGRATION MAPPINGS TABLE
-- =====================================================
-- Maps external system fields to COPCCA fields
CREATE TABLE IF NOT EXISTS integration_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Mapping Details
  external_field VARCHAR(100) NOT NULL, -- e.g., external.customer_name
  copcca_field VARCHAR(100) NOT NULL, -- e.g., copcca.customer.full_name
  copcca_table VARCHAR(50) NOT NULL, -- customers, products, invoices, etc.
  
  -- Transformation
  transform_rule JSONB, -- { "type": "uppercase", "default": "Unknown" }
  is_required BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(integration_id, external_field)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integration_mappings_company ON integration_mappings(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_mappings_integration ON integration_mappings(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_mappings_table ON integration_mappings(copcca_table);

-- =====================================================
-- 4. SYNC RULES TABLE
-- =====================================================
-- Automated sync rules and workflows
CREATE TABLE IF NOT EXISTS sync_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Rule Details
  rule_type VARCHAR(50) NOT NULL, -- sync_auto, deduplicate, merge, transform, notify
  rule_name VARCHAR(200) NOT NULL, -- "Sync new customers automatically"
  rule_description TEXT,
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- execution order
  conditions JSONB, -- { "field": "status", "operator": "equals", "value": "new" }
  actions JSONB, -- { "action": "create", "target": "customers" }
  
  -- Statistics
  times_triggered INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_rules_company ON sync_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_sync_rules_integration ON sync_rules(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_rules_active ON sync_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sync_rules_type ON sync_rules(rule_type);

-- =====================================================
-- 5. DEDUPLICATION RULES TABLE
-- =====================================================
-- Rules for detecting and merging duplicate records
CREATE TABLE IF NOT EXISTS deduplication_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Rule Details
  entity_type VARCHAR(50) NOT NULL, -- customers, products
  rule_name VARCHAR(200) NOT NULL, -- "Merge customers with same phone"
  
  -- Matching Criteria
  match_fields TEXT[] NOT NULL, -- ['phone'], ['email'], ['sku']
  match_strategy VARCHAR(20) DEFAULT 'exact', -- exact, fuzzy, soundex
  
  -- Actions
  is_active BOOLEAN DEFAULT true,
  auto_merge BOOLEAN DEFAULT false, -- if false, requires admin approval
  merge_strategy VARCHAR(20) DEFAULT 'newest', -- newest, oldest, manual
  
  -- Statistics
  duplicates_found INTEGER DEFAULT 0,
  records_merged INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deduplication_rules_company ON deduplication_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_deduplication_rules_entity ON deduplication_rules(entity_type);
CREATE INDEX IF NOT EXISTS idx_deduplication_rules_active ON deduplication_rules(is_active) WHERE is_active = true;

-- =====================================================
-- 6. IMPORT JOBS TABLE
-- =====================================================
-- Tracks manual imports from Excel/CSV
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Import Details
  import_type VARCHAR(50) NOT NULL, -- customers, products, invoices, etc.
  file_name VARCHAR(255),
  file_url TEXT,
  source_type VARCHAR(50), -- excel, csv, google_sheets, paste
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Results
  total_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  invalid_rows INTEGER DEFAULT 0,
  created_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  
  -- Errors
  errors JSONB, -- [{ "row": 5, "error": "Missing phone number" }]
  
  -- Preview
  preview_data JSONB, -- First 20 rows for preview
  field_mappings JSONB, -- Detected or manual field mappings
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_import_jobs_company ON import_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON import_jobs(created_at DESC);

-- =====================================================
-- 7. INTEGRATION WEBHOOKS TABLE
-- =====================================================
-- Webhook endpoints for receiving events
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Webhook Details
  webhook_url TEXT NOT NULL,
  webhook_secret VARCHAR(255), -- for signature verification
  event_types TEXT[], -- ['invoice.created', 'payment.received']
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  total_triggers INTEGER DEFAULT 0,
  failed_triggers INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_company ON integration_webhooks(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_integration ON integration_webhooks(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_active ON integration_webhooks(is_active) WHERE is_active = true;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE deduplication_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: INTEGRATIONS
-- =====================================================

-- View: Users can see their company's integrations
CREATE POLICY "Users can view company integrations"
ON integrations FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Insert: Admins can create integrations
CREATE POLICY "Admins can create integrations"
ON integrations FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Update: Admins can update integrations
CREATE POLICY "Admins can update integrations"
ON integrations FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Delete: Admins can delete integrations
CREATE POLICY "Admins can delete integrations"
ON integrations FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- RLS POLICIES: SYNC LOGS
-- =====================================================

CREATE POLICY "Users can view company sync logs"
ON sync_logs FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "System can manage sync logs"
ON sync_logs FOR ALL
USING (true);

-- =====================================================
-- RLS POLICIES: INTEGRATION MAPPINGS
-- =====================================================

CREATE POLICY "Users can view company mappings"
ON integration_mappings FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage mappings"
ON integration_mappings FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- RLS POLICIES: SYNC RULES
-- =====================================================

CREATE POLICY "Users can view company sync rules"
ON sync_rules FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage sync rules"
ON sync_rules FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- RLS POLICIES: DEDUPLICATION RULES
-- =====================================================

CREATE POLICY "Users can view deduplication rules"
ON deduplication_rules FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage deduplication rules"
ON deduplication_rules FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- RLS POLICIES: IMPORT JOBS
-- =====================================================

CREATE POLICY "Users can view company import jobs"
ON import_jobs FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create import jobs"
ON import_jobs FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update company import jobs"
ON import_jobs FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete company import jobs"
ON import_jobs FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES: INTEGRATION WEBHOOKS
-- =====================================================

CREATE POLICY "Users can view company webhooks"
ON integration_webhooks FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert webhooks"
ON integration_webhooks FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update company webhooks"
ON integration_webhooks FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can delete webhooks"
ON integration_webhooks FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_mappings_updated_at BEFORE UPDATE ON integration_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_rules_updated_at BEFORE UPDATE ON sync_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deduplication_rules_updated_at BEFORE UPDATE ON deduplication_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_webhooks_updated_at BEFORE UPDATE ON integration_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. FUNCTION: Get Integration Stats
-- =====================================================

CREATE OR REPLACE FUNCTION get_integration_stats(p_company_id UUID)
RETURNS TABLE(
  connected_count INTEGER,
  overall_status VARCHAR,
  last_sync VARCHAR,
  issue_count INTEGER
) AS $$
DECLARE
  v_connected INTEGER;
  v_warning INTEGER;
  v_failed INTEGER;
  v_last_sync TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count connected integrations
  SELECT COUNT(*) INTO v_connected
  FROM integrations
  WHERE company_id = p_company_id AND status = 'connected';
  
  -- Count warnings and errors
  SELECT 
    COUNT(*) FILTER (WHERE status = 'warning'),
    COUNT(*) FILTER (WHERE status IN ('error', 'failed'))
  INTO v_warning, v_failed
  FROM integrations
  WHERE company_id = p_company_id;
  
  -- Get last sync time
  SELECT MAX(last_sync_at) INTO v_last_sync
  FROM integrations
  WHERE company_id = p_company_id;
  
  RETURN QUERY SELECT
    v_connected,
    CASE 
      WHEN v_failed > 0 THEN 'error'::VARCHAR
      WHEN v_warning > 0 THEN 'warning'::VARCHAR
      ELSE 'healthy'::VARCHAR
    END,
    CASE 
      WHEN v_last_sync IS NULL THEN 'Never'::VARCHAR
      WHEN v_last_sync > NOW() - INTERVAL '1 hour' THEN 
        (ROUND(EXTRACT(EPOCH FROM (NOW() - v_last_sync)) / 60) || ' minutes ago')::VARCHAR
      ELSE 
        TO_CHAR(v_last_sync, 'YYYY-MM-DD HH24:MI')::VARCHAR
    END,
    v_warning + v_failed;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. SEED DEFAULT DEDUPLICATION RULES
-- =====================================================

-- Note: These will be created when a company first accesses the Integrations tab
-- For now, this is a template for the backend to use

-- Example rules (to be inserted programmatically):
-- 1. Merge customers with same phone number
-- 2. Merge customers with same email
-- 3. Merge products with same SKU
-- 4. Ask admin before merging

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Integrations database schema created successfully!';
  RAISE NOTICE '📊 Tables created: integrations, sync_logs, integration_mappings, sync_rules, deduplication_rules, import_jobs, integration_webhooks';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚙️  Helper functions and triggers created';
  RAISE NOTICE '🚀 Ready to connect third-party systems!';
END $$;
