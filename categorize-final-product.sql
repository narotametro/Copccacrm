-- Find and categorize the last remaining uncategorized product

-- Show the remaining uncategorized product
SELECT 'Remaining uncategorized product:' as info;
SELECT id, name, sku, model, price, stock_quantity FROM products WHERE category_id IS NULL;

-- Since this appears to be a TV/display product based on the pattern,
-- let's assign it to TVs & Displays category
UPDATE products
SET category_id = (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'TVs & Displays'
    AND c.company_id = products.company_id
  LIMIT 1
)
WHERE category_id IS NULL;

-- Verify all products are now categorized
SELECT 'Final categorization results:' as info;
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

-- Final check
SELECT 'Total products categorized:' as info, COUNT(*) as total_products FROM products WHERE category_id IS NOT NULL;
SELECT 'Still uncategorized:' as info, COUNT(*) as uncategorized_count FROM products WHERE category_id IS NULL;