-- Optimize products table for faster queries

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Composite index for inventory queries
CREATE INDEX IF NOT EXISTS idx_products_stock_company ON products(company_id, stock_quantity);

-- Analyze the table to update statistics
ANALYZE products;

-- Check table statistics
SELECT 
  schemaname,
  relname as tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'products';

-- Show current indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
ORDER BY indexname;
