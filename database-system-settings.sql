-- Add system_settings table to store OpenAI API key and other configuration
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('openai_api_key', NULL, 'OpenAI API key for AI Assistant'),
  ('openai_model', 'gpt-4o-mini', 'OpenAI model to use'),
  ('ai_assistant_enabled', 'true', 'Enable/disable AI Assistant globally'),
  ('jtbd_enabled', 'true', 'Enable/disable Jobs To Be Done (JTBD) feature'),
  ('sentiment_enabled', 'true', 'Enable/disable Sentiment analysis feature')
ON CONFLICT (key) DO NOTHING;

-- Create RLS policies for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and edit system settings
CREATE POLICY "Admins can view system settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update system settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to update settings
CREATE OR REPLACE FUNCTION update_system_setting(
  setting_key TEXT,
  setting_value TEXT
)
RETURNS system_settings AS $$
DECLARE
  result system_settings;
BEGIN
  UPDATE system_settings
  SET 
    value = setting_value,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE key = setting_key
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_system_setting TO authenticated;
