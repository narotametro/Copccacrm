-- =====================================================
-- STOCK TRANSFER SYSTEM
-- Purpose: Transfer inventory between locations (warehouse to POS, warehouse to warehouse, etc.)
-- =====================================================

-- =====================================================
-- STOCK TRANSFERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  transfer_number varchar(50) UNIQUE NOT NULL, -- Auto-generated: ST-2026-0001
  
  -- Source and destination
  from_location_id uuid REFERENCES locations(id) NOT NULL,
  to_location_id uuid REFERENCES locations(id) NOT NULL,
  
  -- Transfer details
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  transfer_date timestamptz DEFAULT now(),
  expected_delivery_date timestamptz,
  actual_delivery_date timestamptz,
  
  -- Metadata
  notes text,
  transfer_day varchar(20), -- Day of week when created
  created_by uuid REFERENCES users(id) NOT NULL,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  received_by uuid REFERENCES users(id),
  received_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT different_locations CHECK (from_location_id != to_location_id)
);

-- =====================================================
-- STOCK TRANSFER ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid REFERENCES stock_transfers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  
  -- Quantities
  quantity_requested numeric(10, 2) NOT NULL CHECK (quantity_requested > 0),
  quantity_sent numeric(10, 2) DEFAULT 0,
  quantity_received numeric(10, 2) DEFAULT 0,
  
  -- Product details (snapshot at time of transfer)
  product_name varchar(255) NOT NULL,
  product_sku varchar(100),
  unit_of_measure varchar(50) DEFAULT 'pcs',
  
  -- Notes
  notes text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_stock_transfers_company ON stock_transfers(company_id);
CREATE INDEX idx_stock_transfers_from_location ON stock_transfers(from_location_id);
CREATE INDEX idx_stock_transfers_to_location ON stock_transfers(to_location_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX idx_stock_transfers_date ON stock_transfers(transfer_date DESC);
CREATE INDEX idx_stock_transfers_number ON stock_transfers(transfer_number);
CREATE INDEX idx_stock_transfer_items_transfer ON stock_transfer_items(transfer_id);
CREATE INDEX idx_stock_transfer_items_product ON stock_transfer_items(product_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- Users can view transfers in their company
CREATE POLICY "Users can view company stock transfers"
ON stock_transfers FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Users can create transfers in their company
CREATE POLICY "Users can create stock transfers"
ON stock_transfers FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Users can update their company's transfers
CREATE POLICY "Users can update company stock transfers"
ON stock_transfers FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Transfer items policies
CREATE POLICY "Users can view transfer items"
ON stock_transfer_items FOR SELECT
USING (
  transfer_id IN (
    SELECT id FROM stock_transfers WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can manage transfer items"
ON stock_transfer_items FOR ALL
USING (
  transfer_id IN (
    SELECT id FROM stock_transfers WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  )
);

-- =====================================================
-- FUNCTION: AUTO-GENERATE TRANSFER NUMBER
-- =====================================================

CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year varchar(4);
  v_count int;
  v_number varchar(50);
BEGIN
  v_year := TO_CHAR(NEW.transfer_date, 'YYYY');
  
  -- Get count of transfers this year for this company
  SELECT COUNT(*) INTO v_count
  FROM stock_transfers
  WHERE company_id = NEW.company_id
  AND EXTRACT(YEAR FROM transfer_date) = EXTRACT(YEAR FROM NEW.transfer_date);
  
  -- Generate transfer number: ST-2026-0001
  v_number := 'ST-' || v_year || '-' || LPAD((v_count + 1)::text, 4, '0');
  
  NEW.transfer_number := v_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_transfer_number ON stock_transfers;
CREATE TRIGGER trigger_generate_transfer_number
BEFORE INSERT ON stock_transfers
FOR EACH ROW
WHEN (NEW.transfer_number IS NULL)
EXECUTE FUNCTION generate_transfer_number();

-- =====================================================
-- FUNCTION: UPDATE STOCK ON TRANSFER COMPLETION
-- =====================================================

CREATE OR REPLACE FUNCTION update_stock_on_transfer()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Only update stock when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Set actual delivery date
    NEW.actual_delivery_date := NOW();
    
    -- Loop through all transfer items
    FOR v_item IN 
      SELECT * FROM stock_transfer_items WHERE transfer_id = NEW.id
    LOOP
      -- Deduct from source location
      UPDATE stock_levels
      SET 
        quantity = quantity - v_item.quantity_received,
        updated_at = NOW()
      WHERE product_id = v_item.product_id
      AND location_id = NEW.from_location_id;
      
      -- Add to destination location
      INSERT INTO stock_levels (product_id, location_id, quantity, company_id)
      VALUES (
        v_item.product_id,
        NEW.to_location_id,
        v_item.quantity_received,
        NEW.company_id
      )
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET
        quantity = stock_levels.quantity + v_item.quantity_received,
        updated_at = NOW();
        
      -- Record in stock history
      INSERT INTO stock_history (
        product_id,
        location_id,
        quantity_change,
        new_quantity,
        transaction_type,
        reference_id,
        notes,
        company_id,
        created_by
      ) VALUES (
        v_item.product_id,
        NEW.from_location_id,
        -v_item.quantity_received,
        (SELECT quantity FROM stock_levels WHERE product_id = v_item.product_id AND location_id = NEW.from_location_id),
        'transfer_out',
        NEW.id,
        'Stock transfer to ' || (SELECT name FROM locations WHERE id = NEW.to_location_id),
        NEW.company_id,
        NEW.received_by
      );
      
      INSERT INTO stock_history (
        product_id,
        location_id,
        quantity_change,
        new_quantity,
        transaction_type,
        reference_id,
        notes,
        company_id,
        created_by
      ) VALUES (
        v_item.product_id,
        NEW.to_location_id,
        v_item.quantity_received,
        (SELECT quantity FROM stock_levels WHERE product_id = v_item.product_id AND location_id = NEW.to_location_id),
        'transfer_in',
        NEW.id,
        'Stock transfer from ' || (SELECT name FROM locations WHERE id = NEW.from_location_id),
        NEW.company_id,
        NEW.received_by
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_transfer ON stock_transfers;
CREATE TRIGGER trigger_update_stock_on_transfer
BEFORE UPDATE ON stock_transfers
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_transfer();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get transfer summary statistics
CREATE OR REPLACE FUNCTION get_transfer_stats(p_company_id uuid, p_days int DEFAULT 30)
RETURNS json AS $$
DECLARE
  v_stats json;
BEGIN
  SELECT json_build_object(
    'total_transfers', (
      SELECT COUNT(*) FROM stock_transfers 
      WHERE company_id = p_company_id 
      AND transfer_date > NOW() - (p_days || ' days')::interval
    ),
    'pending_transfers', (
      SELECT COUNT(*) FROM stock_transfers 
      WHERE company_id = p_company_id 
      AND status = 'pending'
    ),
    'in_transit_transfers', (
      SELECT COUNT(*) FROM stock_transfers 
      WHERE company_id = p_company_id 
      AND status = 'in_transit'
    ),
    'completed_transfers', (
      SELECT COUNT(*) FROM stock_transfers 
      WHERE company_id = p_company_id 
      AND status = 'completed'
      AND transfer_date > NOW() - (p_days || ' days')::interval
    ),
    'total_items_transferred', (
      SELECT COALESCE(SUM(sti.quantity_received), 0)
      FROM stock_transfer_items sti
      JOIN stock_transfers st ON sti.transfer_id = st.id
      WHERE st.company_id = p_company_id
      AND st.status = 'completed'
      AND st.transfer_date > NOW() - (p_days || ' days')::interval
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_transfer_stats TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE stock_transfers IS 'Stock transfers between locations (warehouse to POS, warehouse to warehouse, etc.)';
COMMENT ON TABLE stock_transfer_items IS 'Individual items in a stock transfer';
COMMENT ON COLUMN stock_transfers.transfer_number IS 'Auto-generated unique transfer number (ST-2026-0001)';
COMMENT ON COLUMN stock_transfers.status IS 'pending: Created but not sent | in_transit: Sent but not received | completed: Received and stock updated | cancelled: Cancelled transfer';
COMMENT ON FUNCTION get_transfer_stats IS 'Get stock transfer statistics for a company';

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- View all transfers
-- SELECT * FROM stock_transfers WHERE company_id = 'your-company-id'::uuid ORDER BY created_at DESC;

-- View transfer with items
-- SELECT 
--   st.*,
--   json_agg(json_build_object(
--     'product_name', sti.product_name,
--     'quantity_requested', sti.quantity_requested,
--     'quantity_received', sti.quantity_received
--   )) as items
-- FROM stock_transfers st
-- LEFT JOIN stock_transfer_items sti ON sti.transfer_id = st.id
-- WHERE st.id = 'transfer-id'::uuid
-- GROUP BY st.id;

-- Get transfer stats
-- SELECT * FROM get_transfer_stats('your-company-id'::uuid, 30);
