-- Add company_id and invited_by columns to users table
-- This allows tracking which company a user belongs to and who invited them

-- Add company_id column to link users to companies
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add invited_by column to track who invited the user
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add is_company_owner column to identify the primary admin who owns the company subscription
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_company_owner BOOLEAN DEFAULT false;

-- Create index for faster company-based queries
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_is_company_owner ON users(is_company_owner);

-- Add subscription fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'suspended'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS show_payment_popup BOOLEAN DEFAULT false;

-- Update RLS policies for users table to respect company boundaries
DROP POLICY IF EXISTS "Users can view their own company users" ON users;
CREATE POLICY "Users can view their own company users"
  ON users FOR SELECT
  USING (
    auth.uid() = id OR 
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage their company users" ON users;
CREATE POLICY "Admins can manage their company users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND (is_company_owner = true OR company_id = users.company_id)
    )
  );

-- Update companies RLS to allow company admins to manage their company
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company owners can update their company" ON companies;
CREATE POLICY "Company owners can update their company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR is_company_owner = true)
    )
  );

-- Function to auto-create company for new sign-ups
CREATE OR REPLACE FUNCTION create_company_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Only create company if user doesn't have one and is not invited
  IF NEW.company_id IS NULL AND NEW.invited_by IS NULL THEN
    -- Create a new company for this user
    INSERT INTO companies (name, email, created_by)
    VALUES (
      NEW.full_name || '''s Company',
      NEW.email,
      NEW.id
    )
    RETURNING id INTO new_company_id;
    
    -- Update user with company_id and mark as company owner
    NEW.company_id := new_company_id;
    NEW.is_company_owner := true;
    NEW.role := 'admin'; -- First user is always admin
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto company creation
DROP TRIGGER IF EXISTS trigger_create_company_for_new_user ON users;
CREATE TRIGGER trigger_create_company_for_new_user
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_company_for_new_user();

-- Add comment for documentation
COMMENT ON COLUMN users.company_id IS 'Links user to their company/organization';
COMMENT ON COLUMN users.invited_by IS 'User ID of the admin who invited this user';
COMMENT ON COLUMN users.is_company_owner IS 'True for the primary admin who owns the company subscription';
COMMENT ON COLUMN companies.show_payment_popup IS 'When true, payment popup will be shown to all company users';
