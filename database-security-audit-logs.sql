-- =====================================================
-- SECURITY AUDIT LOGS TABLE
-- Purpose: Track all security-relevant user actions
-- =====================================================

-- Create security audit logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  action varchar(100) NOT NULL, -- e.g., 'login', 'logout', 'data_access', 'password_change'
  resource_type varchar(50), -- e.g., 'customer', 'invoice', 'product'
  resource_id uuid, -- ID of the accessed resource
  ip_address varchar(50),
  user_agent text,
  request_method varchar(10), -- GET, POST, PUT, DELETE
  request_path text,
  status varchar(20) DEFAULT 'success', -- 'success', 'failed', 'blocked'
  error_message text,
  metadata jsonb, -- Additional context data
  created_at timestamptz DEFAULT now()
);

-- Create indexes for fast querying
CREATE INDEX idx_security_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX idx_security_logs_company_id ON security_audit_logs(company_id);
CREATE INDEX idx_security_logs_action ON security_audit_logs(action);
CREATE INDEX idx_security_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX idx_security_logs_ip_address ON security_audit_logs(ip_address);
CREATE INDEX idx_security_logs_status ON security_audit_logs(status);

-- Enable Row Level Security
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all security logs for their company
CREATE POLICY "Admins can view all company security logs"
ON security_audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.company_id = security_audit_logs.company_id
  )
);

-- Policy: System can insert logs (service role)
CREATE POLICY "System can insert security logs"
ON security_audit_logs FOR INSERT
WITH CHECK (true);

-- Policy: No one can update or delete logs (audit integrity)
-- Only service role can delete old logs via scheduled job

-- =====================================================
-- FAILED LOGIN ATTEMPTS TABLE
-- Purpose: Track and block brute force attacks
-- =====================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255),
  ip_address varchar(50) NOT NULL,
  user_agent text,
  attempt_time timestamptz DEFAULT now(),
  reason varchar(100) -- 'invalid_password', 'invalid_email', 'account_locked'
);

-- Create indexes
CREATE INDEX idx_failed_attempts_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_attempts_time ON failed_login_attempts(attempt_time DESC);

-- Enable RLS
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view failed attempts
CREATE POLICY "Admins can view failed login attempts"
ON failed_login_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: System can insert failed attempts
CREATE POLICY "System can insert failed attempts"
ON failed_login_attempts FOR INSERT
WITH CHECK (true);

-- =====================================================
-- BLOCKED IPS TABLE
-- Purpose: Block malicious IP addresses
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address varchar(50) UNIQUE NOT NULL,
  reason text NOT NULL,
  blocked_at timestamptz DEFAULT now(),
  blocked_until timestamptz, -- NULL = permanent block
  blocked_by_user_id uuid REFERENCES users(id),
  auto_blocked boolean DEFAULT false -- true if blocked by system, false if by admin
);

-- Create index
CREATE INDEX idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_until ON blocked_ips(blocked_until);

-- Enable RLS
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view and manage blocked IPs
CREATE POLICY "Admins can manage blocked IPs"
ON blocked_ips FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: System can insert blocked IPs
CREATE POLICY "System can insert blocked IPs"
ON blocked_ips FOR INSERT
WITH CHECK (true);

-- =====================================================
-- ADMIN IP WHITELIST TABLE
-- Purpose: Restrict admin access to trusted IPs
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ip_address varchar(50) NOT NULL,
  description text,
  added_by_user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, ip_address)
);

-- Create indexes
CREATE INDEX idx_whitelist_user_id ON admin_ip_whitelist(user_id);
CREATE INDEX idx_whitelist_ip ON admin_ip_whitelist(ip_address);

-- Enable RLS
ALTER TABLE admin_ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage their own whitelist
CREATE POLICY "Admins can manage own IP whitelist"
ON admin_ip_whitelist FOR ALL
USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- =====================================================
-- SESSION FINGERPRINTS TABLE
-- Purpose: Detect session hijacking
-- =====================================================

CREATE TABLE IF NOT EXISTS session_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_token_hash varchar(64) NOT NULL, -- SHA256 hash of session token
  device_fingerprint varchar(100) NOT NULL,
  ip_address varchar(50) NOT NULL,
  user_agent text NOT NULL,
  browser varchar(50),
  os varchar(50),
  device_type varchar(20), -- 'desktop', 'mobile', 'tablet'
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true
);

-- Create indexes
CREATE INDEX idx_fingerprints_user_id ON session_fingerprints(user_id);
CREATE INDEX idx_fingerprints_token_hash ON session_fingerprints(session_token_hash);
CREATE INDEX idx_fingerprints_active ON session_fingerprints(is_active) WHERE is_active = true;
CREATE INDEX idx_fingerprints_expires ON session_fingerprints(expires_at);

-- Enable RLS
ALTER TABLE session_fingerprints ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON session_fingerprints FOR SELECT
USING (user_id = auth.uid());

-- Policy: System can manage sessions
CREATE POLICY "System can manage sessions"
ON session_fingerprints FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id uuid,
  p_action varchar,
  p_resource_type varchar DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_status varchar DEFAULT 'success',
  p_ip_address varchar DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
  v_company_id uuid;
BEGIN
  -- Get user's company_id
  SELECT company_id INTO v_company_id
  FROM users
  WHERE id = p_user_id;

  -- Insert log
  INSERT INTO security_audit_logs (
    user_id,
    company_id,
    action,
    resource_type,
    resource_id,
    status,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    v_company_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_status,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address varchar)
RETURNS boolean AS $$
DECLARE
  v_is_blocked boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip_address = p_ip_address
    AND (blocked_until IS NULL OR blocked_until > now())
  ) INTO v_is_blocked;

  RETURN v_is_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-block IP after failed attempts
CREATE OR REPLACE FUNCTION auto_block_ip_if_needed()
RETURNS trigger AS $$
DECLARE
  v_recent_failures int;
  v_block_duration interval;
BEGIN
  -- Count recent failures from this IP (last 15 minutes)
  SELECT COUNT(*) INTO v_recent_failures
  FROM failed_login_attempts
  WHERE ip_address = NEW.ip_address
  AND attempt_time > now() - interval '15 minutes';

  -- Block if 5+ failures
  IF v_recent_failures >= 5 THEN
    v_block_duration := interval '1 hour';
    
    -- Escalate block duration for repeat offenders
    IF v_recent_failures >= 10 THEN
      v_block_duration := interval '24 hours';
    END IF;

    -- Insert or update block
    INSERT INTO blocked_ips (ip_address, reason, blocked_until, auto_blocked)
    VALUES (
      NEW.ip_address,
      format('Auto-blocked after %s failed login attempts', v_recent_failures),
      now() + v_block_duration,
      true
    )
    ON CONFLICT (ip_address) DO UPDATE
    SET blocked_until = now() + v_block_duration,
        reason = format('Auto-blocked after %s failed login attempts', v_recent_failures);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-block IPs
DROP TRIGGER IF EXISTS trigger_auto_block_ip ON failed_login_attempts;
CREATE TRIGGER trigger_auto_block_ip
AFTER INSERT ON failed_login_attempts
FOR EACH ROW
EXECUTE FUNCTION auto_block_ip_if_needed();

-- =====================================================
-- CLEANUP JOBS (Run periodically via cron)
-- =====================================================

-- Function to clean old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_audit_logs
  WHERE created_at < now() - interval '90 days';
  
  DELETE FROM failed_login_attempts
  WHERE attempt_time < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM session_fingerprints
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unblock temporary IP blocks
CREATE OR REPLACE FUNCTION cleanup_expired_ip_blocks()
RETURNS void AS $$
BEGIN
  DELETE FROM blocked_ips
  WHERE blocked_until IS NOT NULL
  AND blocked_until < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_blocked TO authenticated;

COMMENT ON TABLE security_audit_logs IS 'Comprehensive audit trail of all security-relevant actions';
COMMENT ON TABLE failed_login_attempts IS 'Track failed login attempts for brute force detection';
COMMENT ON TABLE blocked_ips IS 'List of blocked IP addresses for threat prevention';
COMMENT ON TABLE admin_ip_whitelist IS 'Whitelist of trusted IPs for admin accounts';
COMMENT ON TABLE session_fingerprints IS 'Session tracking for hijacking detection';
