-- =====================================================
-- Add function to check if a product is used in orders
-- =====================================================
-- This provides an efficient way to check if a product
-- appears in any sales_hub_orders items array
-- =====================================================

-- Create function to check if product is used in any orders
CREATE OR REPLACE FUNCTION check_product_in_orders(product_uuid UUID)
RETURNS TABLE (
  order_count BIGINT,
  sample_orders JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH orders_with_product AS (
    SELECT 
      id,
      order_number,
      created_at,
      items
    FROM sales_hub_orders
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(items) AS item
      WHERE (item->>'product_id')::uuid = product_uuid
    )
    LIMIT 5
  )
  SELECT 
    (SELECT COUNT(*) 
     FROM sales_hub_orders 
     WHERE EXISTS (
       SELECT 1
       FROM jsonb_array_elements(items) AS item
       WHERE (item->>'product_id')::uuid = product_uuid
     )) AS order_count,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'order_number', order_number,
          'created_at', created_at
        )
      )
      FROM orders_with_product),
      '[]'::jsonb
    ) AS sample_orders;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_product_in_orders(UUID) TO authenticated;

-- Comment
COMMENT ON FUNCTION check_product_in_orders(UUID) IS 
'Checks if a product (by UUID) is used in any sales_hub_orders. Returns count and sample orders.';

-- =====================================================
-- Usage Example:
-- =====================================================
-- SELECT * FROM check_product_in_orders('product-uuid-here');
--
-- Returns:
-- {
--   "order_count": 5,
--   "sample_orders": [
--     {"id": "...", "order_number": "ORD-001", "created_at": "2026-03-15"},
--     ...
--   ]
-- }
-- =====================================================
