-- COPCCA CRM - Marketing Tables Migration (Ultra Simple)
-- Add missing marketing-related tables to support the marketing functionality

-- Create tables one by one
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT,
  category TEXT NOT NULL,
  description TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'social', 'paid', 'content', 'event', 'partnership')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'active', 'paused', 'completed', 'cancelled')),
  budget DECIMAL,
  spent DECIMAL DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roi DECIMAL,
  target_audience TEXT,
  start_date DATE,
  end_date DATE,
  channels TEXT[],
  content TEXT,
  goals TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  strategy_type TEXT CHECK (strategy_type IN ('4ps', 'growth', 'retention', 'brand', 'competitive')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  description TEXT,
  objectives TEXT,
  target_market TEXT,
  positioning TEXT,
  tactics TEXT,
  budget DECIMAL,
  timeline TEXT,
  kpis TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID,
  metric_name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  target DECIMAL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);