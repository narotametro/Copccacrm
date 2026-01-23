-- COPCCA CRM - Production Security Implementation
-- Execute this in Supabase SQL Editor to enhance security for production

-- ===========================================
-- ENHANCED RLS POLICIES
-- ===========================================

-- Drop existing basic policies and create production-grade ones

-- Companies: Users can only see companies they created, are assigned to, or if they're admin
DROP POLICY IF EXISTS "Users can view companies they created or are assigned to" ON companies;
CREATE POLICY "companies_select_policy" ON companies
  FOR SELECT USING (
    auth.uid() = created_by OR
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "companies_insert_policy" ON companies
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "companies_update_policy" ON companies
  FOR UPDATE USING (
    auth.uid() = created_by OR
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Deals: Users can only see deals for companies they have access to
DROP POLICY IF EXISTS "Users can view deals for their companies" ON deals;
CREATE POLICY "deals_select_policy" ON deals
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = deals.company_id AND (
        c.created_by = auth.uid() OR c.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "deals_insert_policy" ON deals
  FOR INSERT WITH CHECK (
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "deals_update_policy" ON deals
  FOR UPDATE USING (
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Users can only see their own profile, admins can see all
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Invoices: Users can only see invoices for companies they have access to
CREATE POLICY "invoices_select_policy" ON invoices
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = invoices.company_id AND (
        c.created_by = auth.uid() OR c.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "invoices_insert_policy" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "invoices_update_policy" ON invoices
  FOR UPDATE USING (auth.uid() = created_by);

-- Debt Collection: Users can only see debts for companies they have access to
CREATE POLICY "debt_collection_select_policy" ON debt_collection
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = debt_collection.company_id AND (
        c.created_by = auth.uid() OR c.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "debt_collection_insert_policy" ON debt_collection
  FOR INSERT WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "debt_collection_update_policy" ON debt_collection
  FOR UPDATE USING (auth.uid() = assigned_to);

-- After Sales: Users can only see after-sales records for companies they have access to
CREATE POLICY "after_sales_select_policy" ON after_sales
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = after_sales.company_id AND (
        c.created_by = auth.uid() OR c.assigned_to = auth.uid()
      )
    )
  );

-- Competitors: Read-only for all authenticated users
CREATE POLICY "competitors_select_policy" ON competitors
  FOR SELECT USING (auth.role() = 'authenticated');

-- Sales Strategies: Users with manager or admin role can manage
CREATE POLICY "sales_strategies_select_policy" ON sales_strategies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

CREATE POLICY "sales_strategies_insert_policy" ON sales_strategies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

-- User Permissions: Only admins can manage
CREATE POLICY "user_permissions_admin_only" ON user_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Invitation Links: Only admins can manage
CREATE POLICY "invitation_links_admin_only" ON invitation_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ===========================================
-- DATA VALIDATION TRIGGERS
-- ===========================================

-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email_format()
RETURNS trigger AS $$
BEGIN
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply email validation to users and companies
DROP TRIGGER IF EXISTS validate_user_email ON users;
CREATE TRIGGER validate_user_email
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION validate_email_format();

DROP TRIGGER IF EXISTS validate_company_email ON companies;
CREATE TRIGGER validate_company_email
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION validate_email_format();

-- Function to set updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===========================================
-- AUDIT LOGGING
-- ===========================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to log changes
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
DECLARE
  old_row JSONB;
  new_row JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_row = row_to_json(OLD)::JSONB;
    INSERT INTO audit_log (table_name, record_id, operation, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, old_row, auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_row = row_to_json(OLD)::JSONB;
    new_row = row_to_json(NEW)::JSONB;
    INSERT INTO audit_log (table_name, record_id, operation, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, old_row, new_row, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    new_row = row_to_json(NEW)::JSONB;
    INSERT INTO audit_log (table_name, record_id, operation, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, new_row, auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit logging to critical tables
CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_deals
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ===========================================
-- RATE LIMITING & SECURITY FUNCTIONS
-- ===========================================

-- Function to check rate limits (basic implementation)
CREATE OR REPLACE FUNCTION check_rate_limit(user_uuid UUID, action_type TEXT, max_requests INTEGER DEFAULT 100, window_minutes INTEGER DEFAULT 60)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM audit_log
  WHERE user_id = user_uuid
    AND table_name = action_type
    AND created_at > NOW() - INTERVAL '1 minute' * window_minutes;

  RETURN request_count < max_requests;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'COPCCA CRM Production Security Implementation Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Features Implemented:';
  RAISE NOTICE '✓ Enhanced Row Level Security (RLS) policies';
  RAISE NOTICE '✓ Data validation triggers';
  RAISE NOTICE '✓ Audit logging system';
  RAISE NOTICE '✓ Automatic timestamp updates';
  RAISE NOTICE '✓ Rate limiting functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Test all policies with different user roles';
  RAISE NOTICE '2. Configure monitoring and alerts';
  RAISE NOTICE '3. Set up automated backups';
  RAISE NOTICE '4. Implement API rate limiting in application';
  RAISE NOTICE '5. Add input sanitization in frontend';
END $$;