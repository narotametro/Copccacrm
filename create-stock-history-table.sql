-- Create or update stock_history table with correct schema
-- This ensures the table exists with the right columns

-- Drop and recreate the table (WARNING: This will delete existing data)
-- Comment out the DROP if you want to preserve existing data
-- DROP TABLE IF EXISTS stock_history CASCADE;

-- Create stock_history table
CREATE TABLE IF NOT EXISTS stock_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL DEFAULT 0,
  quantity_after INTEGER NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_change_type ON stock_history(change_type);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_reference ON stock_history(reference_type, reference_id);

-- Enable Row Level Security
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to view stock history for their company's products
CREATE POLICY "Users can view stock history for their company products" ON stock_history
  FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      INNER JOIN users u ON u.company_id = p.company_id
      WHERE u.id = auth.uid()
    )
  );

-- Allow authenticated users to insert stock history for their company's products
CREATE POLICY "Users can insert stock history for their company products" ON stock_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM products p
      INNER JOIN users u ON u.company_id = p.company_id
      WHERE u.id = auth.uid()
    )
  );

-- Allow authenticated users to update stock history for their company's products
CREATE POLICY "Users can update stock history for their company products" ON stock_history
  FOR UPDATE
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      INNER JOIN users u ON u.company_id = p.company_id
      WHERE u.id = auth.uid()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM products p
      INNER JOIN users u ON u.company_id = p.company_id
      WHERE u.id = auth.uid()
    )
  );

-- Verify the structure
SELECT 'Stock history table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;
