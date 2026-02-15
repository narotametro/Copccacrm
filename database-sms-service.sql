-- =====================================================
-- SMS LOGS TABLE
-- Purpose: Track all SMS messages sent for debt collection
-- =====================================================

-- Create SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL,
  message_body text NOT NULL,
  status varchar(20) NOT NULL, -- 'sent', 'failed', 'delivered', 'undelivered'
  provider varchar(20) NOT NULL, -- 'twilio', 'demo'
  message_id varchar(100), -- External message ID from SMS provider
  error_message text, -- Error details if failed
  debt_id uuid REFERENCES debts(id) ON DELETE SET NULL,
  invoice_number varchar(50),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  sent_by uuid REFERENCES users(id) ON DELETE SET NULL,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for fast querying
CREATE INDEX idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_debt_id ON sms_logs(debt_id);
CREATE INDEX idx_sms_logs_company_id ON sms_logs(company_id);
CREATE INDEX idx_sms_logs_created_at ON sms_logs(created_at DESC);
CREATE INDEX idx_sms_logs_sent_by ON sms_logs(sent_by);

-- Enable Row Level Security
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view SMS logs for their company
CREATE POLICY "Users can view company SMS logs"
ON sms_logs FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Users can insert SMS logs
CREATE POLICY "Users can insert SMS logs"
ON sms_logs FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Admins can manage all SMS logs for their company
CREATE POLICY "Admins can manage company SMS logs"
ON sms_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.company_id = sms_logs.company_id
  )
);

-- =====================================================
-- ADD PHONE NUMBER TO COMPANIES TABLE
-- =====================================================

-- Add phone number column to companies table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE companies ADD COLUMN phone_number varchar(20);
  END IF;
END $$;

-- =====================================================
-- ADD PHONE NUMBER TO CUSTOMERS TABLE (via companies)
-- =====================================================

-- Customers are linked to companies, so we get phone from companies table
-- But we can also add a direct contact phone for customers

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE companies ADD COLUMN contact_phone varchar(20);
  END IF;
END $$;

-- =====================================================
-- UPDATE DEBTS TABLE TO INCLUDE PHONE NUMBER
-- =====================================================

-- Add phone number to debts table for easy access
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'company_contact_phone'
  ) THEN
    ALTER TABLE debts ADD COLUMN company_contact_phone varchar(20);
  END IF;
END $$;

-- =====================================================
-- SMS CONFIGURATION IN SYSTEM SETTINGS
-- =====================================================

-- Add SMS configuration to system_settings if not exists
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('sms_enabled', 'false', 'Enable SMS reminders for debt collection', 'sms'),
  ('twilio_account_sid', '', 'Twilio Account SID', 'sms'),
  ('twilio_auth_token', '', 'Twilio Auth Token (encrypted)', 'sms'),
  ('twilio_phone_number', '', 'Twilio Phone Number (E.164 format, e.g., +1234567890)', 'sms')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get SMS delivery statistics
CREATE OR REPLACE FUNCTION get_sms_stats(p_company_id uuid, p_days int DEFAULT 30)
RETURNS json AS $$
DECLARE
  v_stats json;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'sent', COUNT(*) FILTER (WHERE status = 'sent'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'delivery_rate', ROUND(
      (COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::numeric / 
       NULLIF(COUNT(*), 0) * 100), 2
    ),
    'total_cost_estimate', COUNT(*) * 0.0075 -- Twilio avg cost per SMS
  ) INTO v_stats
  FROM sms_logs
  WHERE company_id = p_company_id
  AND created_at > now() - (p_days || ' days')::interval;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent SMS logs for a debt
CREATE OR REPLACE FUNCTION get_debt_sms_history(p_debt_id uuid)
RETURNS TABLE (
  sent_at timestamptz,
  phone_number varchar,
  status varchar,
  message_preview text,
  sent_by_name varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.created_at as sent_at,
    sl.phone_number,
    sl.status,
    LEFT(sl.message_body, 50) || '...' as message_preview,
    u.full_name as sent_by_name
  FROM sms_logs sl
  LEFT JOIN users u ON u.id = sl.sent_by
  WHERE sl.debt_id = p_debt_id
  ORDER BY sl.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER TO AUTO-UPDATE COMPANY_ID IN SMS LOGS
-- =====================================================

-- Automatically set company_id from the debt when inserting SMS log
CREATE OR REPLACE FUNCTION set_sms_log_company()
RETURNS trigger AS $$
BEGIN
  -- If company_id is not set and debt_id is provided, get it from debt
  IF NEW.company_id IS NULL AND NEW.debt_id IS NOT NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM debts
    WHERE id = NEW.debt_id;
  END IF;
  
  -- If still NULL, get from current user
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM users
    WHERE id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_sms_log_company ON sms_logs;
CREATE TRIGGER trigger_set_sms_log_company
BEFORE INSERT ON sms_logs
FOR EACH ROW
EXECUTE FUNCTION set_sms_log_company();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_sms_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_debt_sms_history TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE sms_logs IS 'Log of all SMS messages sent for debt collection and reminders';
COMMENT ON COLUMN sms_logs.status IS 'sent = successfully sent, failed = send failed, delivered = confirmed delivery, undelivered = failed to deliver';
COMMENT ON COLUMN sms_logs.provider IS 'SMS service provider used (twilio, demo)';
COMMENT ON FUNCTION get_sms_stats IS 'Get SMS delivery statistics for a company over specified days';
COMMENT ON FUNCTION get_debt_sms_history IS 'Get SMS history for a specific debt record';
