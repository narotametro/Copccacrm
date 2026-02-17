-- Fix COPCCA Admin Access to System Settings
-- Allow upsert operations for Twilio configuration

-- Create function to update system settings (bypasses RLS)
CREATE OR REPLACE FUNCTION upsert_system_setting(
  p_key TEXT,
  p_value TEXT,
  p_category TEXT DEFAULT 'general',
  p_description TEXT DEFAULT ''
)
RETURNS system_settings AS $$
DECLARE
  result system_settings;
BEGIN
  INSERT INTO system_settings (key, value, category, description)
  VALUES (p_key, p_value, p_category, p_description)
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    category = COALESCE(EXCLUDED.category, system_settings.category),
    description = COALESCE(EXCLUDED.description, system_settings.description),
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anonymous (since COPCCA admin is unauthenticated)
GRANT EXECUTE ON FUNCTION upsert_system_setting TO anon;
GRANT EXECUTE ON FUNCTION upsert_system_setting TO authenticated;

-- Also allow reading system_settings for anonymous users (for loading config)
DROP POLICY IF EXISTS "Allow anonymous read system settings" ON system_settings;
CREATE POLICY "Allow anonymous read system settings" ON system_settings
  FOR SELECT
  USING (true);

-- Create company_sms_balance table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_sms_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  balance_credits INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_sms_sent INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- RLS for company_sms_balance
ALTER TABLE company_sms_balance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read company SMS balance" ON company_sms_balance;
CREATE POLICY "Allow read company SMS balance" ON company_sms_balance
  FOR SELECT
  USING (true);

-- Verify setup
SELECT 
  'Setup Complete' as status,
  'COPCCA admin can now update system_settings' as message;

-- Show current system settings
SELECT key, value, category 
FROM system_settings 
WHERE category = 'sms'
ORDER BY key;
