-- =====================================================
-- CREATE: customer_notes table for Quick Notes feature
-- =====================================================
-- This creates a table to store quick notes for customers
-- with automatic timestamp tracking
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create customer_notes table
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  note_text TEXT NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_notes_company_id ON customer_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at DESC);

-- Enable RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "authenticated_users_select_notes" ON customer_notes
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "authenticated_users_insert_notes" ON customer_notes
FOR INSERT 
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM companies 
    WHERE id = customer_notes.company_id
  )
);

CREATE POLICY "authenticated_users_update_notes" ON customer_notes
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "authenticated_users_delete_notes" ON customer_notes
FOR DELETE 
TO authenticated
USING (created_by = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_notes TO authenticated;

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_notes'
ORDER BY ordinal_position;
