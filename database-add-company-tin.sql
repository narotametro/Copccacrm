-- Add TIN column to companies table for business registration information
-- Migration to support Tax Identification Number storage

-- Add TIN column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tin TEXT;

-- Add comment for the new column
COMMENT ON COLUMN companies.tin IS 'Tax Identification Number for business registration';

-- Migration completed successfully