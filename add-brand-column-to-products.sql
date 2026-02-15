-- Add brand column to products table
-- Migration to support brand information for products

-- Add brand column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;

-- Add comment for the new column
COMMENT ON COLUMN products.brand IS 'Brand name or manufacturer of the product';