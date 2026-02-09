-- Fix RLS Policies for Customer Preferences and other tables
-- Apply this after the main sales hub migration

-- Update customer preferences policies to use user_metadata role
DROP POLICY IF EXISTS "Users can view customer preferences" ON customer_preferences;
CREATE POLICY "Users can view customer preferences" ON customer_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_hub_customers
      WHERE id = customer_preferences.customer_id
      AND (assigned_sales_rep = auth.uid() OR auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager'))
    )
  );

DROP POLICY IF EXISTS "Users can insert customer preferences" ON customer_preferences;
CREATE POLICY "Users can insert customer preferences" ON customer_preferences
  FOR INSERT WITH CHECK (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'user'));

DROP POLICY IF EXISTS "Users can update customer preferences" ON customer_preferences;
CREATE POLICY "Users can update customer preferences" ON customer_preferences
  FOR UPDATE USING (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'user'));

-- Update other policies to use user_metadata role
DROP POLICY IF EXISTS "Users can view their sessions" ON sales_hub_sessions;
CREATE POLICY "Users can view their sessions" ON sales_hub_sessions
  FOR SELECT USING (user_id = auth.uid() OR auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager'));

-- Update any other policies that use auth.jwt()->>'role' to use user_metadata