-- Migration to add sales performance tables
-- Run this in your Supabase SQL Editor

-- Create sales_reps table
CREATE TABLE sales_reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  deals_won INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  conversion_rate DECIMAL DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  target DECIMAL DEFAULT 0,
  avg_deal_size DECIMAL DEFAULT 0,
  avg_cycle_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create win_reasons table
CREATE TABLE win_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason TEXT NOT NULL,
  percentage DECIMAL DEFAULT 0,
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loss_reasons table
CREATE TABLE loss_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason TEXT NOT NULL,
  percentage DECIMAL DEFAULT 0,
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loss_reasons ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Authenticated users can access sales_reps" ON sales_reps FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access win_reasons" ON win_reasons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access loss_reasons" ON loss_reasons FOR ALL USING (auth.role() = 'authenticated');

-- Add triggers for updated_at
CREATE TRIGGER update_sales_reps_updated_at BEFORE UPDATE ON sales_reps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_win_reasons_updated_at BEFORE UPDATE ON win_reasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loss_reasons_updated_at BEFORE UPDATE ON loss_reasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();