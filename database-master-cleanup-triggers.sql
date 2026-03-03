-- ========================================
-- MASTER DATABASE CLEANUP SCRIPT
-- ========================================
-- This script removes ALL problematic triggers and functions that cause errors
-- Run this ONCE to clean up your database permanently
--
-- What it fixes:
-- 1. Removes triggers referencing non-existent 'subscriptions' table
-- 2. Removes auto-assignment triggers that conflict with company-based subscriptions
-- 3. Cleans up duplicate/conflicting trigger definitions
-- 4. Ensures database is ready for company-based subscription model
--
-- SAFE TO RUN MULTIPLE TIMES (uses IF EXISTS)
-- ========================================

-- ========================================
-- STEP 1: Drop ALL Problematic Triggers
-- ========================================

-- Auto-assignment triggers (conflicting with company-based model)
DROP TRIGGER IF EXISTS assign_inviter_subscription ON users CASCADE;
DROP TRIGGER IF EXISTS assign_inviter_subscription_trigger ON users CASCADE;
DROP TRIGGER IF EXISTS trigger_assign_inviter_subscription ON users CASCADE;

DROP TRIGGER IF EXISTS assign_start_plan ON users CASCADE;
DROP TRIGGER IF EXISTS assign_start_plan_trigger ON users CASCADE;
DROP TRIGGER IF EXISTS trigger_assign_start_plan ON users CASCADE;

-- ========================================
-- STEP 2: Drop ALL Problematic Functions
-- ========================================

-- Functions that reference non-existent tables
DROP FUNCTION IF EXISTS assign_inviter_subscription_to_user() CASCADE;
DROP FUNCTION IF EXISTS assign_start_plan_to_new_user() CASCADE;

-- ========================================
-- STEP 3: Verify Cleanup
-- ========================================

-- Show remaining triggers on users table (should be minimal - only updated_at trigger)
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'users' AND NOT t.tgisinternal;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE CLEANUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Removed problematic triggers:';
  RAISE NOTICE '   - assign_inviter_subscription (all variants)';
  RAISE NOTICE '   - assign_start_plan (all variants)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Removed problematic functions:';
  RAISE NOTICE '   - assign_inviter_subscription_to_user()';
  RAISE NOTICE '   - assign_start_plan_to_new_user()';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Remaining triggers on users table: %', trigger_count;
  RAISE NOTICE '   (Should only be update_users_updated_at)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Run: database-company-based-subscriptions.sql';
  RAISE NOTICE '   (Sets up company-based subscription model)';
  RAISE NOTICE '';
  RAISE NOTICE '2. Invited users will automatically inherit';
  RAISE NOTICE '   their company owner''s subscription plan';
  RAISE NOTICE '';
  RAISE NOTICE '3. NO MORE TRIGGER ERRORS! 🎉';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- STEP 4: List All User Table Triggers (for verification)
-- ========================================

SELECT 
  'Current users table triggers:' as info,
  t.tgname as trigger_name,
  pg_catalog.pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'users' 
  AND NOT t.tgisinternal
ORDER BY t.tgname;
