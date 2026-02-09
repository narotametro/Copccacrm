-- Remove all demo categories from the categories table
-- This will clear all existing categories so only real data remains
-- Run this in your Supabase SQL Editor

-- First, set category_id to NULL for all products to avoid foreign key constraint
UPDATE products SET category_id = NULL WHERE category_id IS NOT NULL;

-- Then delete all categories
DELETE FROM categories;

-- Reset the sequence if it exists
-- ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1;