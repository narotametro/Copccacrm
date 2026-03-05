-- =====================================================
-- FIX 409 CONFLICT ERRORS
-- Purpose: Add INSERT policies and handle duplicates gracefully
-- =====================================================

-- ===========================================
-- 1. Fix security_audit_logs - Allow inserts
-- ===========================================

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "System can insert security logs" ON security_audit_logs;

-- Create permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert security logs" 
ON security_audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for anonymous (for login tracking)
CREATE POLICY "Anonymous can insert security logs" 
ON security_audit_logs 
FOR INSERT 
TO anon
WITH CHECK (true);

-- ===========================================
-- 2. Fix session_fingerprints - Allow upserts
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "System can manage sessions" ON session_fingerprints;
DROP POLICY IF EXISTS "Users can view own sessions" ON session_fingerprints;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON session_fingerprints 
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON session_fingerprints 
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON session_fingerprints 
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON session_fingerprints 
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ===========================================
-- 3. Fix user_subscriptions - Allow upserts
-- ===========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own subscription" ON user_subscriptions;

-- Users can view their own subscription
CREATE POLICY "Users can read own subscription"
ON user_subscriptions 
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own subscription (first time)
CREATE POLICY "Users can insert own subscription"
ON user_subscriptions 
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
ON user_subscriptions 
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ===========================================
-- 4. Create helper function to safely insert/update subscription
-- ===========================================

CREATE OR REPLACE FUNCTION upsert_user_subscription(
  p_user_id UUID,
  p_plan_id UUID,
  p_status TEXT DEFAULT 'active',
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS user_subscriptions AS $$
DECLARE
  v_subscription user_subscriptions;
BEGIN
  -- Try to insert, if conflict then update
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end
  ) VALUES (
    p_user_id,
    p_plan_id,
    p_status,
    p_billing_cycle,
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    billing_cycle = EXCLUDED.billing_cycle,
    updated_at = NOW()
  RETURNING * INTO v_subscription;
  
  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION upsert_user_subscription TO authenticated;

-- ===========================================
-- 5. Create helper function to safely store session fingerprint
-- ===========================================

CREATE OR REPLACE FUNCTION upsert_session_fingerprint(
  p_user_id UUID,
  p_session_token_hash VARCHAR,
  p_device_fingerprint VARCHAR,
  p_ip_address VARCHAR,
  p_user_agent TEXT,
  p_browser VARCHAR DEFAULT NULL,
  p_os VARCHAR DEFAULT NULL,
  p_device_type VARCHAR DEFAULT 'desktop'
)
RETURNS session_fingerprints AS $$
DECLARE
  v_fingerprint session_fingerprints;
BEGIN
  -- Deactivate old sessions for this device fingerprint
  UPDATE session_fingerprints 
  SET is_active = false
  WHERE user_id = p_user_id 
    AND device_fingerprint = p_device_fingerprint
    AND is_active = true;
  
  -- Insert new session
  INSERT INTO session_fingerprints (
    user_id,
    session_token_hash,
    device_fingerprint,
    ip_address,
    user_agent,
    browser,
    os,
    device_type,
    expires_at
  ) VALUES (
    p_user_id,
    p_session_token_hash,
    p_device_fingerprint,
    p_ip_address,
    p_user_agent,
    p_browser,
    p_os,
    p_device_type,
    NOW() + INTERVAL '7 days'
  )
  RETURNING * INTO v_fingerprint;
  
  RETURN v_fingerprint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION upsert_session_fingerprint TO authenticated;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '✅ 409 conflict fixes applied successfully!';
  RAISE NOTICE '   - security_audit_logs: INSERT policies added';
  RAISE NOTICE '   - session_fingerprints: Full CRUD policies added';
  RAISE NOTICE '   - user_subscriptions: INSERT/UPDATE policies added';
  RAISE NOTICE '   - Helper functions created for safe upserts';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '   1. Run this migration in Supabase SQL Editor';
  RAISE NOTICE '   2. Test login and plan selection';
  RAISE NOTICE '   3. Verify no more 409 errors in console';
END $$;
