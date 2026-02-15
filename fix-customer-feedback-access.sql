-- Fix customer_feedback table access issues
-- Run this in your Supabase SQL Editor

-- Ensure RLS is enabled
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Users can view feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Users can update feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Users can delete feedback for their companies" ON customer_feedback;

-- Create simplified SELECT policy (most permissive for testing)
-- This allows any authenticated user to view all feedback
-- You can restrict this later based on your security requirements
CREATE POLICY "Authenticated users can view all feedback" ON customer_feedback
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Create INSERT policy
CREATE POLICY "Authenticated users can insert feedback" ON customer_feedback
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Create UPDATE policy
CREATE POLICY "Authenticated users can update feedback" ON customer_feedback
FOR UPDATE USING (
  auth.role() = 'authenticated'
);

-- Create DELETE policy
CREATE POLICY "Authenticated users can delete feedback" ON customer_feedback
FOR DELETE USING (
  auth.role() = 'authenticated'
);

-- Verify the policies were created
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'customer_feedback';
