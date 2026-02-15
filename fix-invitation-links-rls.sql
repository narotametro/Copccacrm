-- ================================================================
-- FIX INVITATION_LINKS RLS POLICIES
-- ================================================================
-- Add missing RLS policies for user invitations
-- ================================================================

-- Check if invitation_links table has RLS enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'invitation_links';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'invitation_links';

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view invitations from their company" ON invitation_links;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitation_links;
DROP POLICY IF EXISTS "Admins can update their invitations" ON invitation_links;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitation_links;

-- Create company-scoped RLS policies for invitation_links
CREATE POLICY "Users can view own company invitations" ON invitation_links
  FOR SELECT USING (
    created_by IN (
      SELECT id FROM users WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins/Managers can create invitations" ON invitation_links
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins/Managers can update own company invitations" ON invitation_links
  FOR UPDATE USING (
    created_by IN (
      SELECT id FROM users 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins/Managers can delete own company invitations" ON invitation_links
  FOR DELETE USING (
    created_by IN (
      SELECT id FROM users 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
      AND role IN ('admin', 'manager')
    )
  );

-- Verify policies
SELECT 
  'AFTER UPDATE' as status,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'invitation_links';

-- Count policies
SELECT 
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'invitation_links';

-- Test query (should not error)
SELECT 
  'TEST QUERY' as status,
  COUNT(*) as invitation_count
FROM invitation_links;
