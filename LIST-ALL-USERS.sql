-- =====================================================
-- LIST ALL EXISTING USERS - FIXED VERSION
-- =====================================================

-- SIMPLE: Just show emails from auth.users (this should ALWAYS work)
SELECT email, created_at FROM auth.users ORDER BY created_at DESC;
