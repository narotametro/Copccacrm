-- Remove all demo products from the products table
-- This will clear all existing products so only real data remains
-- Run this in your Supabase SQL Editor

DELETE FROM products;

-- Reset the sequence if it exists
-- ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;