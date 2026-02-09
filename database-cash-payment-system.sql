-- ===========================================
-- CASH PAYMENT SYSTEM IMPLEMENTATION
-- Enable cash payments for COPCCA CRM subscriptions
-- ===========================================

-- ===========================================
-- 1. ADD CASH PAYMENT SUPPORT TO PAYMENT METHODS
-- ===========================================

-- Add cash payment method to subscription_payments table
-- The payment_method field already exists, but let's ensure it supports 'cash'

-- Create a function to record cash payments and activate subscriptions
CREATE OR REPLACE FUNCTION record_cash_payment(
  p_subscription_id UUID,
  p_amount DECIMAL(10,2),
  p_currency TEXT DEFAULT 'TZS',
  p_payment_date TIMESTAMPTZ DEFAULT NOW(),
  p_collector_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_current_status TEXT;
BEGIN
  -- Get subscription details
  SELECT user_id, status INTO v_user_id, v_current_status
  FROM user_subscriptions
  WHERE id = p_subscription_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Insert payment record
  INSERT INTO subscription_payments (
    subscription_id,
    amount,
    currency,
    status,
    payment_method,
    payment_date,
    transaction_id,
    notes,
    created_by
  ) VALUES (
    p_subscription_id,
    p_amount,
    p_currency,
    'completed',
    'cash',
    p_payment_date,
    'CASH-' || p_subscription_id || '-' || EXTRACT(EPOCH FROM NOW()),
    COALESCE(p_notes, 'Cash payment recorded'),
    COALESCE(p_collector_id, v_user_id)
  );

  -- Activate subscription if it was past_due or trial
  IF v_current_status IN ('past_due', 'trial') THEN
    UPDATE user_subscriptions
    SET
      status = 'active',
      current_period_start = p_payment_date,
      current_period_end = p_payment_date + INTERVAL '30 days',
      last_payment_date = p_payment_date,
      payment_method = 'cash',
      updated_at = NOW()
    WHERE id = p_subscription_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 2. CREATE CASH PAYMENT TRACKING TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS cash_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  collected_by UUID REFERENCES users(id),
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  payment_location TEXT, -- e.g., 'office', 'branch', 'online'
  customer_name TEXT,
  customer_phone TEXT,
  receipt_number TEXT UNIQUE,
  notes TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for cash payments
ALTER TABLE cash_payments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all cash payments
CREATE POLICY "Admins can manage cash payments" ON cash_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Users can view their own cash payments
CREATE POLICY "Users can view own cash payments" ON cash_payments
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM user_subscriptions
      WHERE user_id = auth.uid()
    )
  );

-- ===========================================
-- 3. CREATE CASH PAYMENT VERIFICATION FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION verify_cash_payment(
  p_payment_id UUID,
  p_verifier_id UUID,
  p_status TEXT DEFAULT 'verified'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id UUID;
  v_amount DECIMAL(10,2);
BEGIN
  -- Get payment details
  SELECT subscription_id, amount INTO v_subscription_id, v_amount
  FROM cash_payments
  WHERE id = p_payment_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending cash payment not found';
  END IF;

  -- Update cash payment status
  UPDATE cash_payments
  SET
    status = p_status,
    verified_by = p_verifier_id,
    verified_at = NOW(),
    updated_at = NOW()
  WHERE id = p_payment_id;

  -- If verified, record the payment and activate subscription
  IF p_status = 'verified' THEN
    PERFORM record_cash_payment(
      v_subscription_id,
      v_amount,
      'TZS',
      NOW(),
      p_verifier_id,
      'Verified cash payment'
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 4. CREATE CASH PAYMENT REPORTING FUNCTIONS
-- ===========================================

-- Get cash payments summary
CREATE OR REPLACE FUNCTION get_cash_payments_summary(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_payments BIGINT,
  total_amount DECIMAL(10,2),
  verified_payments BIGINT,
  pending_payments BIGINT,
  rejected_payments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_payments,
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) FILTER (WHERE status = 'verified') as verified_payments,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_payments
  FROM cash_payments
  WHERE payment_date >= p_start_date
  AND payment_date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get cash payments by collector
CREATE OR REPLACE FUNCTION get_cash_payments_by_collector(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  collector_id UUID,
  collector_name TEXT,
  total_payments BIGINT,
  total_amount DECIMAL(10,2),
  verified_amount DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as collector_id,
    u.full_name as collector_name,
    COUNT(cp.*) as total_payments,
    COALESCE(SUM(cp.amount), 0) as total_amount,
    COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'verified'), 0) as verified_amount
  FROM users u
  LEFT JOIN cash_payments cp ON u.id = cp.collected_by
    AND cp.payment_date >= p_start_date
    AND cp.payment_date <= p_end_date
  WHERE u.role IN ('admin', 'manager')
  GROUP BY u.id, u.full_name
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 5. UPDATE EXISTING FUNCTIONS TO SUPPORT CASH
-- ===========================================

-- Update the activateSubscriptionWithPayment function to support cash payments
CREATE OR REPLACE FUNCTION activate_subscription_with_payment(
  p_user_id UUID,
  p_payment_method TEXT DEFAULT 'card',
  p_transaction_id TEXT DEFAULT NULL,
  p_amount DECIMAL(10,2) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id UUID;
  v_plan_amount DECIMAL(10,2);
BEGIN
  -- Find past_due subscription for user
  SELECT us.id, sp.price_monthly
  INTO v_subscription_id, v_plan_amount
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  AND us.status = 'past_due'
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Use provided amount or plan default
  v_plan_amount := COALESCE(p_amount, v_plan_amount);

  -- Record payment
  INSERT INTO subscription_payments (
    subscription_id,
    amount,
    currency,
    status,
    payment_method,
    transaction_id,
    payment_date
  ) VALUES (
    v_subscription_id,
    v_plan_amount,
    'TZS',
    'completed',
    p_payment_method,
    COALESCE(p_transaction_id, 'CASH-' || v_subscription_id || '-' || EXTRACT(EPOCH FROM NOW())),
    NOW()
  );

  -- Activate subscription
  UPDATE user_subscriptions
  SET
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '30 days',
    last_payment_date = NOW(),
    payment_method = p_payment_method,
    updated_at = NOW()
  WHERE id = v_subscription_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_cash_payments_subscription_id ON cash_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_cash_payments_collected_by ON cash_payments(collected_by);
CREATE INDEX IF NOT EXISTS idx_cash_payments_status ON cash_payments(status);
CREATE INDEX IF NOT EXISTS idx_cash_payments_payment_date ON cash_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_cash_payments_receipt_number ON cash_payments(receipt_number);

-- ===========================================
-- 7. GRANT PERMISSIONS
-- ===========================================

GRANT SELECT, INSERT, UPDATE ON cash_payments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;