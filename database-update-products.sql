-- Update products table: make SKU optional (remove UNIQUE constraint) and rename reorder_level to model
-- Run this in your Supabase SQL Editor after the previous migrations

-- Remove UNIQUE constraint from SKU to allow duplicates
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;

-- Rename reorder_level column to model (only if it still exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'products' AND column_name = 'reorder_level') THEN
        ALTER TABLE products RENAME COLUMN reorder_level TO model;
    END IF;
END $$;

-- Change model column to TEXT to accept both numbers and letters
ALTER TABLE products ALTER COLUMN model TYPE TEXT;