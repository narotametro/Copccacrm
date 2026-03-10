-- =====================================================
-- ADD MISSING IMAGE_URL COLUMN TO PRODUCTS TABLE
-- =====================================================
-- Fix: column products.image_url does not exist
-- =====================================================

-- Step 1: Check if column already exists
SELECT 
  '📊 CHECKING PRODUCTS TABLE STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add image_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
      AND column_name = 'image_url'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN image_url TEXT;
    
    RAISE NOTICE '✅ Added image_url column to products table';
  ELSE
    RAISE NOTICE '✅ image_url column already exists';
  END IF;
END $$;

-- Step 3: Verify the column was added
SELECT 
  '✅ VERIFICATION - PRODUCTS TABLE COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name = 'image_url' THEN '✅ IMAGE_URL COLUMN PRESENT'
    ELSE ''
  END as status
FROM information_schema.columns
WHERE table_name = 'products'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Final validation
SELECT 
  '📊 FINAL STATUS' as report,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name = 'image_url'
        AND table_schema = 'public'
    )
    THEN '✅ SUCCESS - image_url column exists. Products page will now work.'
    ELSE '⚠️ ISSUE - image_url column still missing.'
  END as final_status;

-- =====================================================
-- OPTIONAL: Add default images for existing products
-- =====================================================
-- Uncomment if you want to set a default image for existing products

-- UPDATE products
-- SET image_url = 'https://via.placeholder.com/300x300.png?text=Product+Image'
-- WHERE image_url IS NULL;

-- =====================================================
-- ✅ SCRIPT COMPLETE
-- =====================================================
-- The products table now has the image_url column
-- Products page should load without errors
-- =====================================================
