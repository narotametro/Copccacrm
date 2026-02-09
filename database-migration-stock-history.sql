-- COPCCA CRM - Stock History Migration
-- Add stock_history table to track all inventory changes

CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant TEXT,
  action TEXT NOT NULL CHECK (action IN ('sale', 'pos_sale', 'return', 'restock', 'manual_adjustment', 'transfer_in', 'transfer_out')),
  quantity_change INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  location TEXT,
  reference_type TEXT CHECK (reference_type IN ('invoice', 'pos_receipt', 'purchase_order', 'adjustment_note')),
  reference_id TEXT,
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view stock history" ON stock_history;
CREATE POLICY "Users can view stock history" ON stock_history FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert stock history" ON stock_history;
CREATE POLICY "Users can insert stock history" ON stock_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_history_action ON stock_history(action);
CREATE INDEX IF NOT EXISTS idx_stock_history_reference_id ON stock_history(reference_id);