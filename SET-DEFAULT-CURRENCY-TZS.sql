-- =====================================================
-- 🔧 SET TANZANIAN SHILLING AS DEFAULT CURRENCY
-- =====================================================
-- Date: March 14, 2026
-- Purpose: Change all currency defaults from USD to TZS
-- This ensures new records use Tanzanian Shilling by default
-- =====================================================

-- STEP 1: Update system_settings table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'system_settings'
  ) THEN
    -- Update existing setting
    UPDATE system_settings
    SET value = 'TZS'
    WHERE key = 'default_currency';
    
    -- If setting doesn't exist, create it
    INSERT INTO system_settings (key, value, description, category)
    VALUES ('default_currency', 'TZS', 'Default currency for the system', 'financial')
    ON CONFLICT (key) DO UPDATE SET value = 'TZS';
  END IF;
END $$;

-- STEP 2: Update column defaults for future records
-- (Existing records will keep their current currency values)

-- Update companies table (if currency column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'currency'
  ) THEN
    ALTER TABLE companies ALTER COLUMN currency SET DEFAULT 'TZS';
  END IF;
END $$;

-- Update sales_hub_orders table (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_hub_orders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE sales_hub_orders ALTER COLUMN currency SET DEFAULT 'TZS';
  END IF;
END $$;

-- Update invoices table (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'currency'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN currency SET DEFAULT 'TZS';
  END IF;
END $$;

-- Update deals table (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'currency'
  ) THEN
    ALTER TABLE deals ALTER COLUMN currency SET DEFAULT 'TZS';
  END IF;
END $$;

-- Update marketing_campaigns table (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketing_campaigns' AND column_name = 'currency'
  ) THEN
    ALTER TABLE marketing_campaigns ALTER COLUMN currency SET DEFAULT 'TZS';
  END IF;
END $$;

-- Update expenses table (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'currency'
  ) THEN
    ALTER TABLE expenses ALTER COLUMN currency SET DEFAULT 'TZS';
  END IF;
END $$;

-- Update debts table (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'currency'
  ) THEN
    ALTER TABLE debts ALTER COLUMN currency SET DEFAULT 'TZS';
  END IF;
END $$;

-- =====================================================
-- STEP 3: VERIFY CHANGES
-- =====================================================

-- Check system_settings (if table exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'system_settings'
  ) THEN
    RAISE NOTICE 'System settings table exists';
  ELSE
    RAISE NOTICE 'System settings table does not exist (OK - frontend handles default)';
  END IF;
END $$;

-- List all tables that have currency column
SELECT 
  '✅ TABLES WITH CURRENCY COLUMN' as check_type,
  table_name,
  column_name,
  column_default,
  CASE 
    WHEN column_default LIKE '%TZS%' THEN '✅ Uses TZS'
    ELSE '⚠️ Uses other default'
  END as status
FROM information_schema.columns
WHERE column_name = 'currency'
AND table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 📝 INSTRUCTIONS
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ TANZANIAN SHILLING (TSh) SET AS DEFAULT CURRENCY            ║
╚══════════════════════════════════════════════════════════════════╝

📋 WHAT CHANGED:

✅ Frontend now defaults to TZS (already live)
✅ All relevant database tables updated to TZS defaults
✅ Future records will automatically use TZS

🎯 IMPORTANT NOTES:

1️⃣  FRONTEND IS PRIMARY:
   - The app UI controls the default currency (already TSh)
   - This SQL just syncs database defaults
   - Even without database currency columns, TSh works!

2️⃣  EXISTING RECORDS:
   - Existing records keep their current currency values
   - Only NEW records will use TZS by default

3️⃣  TABLES UPDATED (if they have currency column):
   - companies
   - sales_hub_orders
   - invoices
   - deals
   - marketing_campaigns
   - expenses
   - debts

🔄 NEXT STEPS:

1. ✅ SQL migration complete
2. Refresh your browser (Ctrl+F5)
3. Check that TSh appears everywhere
4. Create a new order/invoice to verify

💡 NO ERRORS:
   If some tables do not have currency columns, that is OK!
   The frontend CurrencyProvider handles everything.
   Database currency columns are optional metadata.

' as instructions;

-- =====================================================
-- ✅ RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- =====================================================
