-- =====================================================
-- DELETE ALL DEMO COMPANIES
-- =====================================================
-- Remove demo/test companies from the system
-- =====================================================

-- Disable triggers to avoid errors
SET session_replication_role = replica;

-- Show demo companies before deletion
SELECT 
  '⚠️ DEMO COMPANIES TO BE DELETED' as warning,
  id,
  name,
  email,
  status,
  created_at
FROM companies
WHERE email IN (
  'admin@techcorp.ng',
  'admin@globaltrade.com',
  'contact@innovationhub.ng'
)
OR name IN (
  'Techcorp Nigeria Ltd',
  'Global Trade Solutions',
  'Innovation Hub Lagos'
)
ORDER BY created_at;

-- Delete demo companies
DELETE FROM companies
WHERE email IN (
  'admin@techcorp.ng',
  'admin@globaltrade.com',
  'contact@innovationhub.ng'
)
OR name IN (
  'Techcorp Nigeria Ltd',
  'Global Trade Solutions',
  'Innovation Hub Lagos'
);

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Show remaining companies
SELECT 
  '✅ REMAINING COMPANIES' as status,
  COUNT(*) as total_companies
FROM companies;

-- List remaining companies
SELECT 
  id,
  name,
  email,
  status,
  created_at
FROM companies
ORDER BY created_at DESC;
