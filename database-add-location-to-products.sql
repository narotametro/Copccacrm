-- =====================================================
-- ADD LOCATION TO PRODUCTS
-- Purpose: Assign products to specific locations (POS or inventory)
-- =====================================================

-- Add location_id column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id);

-- Create index for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location_id);

-- Migrate existing products to their company's first active location
DO $$
DECLARE
  v_company RECORD;
  v_default_location uuid;
  v_products_updated integer := 0;
  v_products_remaining integer := 0;
BEGIN
  -- For each company with products
  FOR v_company IN 
    SELECT DISTINCT company_id FROM products WHERE location_id IS NULL
  LOOP
    -- Get first active location (prefer inventory type)
    SELECT id INTO v_default_location
    FROM locations
    WHERE company_id = v_company.company_id
    AND status = 'active'
    ORDER BY 
      CASE WHEN type = 'inventory' THEN 1 ELSE 2 END,
      created_at ASC
    LIMIT 1;
    
    -- Assign products to this location if found
    IF v_default_location IS NOT NULL THEN
      UPDATE products
      SET location_id = v_default_location
      WHERE company_id = v_company.company_id
      AND location_id IS NULL;
      
      GET DIAGNOSTICS v_products_updated = ROW_COUNT;
      RAISE NOTICE 'Migrated % products for company % to location %', 
        v_products_updated, v_company.company_id, v_default_location;
    ELSE
      -- Company has no locations - report this
      SELECT COUNT(*) INTO v_products_remaining
      FROM products
      WHERE company_id = v_company.company_id
      AND location_id IS NULL;
      
      RAISE WARNING 'Company % has % products but no active locations. Please create a location first.', 
        v_company.company_id, v_products_remaining;
    END IF;
  END LOOP;
  
  -- Check if there are still products without locations
  SELECT COUNT(*) INTO v_products_remaining
  FROM products
  WHERE location_id IS NULL;
  
  IF v_products_remaining > 0 THEN
    RAISE NOTICE '% products still need location assignment. NOT NULL constraint will not be applied.', v_products_remaining;
  ELSE
    RAISE NOTICE 'All products successfully migrated to locations.';
  END IF;
END $$;

-- Only make location_id required if ALL products have been assigned
DO $$
DECLARE
  v_null_count integer;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM products
  WHERE location_id IS NULL;
  
  IF v_null_count = 0 THEN
    ALTER TABLE products ALTER COLUMN location_id SET NOT NULL;
    RAISE NOTICE 'location_id column set to NOT NULL';
  ELSE
    RAISE WARNING 'Skipping NOT NULL constraint - % products still have null location_id', v_null_count;
    RAISE WARNING 'Create locations for companies, assign products, then run: ALTER TABLE products ALTER COLUMN location_id SET NOT NULL;';
  END IF;
END $$;

-- Update RLS policies to include location access
DROP POLICY IF EXISTS "Users can view company products" ON products;
CREATE POLICY "Users can view company products"
ON products FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create products" ON products;
CREATE POLICY "Users can create products"
ON products FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
  AND location_id IN (
    SELECT id FROM locations 
    WHERE company_id = products.company_id 
    AND status = 'active'
  )
);

DROP POLICY IF EXISTS "Users can update products" ON products;
CREATE POLICY "Users can update products"
ON products FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- =====================================================
-- HELPER FUNCTION: Get products by location
-- =====================================================

CREATE OR REPLACE FUNCTION get_products_by_location(
  p_company_id uuid,
  p_location_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name varchar,
  sku varchar,
  price numeric,
  stock_quantity numeric,
  location_name varchar,
  location_type varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.price,
    COALESCE(SUM(sl.quantity), 0) as stock_quantity,
    l.name as location_name,
    l.type as location_type
  FROM products p
  LEFT JOIN stock_levels sl ON p.id = sl.product_id AND sl.location_id = p.location_id
  LEFT JOIN locations l ON p.location_id = l.id
  WHERE p.company_id = p_company_id
  AND (p_location_id IS NULL OR p.location_id = p_location_id)
  GROUP BY p.id, p.name, p.sku, p.price, l.name, l.type
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_products_by_location TO authenticated;

-- =====================================================
-- HELPER FUNCTION: Check if can add product to location
-- =====================================================

CREATE OR REPLACE FUNCTION can_add_product_to_location(
  p_company_id uuid,
  p_location_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_location_exists boolean;
  v_location_active boolean;
BEGIN
  -- Check if location exists and is active
  SELECT EXISTS (
    SELECT 1 FROM locations
    WHERE id = p_location_id
    AND company_id = p_company_id
    AND status = 'active'
  ) INTO v_location_exists;
  
  RETURN v_location_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_add_product_to_location TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN products.location_id IS 'Location where this product is stocked (POS or inventory warehouse)';
COMMENT ON FUNCTION get_products_by_location IS 'Get products filtered by location with stock levels';
COMMENT ON FUNCTION can_add_product_to_location IS 'Check if product can be added to specified location';

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- View products by location
-- SELECT * FROM get_products_by_location('your-company-id'::uuid, 'location-id'::uuid);

-- View all products with their locations
-- SELECT 
--   p.name,
--   p.sku,
--   l.name as location,
--   l.type as location_type
-- FROM products p
-- JOIN locations l ON p.location_id = l.id
-- WHERE p.company_id = 'your-company-id'::uuid;

-- Count products per location
-- SELECT 
--   l.name,
--   l.type,
--   COUNT(p.id) as product_count
-- FROM locations l
-- LEFT JOIN products p ON l.id = p.location_id
-- WHERE l.company_id = 'your-company-id'::uuid
-- GROUP BY l.id, l.name, l.type;
