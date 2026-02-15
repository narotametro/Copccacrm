-- Debug and fix the final uncategorized product issue

-- First, let's see what categories exist and for which companies
SELECT 'All categories in system:' as info;
SELECT c.id, c.name, c.company_id, comp.name as company_name
FROM categories c
LEFT JOIN companies comp ON c.company_id = comp.id
ORDER BY c.name;

-- Check what the uncategorized product is and what company it belongs to
SELECT 'Uncategorized product details:' as info;
SELECT
  p.id,
  p.name,
  p.sku,
  p.model,
  p.price,
  p.stock_quantity,
  p.company_id,
  comp.name as company_name
FROM products p
LEFT JOIN companies comp ON p.company_id = comp.id
WHERE p.category_id IS NULL;

-- Check if the TVs & Displays category exists for the product's company
SELECT 'Category availability check:' as info;
SELECT
  p.id as product_id,
  p.name as product_name,
  p.company_id as product_company_id,
  c.id as category_id,
  c.name as category_name,
  c.company_id as category_company_id,
  CASE WHEN c.id IS NOT NULL THEN 'Category exists for company' ELSE 'Category missing for company' END as status
FROM products p
LEFT JOIN categories c ON c.name = 'TVs & Displays' AND c.company_id = p.company_id
WHERE p.category_id IS NULL;

-- Create the category for the specific company if it doesn't exist
INSERT INTO categories (name, description, company_id, created_by)
SELECT
  'TVs & Displays',
  'Television sets and display devices',
  p.company_id,
  u.id
FROM products p
CROSS JOIN users u
WHERE p.category_id IS NULL
  AND u.company_id = p.company_id
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.name = 'TVs & Displays'
      AND c.company_id = p.company_id
  )
LIMIT 1;

-- Now assign the category to the uncategorized product
UPDATE products
SET category_id = (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'TVs & Displays'
    AND c.company_id = products.company_id
)
WHERE category_id IS NULL;

-- Final verification
SELECT 'FINAL RESULTS - All products:' as info;
SELECT
  p.name as product_name,
  p.model,
  COALESCE(c.name, 'Uncategorized') as category_name,
  CASE
    WHEN p.stock_quantity > 0 THEN 'In Stock'
    ELSE 'Out of Stock'
  END as stock_status,
  'TSh' || TO_CHAR(p.price, 'FM999,999,999') as formatted_price,
  p.stock_quantity || ' units' as stock_info
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.name;

SELECT 'Final check:' as info;
SELECT
  COUNT(*) as total_products,
  COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as categorized_products,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as uncategorized_products
FROM products;