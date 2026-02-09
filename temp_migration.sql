-- COPCCA CRM - Add Sales Hub Orders Table
-- Migration to add dedicated table for storing completed sales hub orders

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sales_hub_orders table
CREATE TABLE IF NOT EXISTS sales_hub_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES sales_hub_customers(id) ON DELETE CASCADE,

  -- Order details
  subtotal DECIMAL NOT NULL DEFAULT 0,
  tax_amount DECIMAL NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'monetary')),
  discount_value DECIMAL DEFAULT 0,
  discount_amount DECIMAL DEFAULT 0,
  total_amount DECIMAL NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit')),

  -- Order items (stored as JSON for simplicity)
  items JSONB NOT NULL DEFAULT '[]',

  -- Status and metadata
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  notes TEXT,

  -- Audit fields
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sales_hub_orders_customer_id ON sales_hub_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_hub_orders_created_at ON sales_hub_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_hub_orders_status ON sales_hub_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_hub_orders_order_number ON sales_hub_orders(order_number);

-- Enable RLS
ALTER TABLE sales_hub_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view orders for their customers" ON sales_hub_orders;
CREATE POLICY "Users can view orders for their customers" ON sales_hub_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_hub_customers
      WHERE id = sales_hub_orders.customer_id
      AND (assigned_sales_rep = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'manager'))
    )
  );

DROP POLICY IF EXISTS "Users can create orders" ON sales_hub_orders;
CREATE POLICY "Users can create orders" ON sales_hub_orders
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update orders they created" ON sales_hub_orders;
CREATE POLICY "Users can update orders they created" ON sales_hub_orders
  FOR UPDATE USING (created_by = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'manager'));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON sales_hub_orders TO authenticated;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_sales_hub_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sales_hub_order_timestamp ON sales_hub_orders;
CREATE TRIGGER trigger_update_sales_hub_order_timestamp
  BEFORE UPDATE ON sales_hub_orders
  FOR EACH ROW EXECUTE FUNCTION update_sales_hub_order_updated_at();

-- Comments
COMMENT ON TABLE sales_hub_orders IS 'Stores completed orders from the Sales Hub with full order details';
COMMENT ON COLUMN sales_hub_orders.items IS 'JSON array containing order items with product details, quantities, and prices';

-- Migration completed successfully</content>
<parameter name="filePath">c:\Users\Administrator\Desktop\COPCCA-CRM\database-sales-hub-orders.sql
