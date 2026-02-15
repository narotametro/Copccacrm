-- Assign categories to existing products based on product names
-- This script helps categorize products that are currently showing as "Uncategorized"

-- First, let's see what categories exist
SELECT 'Existing Categories:' as info;
SELECT id, name FROM categories ORDER BY name;

-- Check products without categories
SELECT 'Products without categories:' as info;
SELECT id, name, sku, model FROM products WHERE category_id IS NULL;

-- Create some common categories if they don't exist
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

INSERT INTO categories (name, description, company_id, created_by)
SELECT
  'Electronics',
  'Electronic devices and accessories',
  u.company_id,
  u.id
FROM users u
WHERE u.company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics' AND company_id = u.company_id)
LIMIT 1;

INSERT INTO categories (name, description, company_id, created_by)
SELECT
  'Home Appliances',
  'Home appliances and devices',
  u.company_id,
  u.id
FROM users u
WHERE u.company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Home Appliances' AND company_id = u.company_id)
LIMIT 1;

-- Auto-assign categories based on product names (you can modify these rules)
UPDATE products
SET category_id = (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'TVs & Displays'
    AND c.company_id = products.company_id
  LIMIT 1
)
WHERE category_id IS NULL
  AND (name ILIKE '%inch%' OR name ILIKE '%tv%' OR name ILIKE '%display%' OR name ILIKE '%monitor%');

UPDATE products
SET category_id = (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'Electronics'
    AND c.company_id = products.company_id
  LIMIT 1
)
WHERE category_id IS NULL
  AND (name ILIKE '%phone%' OR name ILIKE '%computer%' OR name ILIKE '%laptop%' OR name ILIKE '%tablet%');

-- Show results
SELECT 'Updated products:' as info;
SELECT p.id, p.name, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NOT NULL
ORDER BY p.name;

-- Show remaining uncategorized products
SELECT 'Still uncategorized:' as info;
SELECT id, name, sku, model FROM products WHERE category_id IS NULL;