-- Add show_company_name_in_navbar field to companies table
-- This allows admins to show/hide their company name in the navbar for all team members

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS show_company_name_in_navbar BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN companies.show_company_name_in_navbar IS 'When true, company name will be displayed in navbar for all team members';
