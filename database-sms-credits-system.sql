-- =====================================================
-- CENTRALIZED SMS CREDITS SYSTEM
-- Purpose: COPCCA provides SMS service, companies buy credits
-- No need for individual Twilio accounts!
-- =====================================================

-- =====================================================
-- COMPANY SMS BALANCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS company_sms_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric(10, 2) DEFAULT 0.00, -- SMS credits balance
  total_purchased numeric(10, 2) DEFAULT 0.00, -- Total credits ever purchased
  total_spent numeric(10, 2) DEFAULT 0.00, -- Total credits spent
  total_sms_sent int DEFAULT 0, -- Total SMS count
  last_topup_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_sms_balance_company ON company_sms_balance(company_id);

-- Enable RLS
ALTER TABLE company_sms_balance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their company's balance
CREATE POLICY "Users can view company sms balance"
ON company_sms_balance FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Admins can manage their company's balance
CREATE POLICY "Admins can manage company sms balance"
ON company_sms_balance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.company_id = company_sms_balance.company_id
  )
);

-- =====================================================
-- SMS PRICING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name varchar(50) NOT NULL,
  sms_count int NOT NULL, -- Number of SMS in package
  price_usd numeric(10, 2) NOT NULL, -- Price in USD
  price_tzs numeric(10, 2), -- Price in TZS (optional)
  price_kes numeric(10, 2), -- Price in KES (optional)
  discount_percentage int DEFAULT 0, -- Discount for bulk
  is_active boolean DEFAULT true,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Sample pricing packages
INSERT INTO sms_pricing (package_name, sms_count, price_usd, price_tzs, price_kes, discount_percentage, description, sort_order)
VALUES 
  ('Starter Pack', 100, 2.00, 4600, 260, 0, 'Perfect for small businesses', 1),
  ('Business Pack', 500, 8.00, 18400, 1040, 10, 'Most popular - 10% discount', 2),
  ('Professional Pack', 1000, 14.00, 32200, 1820, 15, 'Best value - 15% discount', 3),
  ('Enterprise Pack', 5000, 60.00, 138000, 7800, 20, 'Maximum savings - 20% discount', 4),
  ('Mega Pack', 10000, 100.00, 230000, 13000, 30, 'Huge discount - 30% off', 5)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE sms_pricing ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view pricing (public)
CREATE POLICY "Anyone can view sms pricing"
ON sms_pricing FOR SELECT
USING (is_active = true);

-- =====================================================
-- SMS TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  transaction_type varchar(20) NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus'
  amount numeric(10, 2) NOT NULL, -- Credit amount
  sms_count int, -- Number of SMS (for usage transactions)
  balance_before numeric(10, 2) NOT NULL,
  balance_after numeric(10, 2) NOT NULL,
  payment_method varchar(50), -- 'mpesa', 'card', 'bank_transfer', 'free_trial'
  payment_reference varchar(100), -- Payment transaction ID
  package_id uuid REFERENCES sms_pricing(id),
  description text,
  processed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_sms_transactions_company ON sms_transactions(company_id);
CREATE INDEX idx_sms_transactions_type ON sms_transactions(transaction_type);
CREATE INDEX idx_sms_transactions_created ON sms_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE sms_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their company's transactions
CREATE POLICY "Users can view company sms transactions"
ON sms_transactions FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: System can insert transactions
CREATE POLICY "System can insert sms transactions"
ON sms_transactions FOR INSERT
WITH CHECK (true);

-- =====================================================
-- UPDATE SMS LOGS TO TRACK COST
-- =====================================================

-- Add cost tracking to sms_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sms_logs' AND column_name = 'credits_charged'
  ) THEN
    ALTER TABLE sms_logs ADD COLUMN credits_charged numeric(10, 4) DEFAULT 0.02;
    COMMENT ON COLUMN sms_logs.credits_charged IS 'SMS credits deducted for this message (typically 0.02 per SMS)';
  END IF;
END $$;

-- =====================================================
-- CENTRAL TWILIO CONFIGURATION (Admin Only)
-- =====================================================

-- Update system_settings for central Twilio config
-- These should only be accessible to COPCCA admins, not regular users
UPDATE system_settings 
SET description = '[COPCCA ADMIN ONLY] Central Twilio Account SID - users do not need this'
WHERE key = 'twilio_account_sid';

UPDATE system_settings 
SET description = '[COPCCA ADMIN ONLY] Central Twilio Auth Token - users do not need this'
WHERE key = 'twilio_auth_token';

UPDATE system_settings 
SET description = '[COPCCA ADMIN ONLY] Central Twilio Phone Number - users do not need this'
WHERE key = 'twilio_phone_number';

-- Add cost per SMS setting
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('sms_cost_per_message', '0.02', 'Credits charged per SMS sent (default: $0.02)', 'sms'),
  ('sms_free_trial_credits', '10.00', 'Free SMS credits for new companies', 'sms'),
  ('sms_low_balance_threshold', '5.00', 'Alert when balance drops below this amount', 'sms')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get company SMS balance
CREATE OR REPLACE FUNCTION get_company_sms_balance(p_company_id uuid)
RETURNS numeric AS $$
DECLARE
  v_balance numeric;
BEGIN
  SELECT balance INTO v_balance
  FROM company_sms_balance
  WHERE company_id = p_company_id;
  
  -- If no record exists, create one with free trial credits
  IF v_balance IS NULL THEN
    INSERT INTO company_sms_balance (company_id, balance, total_purchased)
    VALUES (p_company_id, 10.00, 10.00)
    RETURNING balance INTO v_balance;
    
    -- Record free trial transaction
    INSERT INTO sms_transactions (
      company_id, 
      transaction_type, 
      amount, 
      balance_before, 
      balance_after,
      payment_method,
      description
    ) VALUES (
      p_company_id,
      'bonus',
      10.00,
      0.00,
      10.00,
      'free_trial',
      'Welcome bonus - Free SMS credits for new company'
    );
  END IF;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct SMS credits
CREATE OR REPLACE FUNCTION deduct_sms_credits(
  p_company_id uuid,
  p_credits_amount numeric,
  p_sms_log_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM company_sms_balance
  WHERE company_id = p_company_id
  FOR UPDATE; -- Lock row to prevent race conditions
  
  -- Check if sufficient balance
  IF v_current_balance IS NULL OR v_current_balance < p_credits_amount THEN
    RETURN false; -- Insufficient balance
  END IF;
  
  v_new_balance := v_current_balance - p_credits_amount;
  
  -- Update balance
  UPDATE company_sms_balance
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_credits_amount,
    total_sms_sent = total_sms_sent + 1,
    updated_at = now()
  WHERE company_id = p_company_id;
  
  -- Record transaction
  INSERT INTO sms_transactions (
    company_id,
    transaction_type,
    amount,
    sms_count,
    balance_before,
    balance_after,
    description
  ) VALUES (
    p_company_id,
    'usage',
    p_credits_amount,
    1,
    v_current_balance,
    v_new_balance,
    'SMS sent - credits deducted'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add SMS credits (topup)
CREATE OR REPLACE FUNCTION add_sms_credits(
  p_company_id uuid,
  p_credits_amount numeric,
  p_payment_method varchar DEFAULT 'mpesa',
  p_payment_reference varchar DEFAULT NULL,
  p_package_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Get current balance (or create record with free trial)
  v_current_balance := get_company_sms_balance(p_company_id);
  v_new_balance := v_current_balance + p_credits_amount;
  
  -- Update balance
  UPDATE company_sms_balance
  SET 
    balance = v_new_balance,
    total_purchased = total_purchased + p_credits_amount,
    last_topup_at = now(),
    updated_at = now()
  WHERE company_id = p_company_id;
  
  -- Record transaction
  INSERT INTO sms_transactions (
    company_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    payment_method,
    payment_reference,
    package_id,
    description
  ) VALUES (
    p_company_id,
    'purchase',
    p_credits_amount,
    v_current_balance,
    v_new_balance,
    p_payment_method,
    p_payment_reference,
    p_package_id,
    'SMS credits purchased'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if company has sufficient SMS balance
CREATE OR REPLACE FUNCTION has_sufficient_sms_balance(
  p_company_id uuid,
  p_required_credits numeric DEFAULT 0.02
)
RETURNS boolean AS $$
DECLARE
  v_balance numeric;
BEGIN
  v_balance := get_company_sms_balance(p_company_id);
  RETURN v_balance >= p_required_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SMS usage statistics
CREATE OR REPLACE FUNCTION get_sms_usage_stats(p_company_id uuid, p_days int DEFAULT 30)
RETURNS json AS $$
DECLARE
  v_stats json;
  v_balance numeric;
  v_total_sent int;
  v_total_spent numeric;
BEGIN
  -- Get current balance
  SELECT balance, total_sms_sent, total_spent 
  INTO v_balance, v_total_sent, v_total_spent
  FROM company_sms_balance
  WHERE company_id = p_company_id;
  
  -- Build stats JSON
  SELECT json_build_object(
    'current_balance', COALESCE(v_balance, 0),
    'total_sms_sent', COALESCE(v_total_sent, 0),
    'total_spent', COALESCE(v_total_spent, 0),
    'sms_last_30_days', (
      SELECT COUNT(*) FROM sms_logs 
      WHERE company_id = p_company_id 
      AND created_at > now() - (p_days || ' days')::interval
    ),
    'estimated_remaining_sms', FLOOR(COALESCE(v_balance, 0) / 0.02),
    'low_balance_warning', COALESCE(v_balance, 0) < 5.00
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER TO AUTO-DEDUCT CREDITS ON SMS SEND
-- =====================================================

-- Automatically deduct credits when SMS is logged as sent
CREATE OR REPLACE FUNCTION auto_deduct_sms_credits()
RETURNS trigger AS $$
BEGIN
  -- Only deduct if SMS was successfully sent
  IF NEW.status = 'sent' THEN
    -- Deduct credits (default 0.02 per SMS)
    PERFORM deduct_sms_credits(
      NEW.company_id,
      COALESCE(NEW.credits_charged, 0.02),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_deduct_sms_credits ON sms_logs;
CREATE TRIGGER trigger_auto_deduct_sms_credits
AFTER INSERT ON sms_logs
FOR EACH ROW
EXECUTE FUNCTION auto_deduct_sms_credits();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_company_sms_balance TO authenticated;
GRANT EXECUTE ON FUNCTION has_sufficient_sms_balance TO authenticated;
GRANT EXECUTE ON FUNCTION get_sms_usage_stats TO authenticated;
GRANT EXECUTE ON FUNCTION add_sms_credits TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE company_sms_balance IS 'SMS credits balance for each company - centralized system managed by COPCCA';
COMMENT ON TABLE sms_pricing IS 'SMS credit packages available for purchase';
COMMENT ON TABLE sms_transactions IS 'All SMS credit transactions (purchases, usage, refunds)';
COMMENT ON FUNCTION get_company_sms_balance IS 'Get current SMS balance, auto-creates with free trial if not exists';
COMMENT ON FUNCTION deduct_sms_credits IS 'Deduct credits when SMS is sent';
COMMENT ON FUNCTION add_sms_credits IS 'Add credits when company purchases SMS package';
COMMENT ON FUNCTION has_sufficient_sms_balance IS 'Check if company has enough credits before sending SMS';
COMMENT ON FUNCTION get_sms_usage_stats IS 'Get comprehensive SMS usage statistics for a company';

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- View company balance
-- SELECT * FROM get_company_sms_balance('your-company-id'::uuid);

-- Check if can send SMS
-- SELECT has_sufficient_sms_balance('your-company-id'::uuid);

-- Get usage stats
-- SELECT * FROM get_sms_usage_stats('your-company-id'::uuid, 30);

-- Purchase credits
-- SELECT add_sms_credits('your-company-id'::uuid, 2.00, 'mpesa', 'RX12345', 'package-id'::uuid);

-- View all pricing packages
-- SELECT * FROM sms_pricing WHERE is_active = true ORDER BY sort_order;

-- View transaction history
-- SELECT * FROM sms_transactions WHERE company_id = 'your-company-id'::uuid ORDER BY created_at DESC;
