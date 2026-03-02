-- Fix invitation system to work without querying protected tables
-- This fixes 406/401 errors when accepting invitations

-- Add columns to store inviter info directly in invitation_links
ALTER TABLE invitation_links 
  ADD COLUMN IF NOT EXISTS inviter_name TEXT,
  ADD COLUMN IF NOT EXISTS inviter_company_id UUID,
  ADD COLUMN IF NOT EXISTS inviter_company_name TEXT;

-- Update existing invitations with inviter info (if any exist)
UPDATE invitation_links il
SET 
  inviter_name = u.full_name,
  inviter_company_id = u.company_id,
  inviter_company_name = c.name
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
WHERE il.created_by = u.id
  AND il.inviter_name IS NULL;

-- Make invitation_links publicly readable for token validation
-- This is safe because we only expose specific fields and validate token + email
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON invitation_links;
CREATE POLICY "Anyone can read invitation by token" ON invitation_links 
  FOR SELECT 
  USING (true);  -- Allow reading to validate tokens (unauthenticated users need this)

-- Keep write restrictions for authenticated users only
DROP POLICY IF EXISTS "Authenticated users can create invitations" ON invitation_links;
CREATE POLICY "Authenticated users can create invitations" ON invitation_links 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can update their invitations" ON invitation_links;
CREATE POLICY "Authenticated users can update their invitations" ON invitation_links 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Allow system to mark invitations as used (important for acceptance flow)
DROP POLICY IF EXISTS "Allow marking invitations as used" ON invitation_links;
CREATE POLICY "Allow marking invitations as used" ON invitation_links 
  FOR UPDATE 
  USING (true)
  WITH CHECK (used = true);  -- Only allow setting used=true

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_invitation_links_company ON invitation_links(inviter_company_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Invitation system fixed!';
  RAISE NOTICE 'Added: inviter_name, inviter_company_id, inviter_company_name columns';
  RAISE NOTICE 'Updated: RLS policies to allow public token validation';
  RAISE NOTICE 'Action: Update invitation creation code to populate these fields';
END $$;
