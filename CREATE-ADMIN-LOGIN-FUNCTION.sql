-- =====================================================
-- CREATE ADMIN LOGIN FUNCTION FOR COPCCA ADMIN PANEL
-- =====================================================

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

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access
DROP POLICY IF EXISTS "Service role full access" ON admin_users;
CREATE POLICY "Service role full access" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

-- Function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function first
DROP FUNCTION IF EXISTS verify_admin_login(TEXT, TEXT);

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

-- Grant execute permissions to anon and authenticated
GRANT EXECUTE ON FUNCTION verify_admin_login TO anon;
GRANT EXECUTE ON FUNCTION verify_admin_login TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password TO anon;
GRANT EXECUTE ON FUNCTION hash_password TO authenticated;

-- Insert admin user with email: admin@copcca.com and password: Copcca@7189#*
DELETE FROM admin_users WHERE email = 'admin@copcca.com';
INSERT INTO admin_users (email, password_hash, full_name, is_active)
VALUES (
  'admin@copcca.com',
  hash_password('Copcca@7189#*'),
  'COPCCA Platform Administrator',
  true
);

-- Verify the admin was created
SELECT 
  '✅ ADMIN USER CREATED' as status,
  email,
  full_name,
  is_active,
  created_at
FROM admin_users
WHERE email = 'admin@copcca.com';
