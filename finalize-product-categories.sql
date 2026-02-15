-- Categorize the remaining uncategorized products
-- Based on the product names shown, these appear to be TV/display products

-- First, ensure the TVs & Displays category exists
INSERT INTO categories (name, description, company_id, created_by)
SELECT
  'TVs & Displays',
  'Television sets and display devices',
  u.company_id,
  u.id
FROM users u
WHERE u.company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'TVs & Displays' AND company_id = u.company_id)
LIMIT 1;

-- Update the remaining uncategorized products to TVs & Displays category
UPDATE products
SET category_id = (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'TVs & Displays'
    AND c.company_id = products.company_id
  LIMIT 1
)
WHERE category_id IS NULL
  AND (
    UPPER(name) LIKE '%INCH%'
    OR UPPER(name) LIKE '%TV%'
    OR UPPER(name) LIKE '%DISPLAY%'
    OR UPPER(name) LIKE '%MONITOR%'
  );

-- Show the final results
SELECT 'All products with categories:' as info;
SELECT
  p.name,
  p.model,
  COALESCE(c.name, 'Uncategorized') as category,
  CASE
    WHEN p.stock_quantity > 0 THEN 'In Stock'
    ELSE 'Out of Stock'
  END as stock_status,
  'TSh' || TO_CHAR(p.price, 'FM999,999,999') as price,
  p.stock_quantity || ' units' as stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.name;

-- Check if any products are still uncategorized
SELECT 'Still uncategorized products:' as info;
SELECT COUNT(*) as uncategorized_count FROM products WHERE category_id IS NULL;