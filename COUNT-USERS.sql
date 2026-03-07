-- =====================================================
-- COUNT REGISTERED USERS
-- =====================================================

-- Total count
SELECT 
  '📊 TOTAL REGISTERED USERS' as info,
  COUNT(*) as total_count
FROM auth.users;

-- List all users with details
SELECT 
  '👥 ALL REGISTERED USERS' as info,
  email,
  created_at,
  confirmed_at,
  CASE 
    WHEN confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '⏳ Pending'
  END as status,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Count by status
SELECT 
  '📈 USERS BY STATUS' as info,
  COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) as confirmed,
  COUNT(*) FILTER (WHERE confirmed_at IS NULL) as pending,
  COUNT(*) as total
FROM auth.users;
