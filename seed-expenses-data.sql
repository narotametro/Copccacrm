-- =====================================================
-- COPCCA CRM: Seed Sample Expenses Data
-- =====================================================
-- This populates the expenses table with realistic sample data for testing

-- =====================================================
-- 1. INSERT SAMPLE EXPENSES
-- =====================================================

-- Note: Replace 'YOUR_COMPANY_ID_HERE' with your actual company_id from the companies table
-- You can get it by running: SELECT id FROM companies LIMIT 1;

-- To use this script:
-- 1. Get your company_id: SELECT id, name FROM companies;
-- 2. Replace the placeholder below with your actual company_id
-- 3. Run this script in Supabase SQL Editor

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the first company (adjust if you have multiple companies)
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  
  -- Get the first user (adjust if needed)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- If no company or user found, raise error
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company found. Please create a company first.';
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please ensure you have authenticated users.';
  END IF;

  -- Insert sample expenses for the current month
  INSERT INTO expenses (
    title,
    description,
    amount,
    expense_date,
    category_name,
    payment_method,
    status,
    vendor_name,
    notes,
    is_recurring,
    recurrence_frequency,
    next_due_date,
    created_by,
    company_id
  ) VALUES
  
  -- February 2026 Expenses
  ('Office Rent - February 2026', 'Monthly office space rental', 1500000, '2026-02-01', 'Rent', 'Bank', 'Paid', 'ABC Properties Ltd', 'Paid via bank transfer', true, 'Monthly', '2026-03-01', v_user_id, v_company_id),
  
  ('Employee Salaries - February', 'Monthly salaries for 5 employees', 8500000, '2026-02-05', 'Salaries', 'Bank', 'Paid', NULL, 'Payroll processed', true, 'Monthly', '2026-03-05', v_user_id, v_company_id),
  
  ('Fuel & Transport', 'Delivery vehicle fuel for the month', 750000, '2026-02-03', 'Transport/Fuel', 'M-Pesa', 'Paid', 'Puma Energy', 'Multiple fill-ups', false, NULL, NULL, v_user_id, v_company_id),
  
  ('Inventory Purchase - Electronics', 'Purchased 50 smartphones for resale', 12500000, '2026-02-07', 'Inventory Purchase', 'Bank', 'Paid', 'Tech Suppliers Ltd', 'Bulk order with 10% discount', false, NULL, NULL, v_user_id, v_company_id),
  
  ('Packaging Materials', 'Boxes, bubble wrap, branded bags', 450000, '2026-02-08', 'Packaging', 'Cash', 'Paid', 'Packaging Solutions', 'Stock for 2 months', false, NULL, NULL, v_user_id, v_company_id),
  
  ('Facebook & Google Ads', 'Digital marketing campaign for new products', 2500000, '2026-02-10', 'Marketing/Ads', 'Credit', 'Paid', 'Meta Business', 'Valentine''s Day campaign', false, NULL, NULL, v_user_id, v_company_id),
  
  ('Electricity Bill - January', 'TANESCO electricity bill', 380000, '2026-02-06', 'Utilities', 'M-Pesa', 'Paid', 'TANESCO', 'Luku tokens purchased', true, 'Monthly', '2026-03-06', v_user_id, v_company_id),
  
  ('Internet & Office Airtime', 'Fiber internet + staff airtime bundles', 250000, '2026-02-04', 'Internet & Airtime', 'M-Pesa', 'Paid', 'Vodacom Tanzania', '200GB fiber + 20,000 TSh airtime', true, 'Monthly', '2026-03-04', v_user_id, v_company_id),
  
  ('POS System Repair', 'Fixed payment terminal and receipt printer', 180000, '2026-02-09', 'Equipment Repair', 'Cash', 'Paid', 'Tech Repair Hub', 'Replaced printer head', false, NULL, NULL, v_user_id, v_company_id),
  
  ('Business License Renewal', 'Annual TRA business license renewal', 450000, '2026-02-02', 'Taxes & Licenses', 'Bank', 'Paid', 'TRA (Tanzania Revenue Authority)', 'License valid until Feb 2027', false, NULL, NULL, v_user_id, v_company_id),
  
  ('Bank Loan Repayment', 'Monthly installment on business loan', 950000, '2026-02-11', 'Loan Repayment', 'Bank', 'Paid', 'CRDB Bank', 'Principal + interest', true, 'Monthly', '2026-03-11', v_user_id, v_company_id),
  
  ('Office Supplies', 'Stationery, cleaning supplies, water dispenser', 120000, '2026-02-05', 'Miscellaneous', 'Cash', 'Paid', 'Office Mart', 'Bulk purchase', false, NULL, NULL, v_user_id, v_company_id),
  
  -- Pending expenses
  ('Shipping & Logistics - Pending', 'Freight charges for incoming shipment', 850000, '2026-02-12', 'Transport/Fuel', 'Bank', 'Pending', 'Swift Logistics', 'Container arriving Feb 15', false, NULL, NULL, v_user_id, v_company_id),
  
  ('Website Hosting & Domain', 'Annual renewal for coppcacrm.com', 320000, '2026-02-10', 'Internet & Airtime', 'Credit', 'Pending', 'Hosting Provider', 'Renewal due Feb 20', false, NULL, NULL, v_user_id, v_company_id),
  
  -- January 2026 Expenses (for trend analysis)
  ('Office Rent - January 2026', 'Monthly office space rental', 1500000, '2026-01-01', 'Rent', 'Bank', 'Paid', 'ABC Properties Ltd', NULL, true, 'Monthly', '2026-02-01', v_user_id, v_company_id),
  
  ('Employee Salaries - January', 'Monthly salaries', 8500000, '2026-01-05', 'Salaries', 'Bank', 'Paid', NULL, NULL, true, 'Monthly', '2026-02-05', v_user_id, v_company_id),
  
  ('Fuel - January', 'Delivery vehicle fuel', 680000, '2026-01-15', 'Transport/Fuel', 'M-Pesa', 'Paid', 'Puma Energy', NULL, false, NULL, NULL, v_user_id, v_company_id),
  
  ('Inventory Purchase - January', 'Purchased electronics inventory', 9800000, '2026-01-10', 'Inventory Purchase', 'Bank', 'Paid', 'Tech Suppliers Ltd', NULL, false, NULL, NULL, v_user_id, v_company_id),
  
  ('Marketing Campaign - January', 'Social media ads for New Year sale', 1800000, '2026-01-08', 'Marketing/Ads', 'Credit', 'Paid', 'Meta Business', NULL, false, NULL, NULL, v_user_id, v_company_id),
  
  ('Electricity Bill - December', 'TANESCO bill', 350000, '2026-01-06', 'Utilities', 'M-Pesa', 'Paid', 'TANESCO', NULL, true, 'Monthly', '2026-02-06', v_user_id, v_company_id),
  
  ('Internet & Airtime - January', 'Fiber + airtime', 250000, '2026-01-04', 'Internet & Airtime', 'M-Pesa', 'Paid', 'Vodacom Tanzania', NULL, true, 'Monthly', '2026-02-04', v_user_id, v_company_id),
  
  ('Bank Loan Repayment - January', 'Monthly installment', 950000, '2026-01-11', 'Loan Repayment', 'Bank', 'Paid', 'CRDB Bank', NULL, true, 'Monthly', '2026-02-11', v_user_id, v_company_id),
  
  ('Office Supplies - January', 'Stationery and cleaning', 95000, '2026-01-12', 'Miscellaneous', 'Cash', 'Paid', 'Office Mart', NULL, false, NULL, NULL, v_user_id, v_company_id);

  RAISE NOTICE '✅ Sample expenses data seeded successfully!';
  RAISE NOTICE '📊 Inserted % expenses for company: %', 23, v_company_id;
  RAISE NOTICE '💰 Total expenses seeded: % TSh', 52825000;
  
END $$;

-- =====================================================
-- 2. VERIFY DATA
-- =====================================================

-- Check seeded expenses count
SELECT COUNT(*) as total_expenses, SUM(amount) as total_amount
FROM expenses;

-- Check by category
SELECT 
  category_name, 
  COUNT(*) as count, 
  SUM(amount) as total_amount,
  SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as pending_amount
FROM expenses
GROUP BY category_name
ORDER BY total_amount DESC;

-- Check by month
SELECT 
  DATE_TRUNC('month', expense_date) as month,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM expenses
GROUP BY DATE_TRUNC('month', expense_date)
ORDER BY month DESC;
