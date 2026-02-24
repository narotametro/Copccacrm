-- =====================================================
-- FIX SALES PERFORMANCE TABLES - ADD MISSING COMPANY_ID
-- Run this to add company_id columns to existing tables
-- =====================================================

-- Add company_id to sales_reps if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sales_reps' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE sales_reps ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id column to sales_reps table';
  ELSE
    RAISE NOTICE 'company_id column already exists in sales_reps table';
  END IF;
END $$;

-- Add company_id to win_reasons if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'win_reasons' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE win_reasons ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id column to win_reasons table';
  ELSE
    RAISE NOTICE 'company_id column already exists in win_reasons table';
  END IF;
END $$;

-- Add company_id to loss_reasons if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'loss_reasons' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE loss_reasons ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id column to loss_reasons table';
  ELSE
    RAISE NOTICE 'company_id column already exists in loss_reasons table';
  END IF;
END $$;

-- Add missing columns to sales_reps if they don't exist
DO $$
BEGIN
  -- Check and add deals_won
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reps' AND column_name = 'deals_won') THEN
    ALTER TABLE sales_reps ADD COLUMN deals_won INTEGER DEFAULT 0;
  END IF;
  
  -- Check and add deals_lost
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reps' AND column_name = 'deals_lost') THEN
    ALTER TABLE sales_reps ADD COLUMN deals_lost INTEGER DEFAULT 0;
  END IF;
  
  -- Check and add conversion_rate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reps' AND column_name = 'conversion_rate') THEN
    ALTER TABLE sales_reps ADD COLUMN conversion_rate DECIMAL DEFAULT 0;
  END IF;
  
  -- Check and add revenue
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reps' AND column_name = 'revenue') THEN
    ALTER TABLE sales_reps ADD COLUMN revenue DECIMAL DEFAULT 0;
  END IF;
  
  -- Check and add target
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reps' AND column_name = 'target') THEN
    ALTER TABLE sales_reps ADD COLUMN target DECIMAL DEFAULT 0;
  END IF;
  
  -- Check and add avg_deal_size
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reps' AND column_name = 'avg_deal_size') THEN
    ALTER TABLE sales_reps ADD COLUMN avg_deal_size DECIMAL DEFAULT 0;
  END IF;
  
  -- Check and add avg_cycle_days
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reps' AND column_name = 'avg_cycle_days') THEN
    ALTER TABLE sales_reps ADD COLUMN avg_cycle_days INTEGER DEFAULT 0;
  END IF;
  
  RAISE NOTICE 'Checked and added missing columns to sales_reps';
END $$;

-- Add missing columns to win_reasons if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'win_reasons' AND column_name = 'percentage') THEN
    ALTER TABLE win_reasons ADD COLUMN percentage DECIMAL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'win_reasons' AND column_name = 'ai_insight') THEN
    ALTER TABLE win_reasons ADD COLUMN ai_insight TEXT;
  END IF;
  
  RAISE NOTICE 'Checked and added missing columns to win_reasons';
END $$;

-- Add missing columns to loss_reasons if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loss_reasons' AND column_name = 'percentage') THEN
    ALTER TABLE loss_reasons ADD COLUMN percentage DECIMAL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loss_reasons' AND column_name = 'ai_insight') THEN
    ALTER TABLE loss_reasons ADD COLUMN ai_insight TEXT;
  END IF;
  
  RAISE NOTICE 'Checked and added missing columns to loss_reasons';
END $$;

-- Verify final column counts
SELECT 
  t.table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
  array_agg(c.column_name ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('sales_reps', 'win_reasons', 'loss_reasons')
GROUP BY t.table_name
ORDER BY t.table_name;
