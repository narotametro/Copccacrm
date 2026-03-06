-- =====================================================
-- COUNT ALL REGISTERED USERS
-- =====================================================

-- Total registered users
SELECT 
  '👥 TOTAL REGISTERED USERS' as info,
  COUNT(*) as total_users
FROM auth.users;

-- Breakdown by company_id status
SELECT 
  '📊 USER BREAKDOWN' as category,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as users_with_company,
  COUNT(*) FILTER (WHERE company_id IS NULL) as users_without_company,
  COUNT(*) as total
FROM users;

-- Recent registrations (last 10)
SELECT 
  'Recent users' as info,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '⚠️ Not confirmed'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
