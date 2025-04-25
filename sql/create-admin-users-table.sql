-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add initial admins
INSERT INTO admin_users (email, user_id)
VALUES 
  ('rishi.banerjee@atlan.com', (SELECT id FROM auth.users WHERE email = 'rishi.banerjee@atlan.com')),
  ('steven.hloros@atlan.com', (SELECT id FROM auth.users WHERE email = 'steven.hloros@atlan.com')),
  ('sucharita.tuer@atlan.com', (SELECT id FROM auth.users WHERE email = 'sucharita.tuer@atlan.com'))
ON CONFLICT (email) DO NOTHING;

-- Create RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all admin users
CREATE POLICY "Admins can view all admin users"
ON admin_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'
  )
);

-- Allow admins to insert new admin users
CREATE POLICY "Admins can insert admin users"
ON admin_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'
  )
);

-- Allow admins to delete admin users
CREATE POLICY "Admins can delete admin users"
ON admin_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'
  )
);

-- Create function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql;
