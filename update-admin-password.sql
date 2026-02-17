-- Update COPCCA Admin Password
-- New Password: COPCCA@2026#Secure2

UPDATE admin_users
SET 
  password_hash = hash_password('COPCCA@2026#Secure2'),
  updated_at = NOW()
WHERE email = 'admin@copcca.com';

-- Verify update
SELECT 
  email, 
  full_name, 
  is_active,
  last_login,
  updated_at,
  'Password updated successfully' as status
FROM admin_users
WHERE email = 'admin@copcca.com';
