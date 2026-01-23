-- Add missing created_by column to marketing_kpis table
ALTER TABLE marketing_kpis ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);