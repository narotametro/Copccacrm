-- Show where each product is stored
SELECT 
  p.name as product_name,
  p.sku,
  p.stock_quantity,
  l.name as warehouse_location,
  b.name as brand
FROM products p
LEFT JOIN locations l ON p.location_id = l.id
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.sku IN ('320AGH', '750SGB1', 'SP2000')
ORDER BY p.name, l.name;
