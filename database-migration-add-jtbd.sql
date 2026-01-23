-- Migration to add JTBD (Jobs To Be Done) and Sentiment columns to companies table
-- Run this in your Supabase SQL Editor
--
-- These columns are automatically populated by the application based on:
-- JTBD: Generated from customer type, tier, pain points, and feedback history
-- Sentiment: Calculated from feedback analysis, pain points, health score, and churn risk
--
-- The application will analyze customer data and update these fields automatically
-- when viewing customer details in the Customer 360 view.

-- Add JTBD column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS jtbd TEXT;
COMMENT ON COLUMN companies.jtbd IS 'Jobs To Be Done - describes what the customer is trying to accomplish';

-- Add Sentiment column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative'));
COMMENT ON COLUMN companies.sentiment IS 'Customer sentiment towards the company/product - positive, neutral, or negative';
