-- =====================================================
-- 🔧 ENABLE ORDER HISTORY FILTERS
-- =====================================================
-- Purpose: Populate categories and brands to make filters work
-- The filters are already coded, but need data in the database
-- =====================================================

-- STEP 1: Check if you have any categories
SELECT 
  '📊 CURRENT CATEGORIES' as info,
  COUNT(*) as total_categories
FROM categories;

-- STEP 2: Check if you have any brands
SELECT 
  '🏷️ CURRENT BRANDS' as info,
  COUNT(*) as total_brands
FROM brands;

-- =====================================================
-- OPTION A: CREATE SAMPLE CATEGORIES (if you have none)
-- =====================================================

-- Get your company_id first
DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the first user's company_id
  SELECT company_id, id INTO v_company_id, v_user_id
  FROM users
  LIMIT 1;

  -- Insert sample categories only if none exist
  IF NOT EXISTS (SELECT 1 FROM categories WHERE company_id = v_company_id) THEN
    INSERT INTO categories (company_id, name, description, created_by)
    VALUES
      (v_company_id, 'Electronics', 'TVs, computers, and electronic devices', v_user_id),
      (v_company_id, 'Home Appliances', 'Refrigerators, washing machines, etc.', v_user_id),
      (v_company_id, 'Mobile Devices', 'Smartphones and tablets', v_user_id),
      (v_company_id, 'Audio & Video', 'Sound systems, speakers, etc.', v_user_id),
      (v_company_id, 'Accessories', 'Cables, cases, chargers, etc.', v_user_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created 5 sample categories';
  ELSE
    RAISE NOTICE 'Categories already exist';
  END IF;
END $$;

-- =====================================================
-- OPTION B: CREATE SAMPLE BRANDS (if you have none)
-- =====================================================

-- Insert sample brands (brands are global, not per company)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM brands LIMIT 1) THEN
    INSERT INTO brands (name, description)
    VALUES
      ('Samsung', 'Samsung Electronics'),
      ('LG', 'LG Electronics'),
      ('Sony', 'Sony Corporation'),
      ('Hisense', 'Hisense Group'),
      ('TCL', 'TCL Technology'),
      ('Nasco', 'Nasco Electronics'),
      ('Volcano', 'Volcano Electronics'),
      ('Ramtons', 'Ramtons Limited'),
      ('Hotpoint', 'Hotpoint Electronics'),
      ('Other', 'Other brands')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created 10 sample brands';
  ELSE
    RAISE NOTICE 'Brands already exist';
  END IF;
END $$;

-- =====================================================
-- STEP 3: VERIFY CATEGORIES AND BRANDS WERE CREATED
-- =====================================================

SELECT 
  '✅ CATEGORIES' as type,
  name,
  description
FROM categories
ORDER BY name;

SELECT 
  '✅ BRANDS' as type,
  name,
  description
FROM brands
ORDER BY name;

-- =====================================================
-- STEP 4: UPDATE EXISTING PRODUCTS WITH CATEGORIES/BRANDS
-- =====================================================

-- Show products that need category/brand assignment
SELECT 
  '⚠️ PRODUCTS NEEDING CATEGORIES/BRANDS' as info,
  id,
  name,
  CASE WHEN category_id IS NULL THEN '❌ No Category' ELSE '✅ Has Category' END as category_status,
  CASE WHEN brand_id IS NULL THEN '❌ No Brand' ELSE '✅ Has Brand' END as brand_status
FROM products
WHERE category_id IS NULL OR brand_id IS NULL
LIMIT 20;

-- =====================================================
-- 📝 INSTRUCTIONS FOR USER
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ ORDER HISTORY FILTERS - SETUP COMPLETE                      ║
╚══════════════════════════════════════════════════════════════════╝

🎯 WHAT CHANGED:

✅ Created sample categories (Electronics, Home Appliances, etc.)
✅ Created sample brands (Samsung, LG, Sony, Hisense, etc.)
✅ Filters are already coded and working in the UI

🔍 HOW THE FILTERS WORK NOW:

1️⃣  CUSTOMER FILTER:
   - All Customers: shows all orders
   - Walk-in Only: shows only walk-in customer orders
   - [Customer Names]: filter by specific customer

2️⃣  PRODUCT FILTER:
   - All Products: shows all orders
   - [Product Name]: shows orders containing that product

3️⃣  BRAND FILTER (NEW!):
   - All Brands: shows all orders
   - Samsung, LG, Sony, etc.: shows orders with products from that brand

4️⃣  CATEGORY FILTER (NEW!):
   - All Categories: shows all orders
   - Electronics, Home Appliances, etc.: shows orders with products from that category

📊 NEXT STEPS TO MAKE FILTERS FULLY FUNCTIONAL:

1️⃣  ASSIGN CATEGORIES AND BRANDS TO YOUR PRODUCTS:
   - Go to Sales Hub → Products tab
   - Edit each product
   - Select appropriate Category and Brand
   - Click "Update Product"

2️⃣  TEST THE FILTERS:
   - Go to Sales Hub → Order History tab
   - Select a Category (e.g., "Electronics")
   - Only orders containing Electronics products will show
   - Select a Brand (e.g., "Samsung")
   - Only orders containing Samsung products will show
   - You can combine multiple filters!

💡 FILTER COMBINATIONS:

Example 1: Show Samsung TVs
   - Product Filter: Select specific TV product
   - Brand Filter: Samsung
   - Category Filter: Electronics

Example 2: Show all Electronics sold to a specific customer
   - Customer Filter: Select customer name
   - Category Filter: Electronics

Example 3: Show all LG Home Appliances
   - Brand Filter: LG
   - Category Filter: Home Appliances

🎯 IMPORTANT NOTES:

⚠️  Products MUST have category_id and brand_id set for filters to work
⚠️  Edit products in Sales Hub → Products to assign categories/brands
⚠️  Filters check the order ITEMS, not just the order header
⚠️  Multiple filters work together (AND logic)

🔄 TO SEE FILTERS IN ACTION:

1. Refresh your browser
2. Go to Sales Hub → Order History
3. Select any filter dropdown
4. You should now see your categories and brands listed
5. Select one and watch the orders filter instantly!

' as instructions;

-- =====================================================
-- ✅ RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- =====================================================
