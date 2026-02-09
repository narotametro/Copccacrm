-- Add missing columns to products table for Sales Hub functionality
-- Run this in your Supabase SQL Editor

-- Add company_id column
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add reorder_level column
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 5;

-- Update RLS policy to include company_id
DROP POLICY IF EXISTS "Users can manage own products" ON products;
CREATE POLICY "Users can manage own products" ON products
  FOR ALL USING (
    auth.uid() = created_by OR
    auth.jwt()->>'role' = 'admin' OR
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Create index for company_id
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);