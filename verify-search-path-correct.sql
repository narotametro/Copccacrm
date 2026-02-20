-- CORRECT verification query for search_path
-- This checks pg_proc.proconfig which stores function configuration parameters

SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proconfig IS NOT NULL AND 
         EXISTS (SELECT 1 FROM unnest(p.proconfig) AS config WHERE config LIKE 'search_path=%')
    THEN true
    ELSE false
  END as has_search_path,
  p.proconfig as config_array
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER
ORDER BY p.proname, pg_get_function_arguments(p.oid);
