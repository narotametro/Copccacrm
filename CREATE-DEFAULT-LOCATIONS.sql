-- =====================================================
-- CREATE DEFAULT LOCATIONS FOR TEDDY
-- Purpose: Create default inventory/warehouse locations so sales system can function
-- =====================================================

DO $$
DECLARE
  v_teddy_user_id uuid;
  v_company_id uuid;
  v_main_warehouse_id uuid;
  v_pos_location_id uuid;
BEGIN
  -- Get teddy's user ID and company
  SELECT id, company_id INTO v_teddy_user_id, v_company_id
  FROM users
  WHERE email = 'teddy@gmail.com'
  LIMIT 1;

  IF v_teddy_user_id IS NULL THEN
    RAISE EXCEPTION '❌ User teddy@gmail.com not found!';
  END IF;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION '❌ Teddy has no company assigned! Assign a company first.';
  END IF;

  RAISE NOTICE '👤 Found User: %', v_teddy_user_id;
  RAISE NOTICE '🏢 Company ID: %', v_company_id;

  -- =====================================================
  -- CREATE MAIN WAREHOUSE (Inventory Location)
  -- =====================================================
  
  -- Check if warehouse already exists
  SELECT id INTO v_main_warehouse_id
  FROM locations
  WHERE company_id = v_company_id
  AND type = 'inventory'
  AND status = 'active'
  LIMIT 1;

  IF v_main_warehouse_id IS NULL THEN
    -- Create new main warehouse
    INSERT INTO locations (
      company_id,
      name,
      type,
      address,
      city,
      country,
      status,
      is_primary,
      created_by
    ) VALUES (
      v_company_id,
      'Main Warehouse',
      'inventory',
      'Dar es Salaam',
      'Dar es Salaam',
      'Tanzania',
      'active',
      true,
      v_teddy_user_id
    ) RETURNING id INTO v_main_warehouse_id;

    RAISE NOTICE '✅ Created Main Warehouse: %', v_main_warehouse_id;
  ELSE
    RAISE NOTICE '✓ Main Warehouse already exists: %', v_main_warehouse_id;
  END IF;

  -- =====================================================
  -- CREATE POS LOCATION (Optional but recommended)
  -- =====================================================
  
  -- Check if POS location already exists
  SELECT id INTO v_pos_location_id
  FROM locations
  WHERE company_id = v_company_id
  AND type = 'pos'
  AND status = 'active'
  LIMIT 1;

  IF v_pos_location_id IS NULL THEN
    -- Create new POS location
    INSERT INTO locations (
      company_id,
      name,
      type,
      address,
      city,
      country,
      status,
      is_primary,
      created_by
    ) VALUES (
      v_company_id,
      'Main Store',
      'pos',
      'Dar es Salaam',
      'Dar es Salaam',
      'Tanzania',
      'active',
      true,
      v_teddy_user_id
    ) RETURNING id INTO v_pos_location_id;

    RAISE NOTICE '✅ Created Main Store (POS): %', v_pos_location_id;
  ELSE
    RAISE NOTICE '✓ POS location already exists: %', v_pos_location_id;
  END IF;

  -- =====================================================
  -- SUMMARY
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LOCATION SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📦 Main Warehouse ID: %', v_main_warehouse_id;
  RAISE NOTICE '🏪 Main Store (POS) ID: %', v_pos_location_id;
  RAISE NOTICE '';
  RAISE NOTICE '💡 You can now:';
  RAISE NOTICE '   - Select warehouse in sales checkout';
  RAISE NOTICE '   - Assign products to locations';
  RAISE NOTICE '   - Track inventory per location';
  
END $$;

-- =====================================================
-- VERIFY LOCATIONS CREATED
-- =====================================================

SELECT 
  '📍 LOCATIONS FOR TEDDY' as section,
  l.id,
  l.name,
  l.type,
  l.city,
  l.status,
  l.is_primary,
  l.created_at
FROM locations l
JOIN users u ON u.company_id = l.company_id
WHERE u.email = 'teddy@gmail.com'
ORDER BY l.type, l.created_at;

-- Show count
SELECT 
  '📊 LOCATION COUNT' as summary,
  COUNT(*) as total_locations,
  COUNT(*) FILTER (WHERE type = 'inventory') as warehouses,
  COUNT(*) FILTER (WHERE type = 'pos') as pos_locations
FROM locations l
JOIN users u ON u.company_id = l.company_id
WHERE u.email = 'teddy@gmail.com';
