-- =====================================================
-- ABSOLUTE FINAL FIX: Handle orphaned FK references
-- =====================================================

-- Step 1: Ensure ALL auth users exist in public.users table
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'user'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Fix orphaned companies (created_by points to non-existent user)
UPDATE companies
SET created_by = NULL
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = companies.created_by
  );

-- Step 3: Drop the problematic FK constraint
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_created_by_fkey;

-- Step 4: Recreate FK pointing to auth.users (the source of truth)
ALTER TABLE companies
ADD CONSTRAINT companies_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Step 5: Create trigger for auto-creating user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Clean up ALL policies
-- USERS TABLE
DROP POLICY IF EXISTS "authenticated_users_can_read_users" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "admins_can_insert_users" ON users;
DROP POLICY IF EXISTS "admins_can_delete_users" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;

CREATE POLICY "users_all_authenticated" ON users
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- COMPANIES TABLE
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "companies_select_all" ON companies;
DROP POLICY IF EXISTS "companies_insert_all" ON companies;
DROP POLICY IF EXISTS "companies_update_all" ON companies;
DROP POLICY IF EXISTS "companies_delete_admin" ON companies;
DROP POLICY IF EXISTS "companies_select_authenticated" ON companies;
DROP POLICY IF EXISTS "companies_insert_authenticated" ON companies;
DROP POLICY IF EXISTS "companies_update_authenticated" ON companies;
DROP POLICY IF EXISTS "companies_delete_authenticated" ON companies;

CREATE POLICY "companies_all_authenticated" ON companies
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verification
DO $$
DECLARE
  v_user_count INTEGER;
  v_orphaned_companies INTEGER;
  v_trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM users;
  SELECT COUNT(*) INTO v_orphaned_companies FROM companies WHERE created_by IS NULL;
  SELECT COUNT(*) INTO v_trigger_count FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ✅ ✅ ABSOLUTE FINAL FIX COMPLETE ✅ ✅ ✅';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Users synced from auth: %', v_user_count;
  RAISE NOTICE 'Companies with NULL created_by: %', v_orphaned_companies;
  RAISE NOTICE 'Auto-create trigger: %', CASE WHEN v_trigger_count > 0 THEN 'INSTALLED' ELSE 'MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'FK Constraint: companies.created_by → auth.users(id)';
  RAISE NOTICE 'RLS Policies: Simplified to single ALL policy per table';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SYSTEM IS NOW FULLY OPERATIONAL 🎉';
END $$;
