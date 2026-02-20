-- Fix: get_integration_stats with p_company_id parameter
-- This function was missing SECURITY DEFINER and search_path

DROP FUNCTION IF EXISTS get_integration_stats(UUID);

CREATE FUNCTION get_integration_stats(p_company_id UUID)
RETURNS TABLE(
  connected_count INTEGER, 
  overall_status VARCHAR, 
  last_sync VARCHAR, 
  issue_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_connected INTEGER;
  v_warning INTEGER;
  v_failed INTEGER;
  v_last_sync TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT COUNT(*) INTO v_connected
  FROM integrations
  WHERE company_id = p_company_id AND status = 'connected';
  
  SELECT 
    COUNT(*) FILTER (WHERE status = 'warning'),
    COUNT(*) FILTER (WHERE status IN ('error', 'failed'))
  INTO v_warning, v_failed
  FROM integrations
  WHERE company_id = p_company_id;
  
  SELECT MAX(last_sync_at) INTO v_last_sync
  FROM integrations
  WHERE company_id = p_company_id;
  
  RETURN QUERY SELECT
    v_connected,
    CASE 
      WHEN v_failed > 0 THEN 'error'::VARCHAR
      WHEN v_warning > 0 THEN 'warning'::VARCHAR
      ELSE 'healthy'::VARCHAR
    END,
    CASE 
      WHEN v_last_sync IS NULL THEN 'Never'::VARCHAR
      WHEN v_last_sync > NOW() - INTERVAL '1 hour' THEN 
        (ROUND(EXTRACT(EPOCH FROM (NOW() - v_last_sync)) / 60) || ' minutes ago')::VARCHAR
      ELSE 
        TO_CHAR(v_last_sync, 'YYYY-MM-DD HH24:MI')::VARCHAR
    END,
    v_warning + v_failed;
END;
$$;
