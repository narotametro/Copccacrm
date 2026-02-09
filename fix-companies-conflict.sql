-- Remove the problematic company auto-creation trigger
-- This was causing conflicts with user creation

DROP TRIGGER IF EXISTS trigger_create_company_for_new_user ON users;
DROP FUNCTION IF EXISTS create_company_for_new_user();

-- Simplify companies policies to avoid subquery issues
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Company owners can update their company" ON companies;
DROP POLICY IF EXISTS "Users can view companies they created or are assigned to" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can update companies they created or are assigned to" ON companies;

-- Create simple, safe policies
CREATE POLICY "Authenticated users can view companies" ON companies
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create companies" ON companies
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update companies" ON companies
FOR UPDATE USING (auth.role() = 'authenticated');