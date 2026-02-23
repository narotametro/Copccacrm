-- =====================================================
-- UNIFIED LOCATIONS TABLE
-- Purpose: Replaces separate pos_locations and inventory_locations tables
--          with a single unified table for easier management
-- =====================================================

-- Create unified locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name varchar(255) NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('pos', 'inventory')),
  address text,
  city varchar(100),
  country varchar(100) DEFAULT 'Tanzania',
  phone varchar(50),
  email varchar(255),
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_primary boolean DEFAULT false,
  
  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_location_name_per_company UNIQUE (company_id, name)
);

-- Create indexes
CREATE INDEX idx_locations_company ON locations(company_id);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_city ON locations(city);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view locations in their company
CREATE POLICY "Users can view company locations"
ON locations FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- RLS Policies: Users can create locations in their company
CREATE POLICY "Users can create locations"
ON locations FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- RLS Policies: Users can update their company's locations
CREATE POLICY "Users can update company locations"
ON locations FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- RLS Policies: Admins can delete locations
CREATE POLICY "Admins can delete company locations"
ON locations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.company_id = locations.company_id
  )
);

-- =====================================================
-- MIGRATE DATA FROM OLD TABLES (if they exist)
-- =====================================================

-- Migrate from pos_locations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_locations') THEN
    INSERT INTO locations (id, company_id, name, type, address, city, status, created_at)
    SELECT 
      id,
      company_id,
      name,
      'pos',
      address,
      city,
      status,
      created_at
    FROM pos_locations
    ON CONFLICT (company_id, name) DO NOTHING;
  END IF;
END $$;

-- Migrate from inventory_locations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_locations') THEN
    INSERT INTO locations (id, company_id, name, type, address, city, status, created_at)
    SELECT 
      id,
      company_id,
      name,
      COALESCE(type, 'inventory'),
      address,
      city,
      status,
      created_at
    FROM inventory_locations
    ON CONFLICT (company_id, name) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- UPDATE TIMESTAMP TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_locations_updated_at ON locations;
CREATE TRIGGER trigger_update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_locations_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE locations IS 'Unified table for all location types (POS and inventory warehouses)';
COMMENT ON COLUMN locations.type IS 'Location type: pos (point of sale) or inventory (warehouse)';
COMMENT ON COLUMN locations.is_primary IS 'Indicates if this is the primary/main location for the company';
COMMENT ON COLUMN locations.status IS 'active or inactive - inactive locations are not shown in dropdowns';

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- View all active locations for a company
-- SELECT * FROM locations WHERE company_id = 'your-company-id'::uuid AND status = 'active' ORDER BY type, name;

-- View only POS locations
-- SELECT * FROM locations WHERE company_id = 'your-company-id'::uuid AND type = 'pos' AND status = 'active';

-- View only inventory locations
-- SELECT * FROM locations WHERE company_id = 'your-company-id'::uuid AND type = 'inventory' AND status = 'active';

-- Count locations by type
-- SELECT type, COUNT(*) FROM locations WHERE company_id = 'your-company-id'::uuid GROUP BY type;
