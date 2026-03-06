-- =====================================================
-- CHECK TEDDY ACCOUNT STATUS
-- =====================================================

-- Check if email is confirmed and account status
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NOT CONFIRMED - This is why login fails!'
    ELSE '✅ Email confirmed'
  END as email_status,
  last_sign_in_at,
  banned_until,
  CASE 
    WHEN banned_until IS NOT NULL THEN '❌ ACCOUNT IS BANNED'
    ELSE '✅ Not banned'
  END as ban_status
FROM auth.users
WHERE email = 'teddy@gmail.com';
