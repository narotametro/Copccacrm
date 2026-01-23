-- Fix RLS policies for customer_feedback table
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Users can view feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Users can update feedback for their companies" ON customer_feedback;

-- Create policies for customer_feedback table
-- Allow authenticated users to insert feedback for companies they have access to
CREATE POLICY "Users can insert feedback for their companies" ON customer_feedback
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = customer_feedback.company_id
    AND (
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.company_id = c.id
        AND u.role IN ('admin', 'manager')
      )
    )
  )
);

-- Allow authenticated users to view feedback for companies they have access to
CREATE POLICY "Users can view feedback for their companies" ON customer_feedback
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = customer_feedback.company_id
    AND (
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.company_id = c.id
      )
    )
  )
);

-- Allow authenticated users to update feedback for companies they have access to
CREATE POLICY "Users can update feedback for their companies" ON customer_feedback
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = customer_feedback.company_id
    AND (
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.company_id = c.id
        AND u.role IN ('admin', 'manager')
      )
    )
  )
);