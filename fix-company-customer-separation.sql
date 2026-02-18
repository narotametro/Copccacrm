-- Fix Company Data Isolation
-- Adds a flag to distinguish user's own company from customer companies

-- Add column to mark which company is the user's own company (not a customer)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_own_company BOOLEAN DEFAULT false;

-- Mark existing companies as "own company" if they match user's company_id
UPDATE companies c
SET is_own_company = true
FROM users u
WHERE c.id = u.company_id
  AND u.is_company_owner = true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_companies_own_company 
ON companies(created_by, is_own_company);

-- Verify the update
SELECT 
  c.name,
  c.is_own_company,
  c.created_by,
  u.email as created_by_email,
  CASE 
    WHEN c.is_own_company THEN '✅ User''s Company (NOT shown as customer)'
    ELSE '📋 Customer Company (shown in customers list)'
  END as company_type
FROM companies c
LEFT JOIN users u ON c.created_by = u.id
ORDER BY c.created_at;
