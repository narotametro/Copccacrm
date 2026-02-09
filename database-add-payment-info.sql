-- COPCCA CRM - Add Payment Information to Companies
-- Migration to add payment information fields to companies table

-- Add payment_info column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS payment_info JSONB DEFAULT '{
  "m_pesa": {
    "paybill": "",
    "account": ""
  },
  "bank_transfer": {
    "account": "",
    "bank": ""
  },
  "cash_payment": {
    "accepted_at": "",
    "hours": ""
  }
}'::jsonb;

-- Update existing companies to have default payment info structure
UPDATE companies
SET payment_info = '{
  "m_pesa": {
    "paybill": "",
    "account": ""
  },
  "bank_transfer": {
    "account": "",
    "bank": ""
  },
  "cash_payment": {
    "accepted_at": "",
    "hours": ""
  }
}'::jsonb
WHERE payment_info IS NULL;

-- Comments
COMMENT ON COLUMN companies.payment_info IS 'JSON object containing business payment method details including M-Pesa, bank transfer, and cash payment information';

-- Migration completed successfully