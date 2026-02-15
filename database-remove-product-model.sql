-- COPCCA CRM - Remove Model Column from Products
-- Migration to remove the model column from products table as it's no longer needed

-- Check if model column exists and drop it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'products' AND column_name = 'model') THEN
        ALTER TABLE products DROP COLUMN model;
    END IF;
END $$;