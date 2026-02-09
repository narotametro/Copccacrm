-- Add min_stock_level column to products table for inventory management
-- Run this in your Supabase SQL Editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10;

-- Update existing products to have a default min_stock_level if not set
UPDATE products SET min_stock_level = 10 WHERE min_stock_level IS NULL;