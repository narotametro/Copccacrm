-- =====================================================
-- RESET PASSWORD FOR teddy@gmail.com
-- =====================================================
-- This lets you set a NEW password: 198916Ahib@
-- =====================================================

-- INSTRUCTIONS (Cannot be done via SQL):
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Find teddy@gmail.com in the list
-- 3. Click the "..." menu (3 dots) on the right
-- 4. Select "Reset Password" or "Send Password Recovery"
-- 5. Option A: Send recovery email to teddy@gmail.com
--    - Check email and click reset link
--    - Enter new password: 198916Ahib@
--
-- Option B: Set password directly (if available)
--    - Click "Update user"
--    - Set password: 198916Ahib@
--    - Save

SELECT 
  'Go to Supabase Dashboard → Authentication → Users' as step_1,
  'Find teddy@gmail.com in the user list' as step_2,
  'Click the 3-dot menu (⋮) next to the user' as step_3,
  'Select "Send Password Recovery" or "Reset Password"' as step_4,
  'Set new password to: 198916Ahib@' as step_5;
