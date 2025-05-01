-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert challenge_started setting if it doesn't exist
INSERT INTO app_settings (key, value)
VALUES ('challenge_started', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert challenge_start_date setting if it doesn't exist
INSERT INTO app_settings (key, value)
VALUES ('challenge_start_date', to_jsonb(TIMESTAMP '2023-05-02 00:00:00 UTC'))
ON CONFLICT (key) DO NOTHING;

-- Create system_logs table for tracking system events if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
