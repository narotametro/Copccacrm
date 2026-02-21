-- Create notifications system for real-time alerts

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'info', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  full_details TEXT,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_role TEXT,
  action_required BOOLEAN DEFAULT false,
  action_link TEXT,
  related_to TEXT,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_deleted ON notifications(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create helper function to create notifications
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_full_details TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'general',
  p_priority TEXT DEFAULT 'medium',
  p_action_required BOOLEAN DEFAULT false,
  p_action_link TEXT DEFAULT NULL,
  p_related_to TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_sender_name TEXT;
  v_sender_role TEXT;
BEGIN
  -- Get sender info
  SELECT full_name, role INTO v_sender_name, v_sender_role
  FROM users
  WHERE id = auth.uid();

  -- Insert notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    full_details,
    category,
    priority,
    action_required,
    action_link,
    related_to,
    related_id,
    sender_id,
    sender_name,
    sender_role
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_full_details,
    p_category,
    p_priority,
    p_action_required,
    p_action_link,
    p_related_to,
    p_related_id,
    auth.uid(),
    v_sender_name,
    v_sender_role
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Create trigger function for new customer notifications
DROP FUNCTION IF EXISTS notify_new_customer() CASCADE;

CREATE OR REPLACE FUNCTION notify_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the user who created the customer
  PERFORM create_notification(
    NEW.created_by,
    'success',
    '🎉 New Customer Added',
    'Customer "' || NEW.name || '" has been successfully added to your CRM.',
    'You can now track interactions, manage deals, and monitor the relationship with ' || NEW.name || '.',
    'customers',
    'medium',
    false,
    '/app/customers/' || NEW.id::text,
    'customer',
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new customers
DROP TRIGGER IF EXISTS trigger_notify_new_customer ON companies;
CREATE TRIGGER trigger_notify_new_customer
  AFTER INSERT ON companies
  FOR EACH ROW
  WHEN (NEW.is_own_company = false)
  EXECUTE FUNCTION notify_new_customer();

-- Create trigger function for new order notifications
DROP FUNCTION IF EXISTS notify_new_order() CASCADE;

CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name TEXT;
BEGIN
  -- Get customer name
  SELECT full_name INTO v_customer_name
  FROM users
  WHERE id = NEW.customer_id;

  -- Notify the user who created the order
  PERFORM create_notification(
    NEW.created_by,
    'success',
    '💰 New Order Received',
    'Order #' || NEW.order_number || ' from ' || COALESCE(v_customer_name, 'customer') || ' - TSh ' || TO_CHAR(NEW.total_amount, 'FM999,999,999'),
    'A new order has been received and is ready for processing. Total amount: TSh ' || TO_CHAR(NEW.total_amount, 'FM999,999,999'),
    'sales',
    'high',
    false,
    '/app/sales-hub',
    'order',
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS trigger_notify_new_order ON sales_hub_orders;
CREATE TRIGGER trigger_notify_new_order
  AFTER INSERT ON sales_hub_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- Create trigger function for low stock notifications
DROP FUNCTION IF EXISTS notify_low_stock() CASCADE;

CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_stock INTEGER;
BEGIN
  -- Get minimum stock level (default 10 if not set)
  v_min_stock := COALESCE(NEW.min_stock_level, 10);

  -- Check if stock is low and notify
  IF NEW.stock_quantity <= v_min_stock AND (OLD.stock_quantity IS NULL OR OLD.stock_quantity > v_min_stock) THEN
    PERFORM create_notification(
      NEW.created_by,
      'warning',
      '⚠️ Low Stock Alert',
      'Product "' || NEW.name || '" is running low: ' || NEW.stock_quantity || ' units remaining',
      'The stock level for ' || NEW.name || ' has dropped to ' || NEW.stock_quantity || ' units. Minimum recommended level is ' || v_min_stock || '. Consider restocking soon.',
      'inventory',
      'high',
      true,
      '/app/sales-hub',
      'product',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for low stock
DROP TRIGGER IF EXISTS trigger_notify_low_stock ON products;
CREATE TRIGGER trigger_notify_low_stock
  AFTER INSERT OR UPDATE OF stock_quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();

-- Create trigger function for invoice payment notifications
DROP FUNCTION IF EXISTS notify_invoice_paid() CASCADE;

CREATE OR REPLACE FUNCTION notify_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify when status changes to paid
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM create_notification(
      NEW.created_by,
      'success',
      '✅ Invoice Paid',
      'Invoice #' || NEW.invoice_number || ' has been marked as paid - TSh ' || TO_CHAR(NEW.total_amount, 'FM999,999,999'),
      'Payment received for invoice #' || NEW.invoice_number || '. Total amount: TSh ' || TO_CHAR(NEW.total_amount, 'FM999,999,999'),
      'finance',
      'medium',
      false,
      '/app/invoices/' || NEW.id::text,
      'invoice',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for invoice payments
DROP TRIGGER IF EXISTS trigger_notify_invoice_paid ON invoices;
CREATE TRIGGER trigger_notify_invoice_paid
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_paid();

-- Create trigger function for overdue invoice notifications
DROP FUNCTION IF EXISTS notify_invoice_overdue() CASCADE;

CREATE OR REPLACE FUNCTION notify_invoice_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify when status changes to overdue
  IF NEW.status = 'overdue' AND (OLD.status IS NULL OR OLD.status != 'overdue') THEN
    PERFORM create_notification(
      NEW.created_by,
      'error',
      '🚨 Invoice Overdue',
      'Invoice #' || NEW.invoice_number || ' is now overdue - TSh ' || TO_CHAR(NEW.total_amount, 'FM999,999,999'),
      'Invoice #' || NEW.invoice_number || ' has passed its due date and is now overdue. Please follow up with the customer.',
      'finance',
      'urgent',
      true,
      '/app/invoices/' || NEW.id::text,
      'invoice',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for overdue invoices
DROP TRIGGER IF EXISTS trigger_notify_invoice_overdue ON invoices;
CREATE TRIGGER trigger_notify_invoice_overdue
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_overdue();

-- Create welcome notification function
DROP FUNCTION IF EXISTS create_welcome_notification(UUID);

CREATE OR REPLACE FUNCTION create_welcome_notification(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    full_details,
    category,
    priority,
    sender_name,
    sender_role
  ) VALUES (
    p_user_id,
    'success',
    '🎉 Welcome to COPCCA CRM!',
    'Your account has been successfully created. Start exploring the platform!',
    'Welcome aboard! COPCCA CRM helps you manage customers, track sales, monitor inventory, and grow your business. Start by adding your first customer or exploring the dashboard.',
    'system',
    'medium',
    'COPCCA System',
    'system'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_welcome_notification TO authenticated;

COMMENT ON TABLE notifications IS 'System-wide notifications for user alerts and activity updates';
COMMENT ON FUNCTION create_notification IS 'Helper function to create notifications with sender info';
COMMENT ON FUNCTION create_welcome_notification IS 'Creates a welcome notification for new users';
