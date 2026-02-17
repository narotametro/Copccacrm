-- Add Branded SMS Settings
-- Enables alphanumeric sender ID via Messaging Service and configurable tagline for international SMS

-- Insert default Messaging Service SID (empty - user must configure)
INSERT INTO system_settings (key, value, category, description)
VALUES 
  ('twilio_messaging_service_sid', '', 'sms', 'Twilio Messaging Service SID (required for AlphaSender)')
ON CONFLICT (key) DO NOTHING;

-- Insert default branded sender ID
INSERT INTO system_settings (key, value, category, description)
VALUES 
  ('sms_branded_sender_id', 'COPCCA', 'sms', 'Branded Alphanumeric Sender ID (max 11 chars, add to Messaging Service)')
ON CONFLICT (key) DO NOTHING;

-- Insert default SMS tagline
INSERT INTO system_settings (key, value, category, description)
VALUES 
  ('sms_tagline', 'Simamia biashara yako na COPCCA', 'sms', 'SMS Tagline appended to all messages')
ON CONFLICT (key) DO NOTHING;

-- Verify settings
SELECT 
  'Branded SMS Settings Added' as status,
  'Configure Messaging Service in Twilio Console, then add SID to admin panel' as message;

-- Show all SMS settings
SELECT key, value, category, description
FROM system_settings
WHERE category = 'sms'
ORDER BY key;
