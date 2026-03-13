-- =====================================================
-- 🔧 ADD COST PRICE TO PRODUCTS TABLE
-- =====================================================
-- Date: March 13, 2026
-- Purpose: Add cost_price column to enable COGS calculation
-- COGS (Cost of Goods Sold) = Quantity × Cost Price
-- Gross Profit = Total Sales - COGS
-- =====================================================

-- STEP 1: Add cost_price column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL DEFAULT 0;

-- STEP 2: Add comment
COMMENT ON COLUMN products.cost_price IS 'Cost price per unit for calculating Cost of Goods Sold (COGS)';

-- STEP 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price);

-- STEP 4: Set default cost_price to 70% of selling price for existing products
-- (Assumes average 30% margin - you can adjust this manually per product later)
UPDATE products
SET cost_price = price * 0.7
WHERE cost_price = 0 OR cost_price IS NULL;

-- STEP 5: Verify the column was added
SELECT 
  '✅ COST PRICE COLUMN ADDED' as status,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'cost_price';

-- STEP 6: Show sample products with cost_price
SELECT 
  '📊 SAMPLE PRODUCTS' as info,
  name,
  sku,
  price as selling_price,
  cost_price,
  (price - cost_price) as gross_profit_per_unit,
  CASE 
    WHEN price > 0 THEN ROUND(((price - cost_price) / price * 100)::numeric, 2)
    ELSE 0
  END as margin_percentage
FROM products
LIMIT 10;

-- =====================================================
-- 📝 INSTRUCTIONS FOR USER
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ COST PRICE COLUMN ADDED TO PRODUCTS                         ║
╚══════════════════════════════════════════════════════════════════╝

📋 WHAT CHANGED:

✅ Added cost_price column to products table
✅ Set default cost_price to 70% of selling price (assumes 30% margin)
✅ Now you can calculate accurate COGS and Gross Profit

🎯 NEXT STEPS:

1️⃣  UPDATE COST PRICES FOR YOUR PRODUCTS:
   - Go to Inventory Management
   - Edit each product and set accurate cost price
   - Example: If 32 INCH TV sells for TSh 500,000
             and costs TSh 350,000, set cost_price = 350000

2️⃣  DASHBOARD WILL NOW SHOW:
   - Money IN: Total Sales
   - Money OUT: COGS (sum of quantity × cost_price)
   - Gross Profit: Sales - COGS

3️⃣  HOW TO ADD COST PRICE TO NEW PRODUCTS:
   - When creating a product in Inventory Management
   - A "Cost Price" field will appear
   - Always enter the actual cost you pay suppliers

💡 IMPORTANT NOTES:

⚠️  Current cost prices are ESTIMATES (70% of selling price)
⚠️  Please update them with ACTUAL cost prices for accuracy
⚠️  Products without cost_price will show TSh0 COGS

📊 GROSS PROFIT MARGIN FORMULA:
   Gross Profit Margin % = (Selling Price - Cost Price) / Selling Price × 100

🎯 EXAMPLE:
   Product: 32 INCH TV
   Selling Price: TSh 500,000
   Cost Price: TSh 350,000
   COGS per unit: TSh 350,000
   Gross Profit per unit: TSh 150,000
   Margin: 30%

   If you sell 10 units:
   - Total Sales: TSh 5,000,000
   - Total COGS: TSh 3,500,000
   - Gross Profit: TSh 1,500,000

' as instructions;

-- =====================================================
-- ✅ RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- =====================================================
