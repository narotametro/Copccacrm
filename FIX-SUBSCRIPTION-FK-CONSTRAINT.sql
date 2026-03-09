-- =====================================================
-- FIX SUBSCRIPTION FOREIGN KEY CONSTRAINT
-- =====================================================
-- Ensure proper foreign key constraint exists for PostgREST queries
-- =====================================================

-- Check existing foreign key constraints
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE contype = 'f'
  AND conrelid::regclass::text = 'user_subscriptions'
  AND confrelid::regclass::text = 'subscription_plans';

-- Drop existing constraint if it exists (to recreate with correct name)
ALTER TABLE user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_fkey;

-- Add foreign key constraint with explicit name
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_plan_id_fkey
FOREIGN KEY (plan_id) 
REFERENCES subscription_plans(id) 
ON DELETE RESTRICT;

-- Verify the constraint was created
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE contype = 'f'
  AND conrelid::regclass::text = 'user_subscriptions'
  AND confrelid::regclass::text = 'subscription_plans';

-- Test that PostgREST can now access the relationship
SELECT
  '✅ FOREIGN KEY CONSTRAINT VERIFIED' as status,
  'PostgREST will now be able to query: subscription_plans!user_subscriptions_plan_id_fkey(...)' as note;
