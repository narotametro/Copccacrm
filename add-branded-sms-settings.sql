-- Add Branded SMS Settings
-- Enables alphanumeric sender ID and configurable tagline for international SMS

-- Insert default branded sender ID
INSERT INTO system_settings (key, value, category, description)
VALUES 
  ('sms_branded_sender_id', 'COPCCA', 'sms', 'Branded Alphanumeric Sender ID (max 11 chars, works for international SMS)')
ON CONFLICT (key) DO NOTHING;

-- Insert default SMS tagline
INSERT INTO system_settings (key, value, category, description)
VALUES 
  ('sms_tagline', 'Simamia biashara yako na COPCCA', 'sms', 'SMS Tagline appended to all messages')
ON CONFLICT (key) DO NOTHING;

-- Verify settings
SELECT 
  'Branded SMS Settings Added' as status,
  'Users will see SMS from "COPCCA" with tagline' as message;

-- Show all SMS settings
SELECT key, value, category, description
FROM system_settings
WHERE category = 'sms'
ORDER BY key;
