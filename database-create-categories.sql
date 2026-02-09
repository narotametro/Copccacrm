-- Create categories table for Sales Hub products
-- Run this in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
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
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view categories" ON categories;
CREATE POLICY "Users can view categories" ON categories FOR SELECT USING (
  auth.uid() = created_by OR
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  auth.jwt()->>'role' = 'admin'
);

DROP POLICY IF EXISTS "Users can insert categories" ON categories;
CREATE POLICY "Users can insert categories" ON categories FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update categories" ON categories;
CREATE POLICY "Users can update categories" ON categories FOR UPDATE USING (
  auth.uid() = created_by OR
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  auth.jwt()->>'role' = 'admin'
);

-- Add category_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_company_id ON categories(company_id);

-- Insert some default categories for existing products
INSERT INTO categories (name, description, company_id, created_by)
SELECT DISTINCT
  COALESCE(p.category, 'General') as name,
  'Auto-generated from existing products' as description,
  u.company_id,
  u.id as created_by
FROM products p
CROSS JOIN users u
WHERE u.company_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM categories c
  WHERE c.name = COALESCE(p.category, 'General')
  AND c.company_id = u.company_id
)
ON CONFLICT (name, company_id) DO NOTHING;

-- Update existing products to link to categories
UPDATE products
SET category_id = c.id
FROM categories c
WHERE products.category = c.name
AND products.company_id = c.company_id;

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();