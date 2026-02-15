-- Add display and payment settings columns to companies table
-- Run this migration to fix 400 errors when querying companies

-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add show_company_name_in_navbar column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'show_company_name_in_navbar'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN show_company_name_in_navbar BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Added show_company_name_in_navbar column to companies table';
    END IF;

    -- Add payment_info column (JSONB for flexible payment data structure)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'payment_info'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN payment_info JSONB DEFAULT '{
            "m_pesa": {"paybill": "", "account": ""},
            "bank_transfer": {"account": "", "bank": ""},
            "cash_payment": {"accepted_at": "", "hours": ""}
        }'::jsonb;
        
        RAISE NOTICE 'Added payment_info column to companies table';
    END IF;

    -- Add tin (Tax Identification Number) column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'tin'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN tin TEXT;
        
        RAISE NOTICE 'Added tin column to companies table';
    END IF;

    -- Add city column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN city TEXT;
        
        RAISE NOTICE 'Added city column to companies table';
    END IF;

    -- Add country column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN country TEXT;
        
        RAISE NOTICE 'Added country column to companies table';
    END IF;
END $$;

-- ============================================
-- ADD USER PREFERENCES AND NOTIFICATION SETTINGS
-- ============================================

DO $$ 
BEGIN
    -- Add preferences JSONB column to users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN preferences JSONB DEFAULT '{
            "language": "en",
            "timezone": "UTC+1",
            "currency": "NGN",
            "dateFormat": "DD/MM/YYYY"
        }'::jsonb;
        
        RAISE NOTICE 'Added preferences column to users table';
    END IF;

    -- Add notification_settings JSONB column to users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'notification_settings'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN notification_settings JSONB DEFAULT '{
            "email": true,
            "push": true,
            "sms": false,
            "deals": true,
            "tasks": true,
            "reports": true
        }'::jsonb;
        
        RAISE NOTICE 'Added notification_settings column to users table';
    END IF;
END $$;

-- Create index on payment_info for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_payment_info ON companies USING GIN (payment_info);

-- Create indexes on user preferences for better query performance
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING GIN (preferences);
CREATE INDEX IF NOT EXISTS idx_users_notification_settings ON users USING GIN (notification_settings);

-- Verify the columns were added
SELECT 'Companies Table' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'companies'
AND column_name IN ('show_company_name_in_navbar', 'payment_info', 'tin', 'city', 'country')

UNION ALL

SELECT 'Users Table' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('preferences', 'notification_settings')

ORDER BY table_name, column_name;
