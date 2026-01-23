-- COPCCA CRM - Minimal Setup for KPI System
-- Run this FIRST if you haven't run database-setup.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create minimal tables needed for KPI system (without auth references for simplicity)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Insert a sample user and company for testing (using explicit UUID generation)
DO $$
DECLARE
    user_id UUID;
    company_id UUID;
BEGIN
    -- Insert sample user if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') THEN
        INSERT INTO users (id, email, full_name, role)
        VALUES (uuid_generate_v4(), 'admin@example.com', 'Admin User', 'admin')
        RETURNING id INTO user_id;
    ELSE
        SELECT id INTO user_id FROM users WHERE email = 'admin@example.com' LIMIT 1;
    END IF;

    -- Insert sample company if not exists
    IF NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Sample Company') THEN
        INSERT INTO companies (id, name, industry, status, created_by)
        VALUES (uuid_generate_v4(), 'Sample Company', 'Technology', 'active', user_id)
        RETURNING id INTO company_id;
    END IF;
END $$;