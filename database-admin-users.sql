-- COPCCA Admin Users Table
-- Stores credentials for platform administrators

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- RLS Policies (No one can access this table through normal auth)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access (backend only)
CREATE POLICY "Service role full access" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

-- Function to hash passwords (simple version - in production use pgcrypto)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify admin login
CREATE OR REPLACE FUNCTION verify_admin_login(
  login_email TEXT,
  login_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  admin_id UUID,
  admin_email TEXT,
  admin_name TEXT,
  message TEXT
) AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
  v_password_hash TEXT;
BEGIN
  -- Hash the provided password
  v_password_hash := hash_password(login_password);
  
  -- Try to find matching admin
  SELECT * INTO v_admin
  FROM admin_users
  WHERE email = login_email 
    AND password_hash = v_password_hash
    AND is_active = true;
  
  IF FOUND THEN
    -- Update last login time
    UPDATE admin_users 
    SET last_login = NOW(),
        updated_at = NOW()
    WHERE id = v_admin.id;
    
    -- Return success
    RETURN QUERY SELECT 
      true,
      v_admin.id,
      v_admin.email,
      v_admin.full_name,
      'Login successful'::TEXT;
  ELSE
    -- Return failure
    RETURN QUERY SELECT 
      false,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      'Invalid email or password'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change admin password
CREATE OR REPLACE FUNCTION change_admin_password(
  admin_email TEXT,
  current_password TEXT,
  new_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_current_hash TEXT;
  v_new_hash TEXT;
  v_admin_id UUID;
BEGIN
  -- Hash passwords
  v_current_hash := hash_password(current_password);
  v_new_hash := hash_password(new_password);
  
  -- Verify current password
  SELECT id INTO v_admin_id
  FROM admin_users
  WHERE email = admin_email 
    AND password_hash = v_current_hash
    AND is_active = true;
  
  IF FOUND THEN
    -- Update password
    UPDATE admin_users 
    SET password_hash = v_new_hash,
        updated_at = NOW()
    WHERE id = v_admin_id;
    
    RETURN QUERY SELECT true, 'Password changed successfully'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'Current password is incorrect'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default admin user
-- Email: admin@copcca.com
-- Password: COPCCA@2026#Secure!
INSERT INTO admin_users (email, password_hash, full_name, is_active)
VALUES (
  'admin@copcca.com',
  hash_password('COPCCA@2026#Secure!'),
  'COPCCA Platform Administrator',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION verify_admin_login TO authenticated;
GRANT EXECUTE ON FUNCTION change_admin_password TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password TO authenticated;
