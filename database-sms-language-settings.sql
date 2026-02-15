-- =====================================================
-- SMS LANGUAGE & INTERVAL SETTINGS
-- Purpose: Add language selection and reminder interval to SMS configuration
-- =====================================================

-- Add SMS language and interval configuration to system_settings
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('sms_language', 'en', 'SMS message language: en (English) or sw (Swahili)', 'sms'),
  ('sms_reminder_interval_days', '7', 'Days between automatic SMS reminders for overdue invoices', 'sms')
ON CONFLICT (key) DO NOTHING;

-- Update existing settings descriptions for clarity
UPDATE system_settings 
SET description = 'Enable automatic SMS reminders for debt collection'
WHERE key = 'sms_enabled';

-- =====================================================
-- LANGUAGE PREFERENCE IN COMPANIES TABLE (Optional)
-- =====================================================

-- Add language preference per company (optional - overrides global setting)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'preferred_sms_language'
  ) THEN
    ALTER TABLE companies ADD COLUMN preferred_sms_language varchar(2) DEFAULT 'en';
    COMMENT ON COLUMN companies.preferred_sms_language IS 'Preferred SMS language: en (English) or sw (Swahili)';
  END IF;
END $$;

-- =====================================================
-- REMINDER TRACKING TABLE
-- Purpose: Track when last reminder was sent to avoid spam
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_reminder_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  last_reminder_sent_at timestamptz DEFAULT now(),
  reminder_count int DEFAULT 1,
  next_reminder_due_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_reminder_tracking_debt_id ON sms_reminder_tracking(debt_id);
CREATE INDEX idx_reminder_tracking_next_due ON sms_reminder_tracking(next_reminder_due_at);

-- Enable RLS
ALTER TABLE sms_reminder_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reminder tracking for their company's debts
CREATE POLICY "Users can view company reminder tracking"
ON sms_reminder_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM debts d
    INNER JOIN users u ON u.company_id = d.company_id
    WHERE d.id = sms_reminder_tracking.debt_id
    AND u.id = auth.uid()
  )
);

-- Policy: System can manage reminder tracking
CREATE POLICY "System can manage reminder tracking"
ON sms_reminder_tracking FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTION TO CHECK IF REMINDER IS DUE
-- =====================================================

CREATE OR REPLACE FUNCTION is_reminder_due(p_debt_id uuid, p_interval_days int DEFAULT 7)
RETURNS boolean AS $$
DECLARE
  v_last_sent timestamptz;
  v_is_due boolean;
BEGIN
  -- Get last reminder sent time
  SELECT last_reminder_sent_at INTO v_last_sent
  FROM sms_reminder_tracking
  WHERE debt_id = p_debt_id
  ORDER BY last_reminder_sent_at DESC
  LIMIT 1;
  
  -- If no record found, reminder is due
  IF v_last_sent IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if enough days have passed
  v_is_due := (now() - v_last_sent) >= (p_interval_days || ' days')::interval;
  
  RETURN v_is_due;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION TO RECORD REMINDER SENT
-- =====================================================

CREATE OR REPLACE FUNCTION record_reminder_sent(
  p_debt_id uuid, 
  p_interval_days int DEFAULT 7
)
RETURNS void AS $$
DECLARE
  v_next_due timestamptz;
BEGIN
  v_next_due := now() + (p_interval_days || ' days')::interval;
  
  -- Insert or update tracking record
  INSERT INTO sms_reminder_tracking (
    debt_id, 
    last_reminder_sent_at, 
    next_reminder_due_at,
    reminder_count
  )
  VALUES (
    p_debt_id,
    now(),
    v_next_due,
    1
  )
  ON CONFLICT (debt_id) 
  DO UPDATE SET
    last_reminder_sent_at = now(),
    next_reminder_due_at = v_next_due,
    reminder_count = sms_reminder_tracking.reminder_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADD UNIQUE CONSTRAINT TO REMINDER TRACKING
-- =====================================================

-- Ensure only one tracking record per debt
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sms_reminder_tracking_debt_id_key'
  ) THEN
    ALTER TABLE sms_reminder_tracking 
    ADD CONSTRAINT sms_reminder_tracking_debt_id_key UNIQUE (debt_id);
  END IF;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION is_reminder_due TO authenticated;
GRANT EXECUTE ON FUNCTION record_reminder_sent TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE sms_reminder_tracking IS 'Tracks when reminders were sent to prevent spam and enforce intervals';
COMMENT ON COLUMN sms_reminder_tracking.reminder_count IS 'Number of reminders sent for this debt';
COMMENT ON COLUMN sms_reminder_tracking.next_reminder_due_at IS 'Calculated time when next reminder should be sent';
COMMENT ON FUNCTION is_reminder_due IS 'Check if enough time has passed since last reminder (respects interval setting)';
COMMENT ON FUNCTION record_reminder_sent IS 'Record that a reminder was sent and calculate next due date';

-- =====================================================
-- EXAMPLE QUERIES
-- =====================================================

-- Check which debts are due for reminder (example)
-- SELECT d.invoice_number, d.company_name, d.days_overdue
-- FROM debts d
-- WHERE d.status = 'overdue'
-- AND is_reminder_due(d.id, 7); -- 7 days interval

-- Record a reminder was sent (example)
-- SELECT record_reminder_sent('debt-uuid-here', 7);

-- View reminder history for a debt (example)
-- SELECT * FROM sms_reminder_tracking WHERE debt_id = 'debt-uuid-here';
