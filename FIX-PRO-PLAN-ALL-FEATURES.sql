-- =====================================================
-- FIX PRO PLAN FEATURES - ADD 'all_features' FLAG
-- =====================================================
-- The code checks for 'all_features' in the features array
-- but our PRO plan JSON only has descriptive text
-- =====================================================

-- Update PRO plan to include 'all_features' flag
UPDATE subscription_plans
SET features = '{
  "all_features": true,
  "features": [
    "Up to 10 users",
    "Unlimited products",
    "Unlimited invoices",
    "Unlimited POS locations",
    "Unlimited Inventory locations",
    "ALL FEATURES INCLUDED",
    "Dashboard (AI Center)",
    "Customer Management (Customer 360)",
    "Advanced POS (Sales Hub)",
    "After Sales & Task Management",
    "KPI Tracking",
    "Debt Collection",
    "Sales Pipeline",
    "Marketing Campaigns",
    "Product Intelligence",
    "Competitor Analysis",
    "Advanced Reports & Analytics",
    "Multi-user Collaboration",
    "Admin Panel",
    "My Workplace (COPCCA Apps)"
  ]
}'::jsonb
WHERE name = 'PRO';

-- Verify the update
SELECT 
  name,
  features
FROM subscription_plans
WHERE name = 'PRO';
