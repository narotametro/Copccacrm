-- =====================================================
-- ADD VAT TYPE COLUMN TO SALES HUB ORDERS
-- Allows orders to specify whether VAT should be shown on invoice
-- =====================================================

-- Add vat_type column to sales_hub_orders table
ALTER TABLE sales_hub_orders
ADD COLUMN IF NOT EXISTS vat_type TEXT DEFAULT 'inclusive' CHECK (vat_type IN ('inclusive', 'exclusive'));

-- Add comment to explain the column
COMMENT ON COLUMN sales_hub_orders.vat_type IS 'VAT display type: inclusive (show on invoice) or exclusive (hide on invoice)';

-- Set default for existing orders (backwards compatibility)
UPDATE sales_hub_orders
SET vat_type = 'inclusive'
WHERE vat_type IS NULL;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ VAT TYPE COLUMN ADDED';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Column: vat_type (TEXT)';
  RAISE NOTICE 'Values: "inclusive" or "exclusive"';
  RAISE NOTICE 'Default: "inclusive"';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  • "inclusive": VAT line appears on printed invoice';
  RAISE NOTICE '  • "exclusive": VAT line hidden on printed invoice';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;
