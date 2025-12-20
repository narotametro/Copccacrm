-- ============================================
-- POCKET CRM - DATABASE SCHEMA
-- ============================================
-- Clean, organized, and well-structured database
-- Version: 1.0
-- Last Updated: 2025-11-21
-- ============================================

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending')),
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================
-- 2. COMPANIES & TEAMS
-- ============================================

-- Companies (for branding)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    industry TEXT,
    website TEXT,
    show_on_all_pages BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);

-- Team memberships (who belongs to which team/admin)
CREATE TABLE IF NOT EXISTS team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(admin_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_team_admin ON team_memberships(admin_id);
CREATE INDEX IF NOT EXISTS idx_team_member ON team_memberships(member_id);

-- ============================================
-- 3. INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_admin ON invitations(admin_id);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);

-- ============================================
-- 4. AFTER-SALES TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS after_sales_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    product TEXT NOT NULL,
    purchase_date DATE,
    follow_up_date DATE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    notes TEXT,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    ai_enabled BOOLEAN NOT NULL DEFAULT false,
    last_contact_date DATE,
    next_action TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aftersales_user ON after_sales_records(user_id);
CREATE INDEX IF NOT EXISTS idx_aftersales_status ON after_sales_records(status);
CREATE INDEX IF NOT EXISTS idx_aftersales_priority ON after_sales_records(priority);
CREATE INDEX IF NOT EXISTS idx_aftersales_followup ON after_sales_records(follow_up_date);

-- ============================================
-- 5. COMPETITOR INTELLIGENCE
-- ============================================

CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    strengths TEXT,
    weaknesses TEXT,
    pricing_strategy TEXT,
    market_share DECIMAL(5,2), -- Percentage
    threat_level TEXT NOT NULL DEFAULT 'Medium' CHECK (threat_level IN ('Low', 'Medium', 'High', 'Critical')),
    notes TEXT,
    last_analyzed_date DATE,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitors_user ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_threat ON competitors(threat_level);

-- ============================================
-- 6. MY PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS my_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(12,2),
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT,
    features TEXT[],
    target_market TEXT,
    competitive_advantage TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Discontinued')),
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_user ON my_products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON my_products(status);

-- ============================================
-- 7. DEBT COLLECTION
-- ============================================

CREATE TABLE IF NOT EXISTS debt_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    invoice_number TEXT,
    invoice_date DATE,
    due_date DATE NOT NULL,
    amount_total DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_remaining DECIMAL(12,2) GENERATED ALWAYS AS (amount_total - amount_paid) STORED,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Paid', 'Paid', 'Overdue', 'Written Off')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    days_overdue INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN due_date < CURRENT_DATE THEN CURRENT_DATE - due_date
            ELSE 0
        END
    ) STORED,
    payment_method TEXT,
    last_contact_date DATE,
    next_follow_up DATE,
    notes TEXT,
    ai_enabled BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_user ON debt_records(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_status ON debt_records(status);
CREATE INDEX IF NOT EXISTS idx_debt_priority ON debt_records(priority);
CREATE INDEX IF NOT EXISTS idx_debt_due_date ON debt_records(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_overdue ON debt_records(days_overdue);

-- ============================================
-- 8. SALES & MARKETING STRATEGIES
-- ============================================

CREATE TABLE IF NOT EXISTS sales_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('SEO', 'Social Media', 'Email Marketing', 'Content Marketing', 'Paid Ads', 'Partnerships', 'Events', 'Other')),
    target_audience TEXT,
    budget DECIMAL(12,2),
    currency TEXT NOT NULL DEFAULT 'USD',
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'Paused', 'Completed', 'Cancelled')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    expected_roi DECIMAL(5,2), -- Percentage
    actual_roi DECIMAL(5,2), -- Percentage
    kpis TEXT[],
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategies_user ON sales_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_status ON sales_strategies(status);
CREATE INDEX IF NOT EXISTS idx_strategies_category ON sales_strategies(category);

-- ============================================
-- 9. KPI TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS kpi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
    profit DECIMAL(12,2) GENERATED ALWAYS AS (revenue - expenses) STORED,
    sales_count INTEGER NOT NULL DEFAULT 0,
    new_customers INTEGER NOT NULL DEFAULT 0,
    customer_satisfaction DECIMAL(3,2) CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 5),
    conversion_rate DECIMAL(5,2), -- Percentage
    churn_rate DECIMAL(5,2), -- Percentage
    currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_kpi_user ON kpi_records(user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_date ON kpi_records(date DESC);

-- ============================================
-- 10. ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('after_sales', 'competitor', 'product', 'debt', 'strategy', 'kpi', 'user', 'system')),
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'completed', 'cancelled', 'invited', 'joined')),
    entity_type TEXT NOT NULL, -- 'customer', 'competitor', 'product', etc.
    entity_id TEXT,
    entity_name TEXT,
    description TEXT NOT NULL,
    metadata JSONB, -- Additional flexible data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- ============================================
-- 11. TRIGGERS FOR TIMESTAMPS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aftersales_updated_at BEFORE UPDATE ON after_sales_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON my_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debt_updated_at BEFORE UPDATE ON debt_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON sales_strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_updated_at BEFORE UPDATE ON kpi_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE my_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Users: Can view their own profile, admins can view all
CREATE POLICY users_select ON users FOR SELECT
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY users_update ON users FOR UPDATE
    USING (auth.uid() = id);

-- Companies: Users can view their own companies
CREATE POLICY companies_all ON companies FOR ALL
    USING (owner_id = auth.uid());

-- Team memberships: Admins can manage their teams
CREATE POLICY team_select ON team_memberships FOR SELECT
    USING (admin_id = auth.uid() OR member_id = auth.uid());

CREATE POLICY team_manage ON team_memberships FOR ALL
    USING (admin_id = auth.uid());

-- Invitations: Admins can manage their invitations
CREATE POLICY invitations_all ON invitations FOR ALL
    USING (admin_id = auth.uid());

-- After-sales: Users see their own, admins see their team's
CREATE POLICY aftersales_select ON after_sales_records FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM team_memberships 
            WHERE admin_id = auth.uid() AND member_id = user_id
        )
        OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY aftersales_manage ON after_sales_records FOR ALL
    USING (user_id = auth.uid());

-- Similar policies for other data tables
CREATE POLICY competitors_select ON competitors FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM team_memberships WHERE admin_id = auth.uid() AND member_id = user_id)
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY competitors_manage ON competitors FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY products_select ON my_products FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM team_memberships WHERE admin_id = auth.uid() AND member_id = user_id)
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY products_manage ON my_products FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY debt_select ON debt_records FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM team_memberships WHERE admin_id = auth.uid() AND member_id = user_id)
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY debt_manage ON debt_records FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY strategies_select ON sales_strategies FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM team_memberships WHERE admin_id = auth.uid() AND member_id = user_id)
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY strategies_manage ON sales_strategies FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY kpi_select ON kpi_records FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM team_memberships WHERE admin_id = auth.uid() AND member_id = user_id)
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY kpi_manage ON kpi_records FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY activities_select ON activities FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM team_memberships WHERE admin_id = auth.uid() AND member_id = user_id)
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY activities_insert ON activities FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 13. UTILITY VIEWS
-- ============================================

-- View for overdue debts
CREATE OR REPLACE VIEW overdue_debts AS
SELECT 
    d.*,
    u.name as user_name,
    u.email as user_email
FROM debt_records d
JOIN users u ON d.user_id = u.id
WHERE d.status IN ('Pending', 'Partially Paid', 'Overdue')
AND d.due_date < CURRENT_DATE
ORDER BY d.days_overdue DESC, d.amount_remaining DESC;

-- View for upcoming follow-ups
CREATE OR REPLACE VIEW upcoming_followups AS
SELECT 
    'after_sales' as type,
    id,
    user_id,
    customer_name,
    follow_up_date as date,
    status,
    priority
FROM after_sales_records
WHERE follow_up_date >= CURRENT_DATE
AND status NOT IN ('Completed', 'Cancelled')
UNION ALL
SELECT 
    'debt' as type,
    id,
    user_id,
    customer_name,
    next_follow_up as date,
    status,
    priority
FROM debt_records
WHERE next_follow_up >= CURRENT_DATE
AND status NOT IN ('Paid', 'Written Off')
ORDER BY date ASC;

-- View for user performance summary
CREATE OR REPLACE VIEW user_performance AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT a.id) as after_sales_count,
    COUNT(DISTINCT d.id) as debt_count,
    COALESCE(SUM(d.amount_remaining), 0) as total_debt_outstanding,
    COUNT(DISTINCT s.id) as strategies_count,
    AVG(k.profit) as avg_monthly_profit
FROM users u
LEFT JOIN after_sales_records a ON u.id = a.user_id
LEFT JOIN debt_records d ON u.id = d.user_id AND d.status NOT IN ('Paid', 'Written Off')
LEFT JOIN sales_strategies s ON u.id = s.user_id
LEFT JOIN kpi_records k ON u.id = k.user_id AND k.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.name, u.email, u.role;

-- ============================================
-- 14. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'User profiles extending Supabase auth';
COMMENT ON TABLE companies IS 'Company branding and information';
COMMENT ON TABLE team_memberships IS 'Admin-to-team-member relationships';
COMMENT ON TABLE invitations IS 'Team invitation codes with expiration';
COMMENT ON TABLE after_sales_records IS 'Customer follow-up tracking';
COMMENT ON TABLE competitors IS 'Competitor intelligence data';
COMMENT ON TABLE my_products IS 'Product catalog';
COMMENT ON TABLE debt_records IS 'Payment and debt collection tracking';
COMMENT ON TABLE sales_strategies IS 'Sales and marketing campaigns';
COMMENT ON TABLE kpi_records IS 'Daily performance metrics';
COMMENT ON TABLE activities IS 'Activity log for all user actions';

-- ============================================
-- END OF SCHEMA
-- ============================================
