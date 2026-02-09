-- Migration: After-sales tasks + feedback, marketing KPIs
-- Run in Supabase SQL editor

-- Ensure uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts with old policies)
DROP TABLE IF EXISTS after_sales_feedback CASCADE;
DROP TABLE IF EXISTS after_sales_tasks CASCADE;
DROP TABLE IF EXISTS marketing_kpis CASCADE;

-- After-sales tasks
CREATE TABLE IF NOT EXISTS after_sales_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in-progress','review','done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to TEXT,
  assigned_by TEXT,
  linked_type TEXT CHECK (linked_type IN ('customer','deal','competitor','product')),
  linked_id TEXT,
  linked_name TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  ai_priority_score INTEGER,
  ai_suggested_priority TEXT,
  is_overdue BOOLEAN DEFAULT FALSE,
  days_overdue INTEGER DEFAULT 0,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS after_sales_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES after_sales_tasks(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing KPIs
CREATE TABLE IF NOT EXISTS marketing_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  change TEXT NOT NULL,
  trend TEXT NOT NULL CHECK (trend IN ('up','down')),
  color TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_after_sales_tasks_company ON after_sales_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_after_sales_tasks_status ON after_sales_tasks(status);
CREATE INDEX IF NOT EXISTS idx_after_sales_feedback_task ON after_sales_feedback(task_id);
CREATE INDEX IF NOT EXISTS idx_marketing_kpis_company ON marketing_kpis(company_id);

-- Updated-at triggers reuse update_updated_at_column if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_after_sales_tasks_updated_at') THEN
      CREATE TRIGGER update_after_sales_tasks_updated_at
      BEFORE UPDATE ON after_sales_tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_marketing_kpis_updated_at') THEN
      CREATE TRIGGER update_marketing_kpis_updated_at
      BEFORE UPDATE ON marketing_kpis
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE after_sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company or owner access after_sales_tasks" ON after_sales_tasks;
DROP POLICY IF EXISTS "Authenticated users access after_sales_tasks" ON after_sales_tasks;
CREATE POLICY "Authenticated users access after_sales_tasks" ON after_sales_tasks
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Company or owner access after_sales_feedback" ON after_sales_feedback;
DROP POLICY IF EXISTS "Authenticated users access after_sales_feedback" ON after_sales_feedback;
CREATE POLICY "Authenticated users access after_sales_feedback" ON after_sales_feedback
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Company or owner access marketing_kpis" ON marketing_kpis;
DROP POLICY IF EXISTS "Authenticated users access marketing_kpis" ON marketing_kpis;
CREATE POLICY "Authenticated users access marketing_kpis" ON marketing_kpis
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
