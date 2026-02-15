-- Create brands table for Sales Hub products
-- Run this in your Supabase SQL Editor

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, company_id)
);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view brands" ON brands;
CREATE POLICY "Users can view brands" ON brands FOR SELECT USING (
  auth.uid() = created_by OR
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  auth.jwt()->>'role' = 'admin'
);

DROP POLICY IF EXISTS "Users can insert brands" ON brands;
CREATE POLICY "Users can insert brands" ON brands FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update brands" ON brands;
CREATE POLICY "Users can update brands" ON brands FOR UPDATE USING (
  auth.uid() = created_by OR
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  auth.jwt()->>'role' = 'admin'
);

-- Change brand column to brand_id foreign key
ALTER TABLE products DROP COLUMN IF EXISTS brand;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);