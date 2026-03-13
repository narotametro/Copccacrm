-- =====================================================
-- 🔧 SET TANZANIAN SHILLING AS DEFAULT CURRENCY
-- =====================================================
-- Date: March 14, 2026
-- Purpose: Change all currency defaults from USD to TZS
-- This ensures new records use Tanzanian Shilling by default
-- =====================================================

-- STEP 1: Update system_settings table
UPDATE system_settings
SET value = 'TZS'
WHERE key = 'default_currency';

-- If setting doesn't exist, create it
INSERT INTO system_settings (key, value, description, category)
VALUES ('default_currency', 'TZS', 'Default currency for the system', 'financial')
ON CONFLICT (key) DO UPDATE SET value = 'TZS';

-- STEP 2: Update column defaults for future records
-- (Existing records will keep their current currency values)

-- Update companies table
ALTER TABLE companies 
ALTER COLUMN currency SET DEFAULT 'TZS';

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

-- Check system_settings
SELECT 
  '✅ SYSTEM SETTINGS' as check_type,
  key,
  value,
  description
FROM system_settings
WHERE key = 'default_currency';

-- Check table defaults
SELECT 
  '✅ TABLE DEFAULTS' as check_type,
  table_name,
  column_name,
  column_default
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

✅ System default currency changed to TZS
✅ All table column defaults updated to TZS
✅ Future records will automatically use TZS

🎯 IMPORTANT NOTES:

1️⃣  EXISTING RECORDS:
   - Existing records keep their current currency values
   - Only NEW records will use TZS by default
   - If you want to convert existing records, do it manually

2️⃣  FRONTEND ALREADY UPDATED:
   - The app UI now defaults to TSh for all new users
   - Users can still change currency in settings if needed
   - Currency selector shows TSh first

3️⃣  WHAT THIS MEANS:
   - New orders → TSh by default
   - New invoices → TSh by default
   - New deals → TSh by default
   - New companies → TSh by default

🔄 NEXT STEPS:

1. Refresh your browser (Ctrl+F5)
2. Check that TSh is now the default currency
3. Create a new order/invoice to verify

💡 USER PREFERENCE:
   - Each user can still set their own preferred currency
   - This is just the system-wide default
   - Currency preferences are saved per user

' as instructions;

-- =====================================================
-- ✅ RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- =====================================================
