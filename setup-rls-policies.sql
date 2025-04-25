-- First, enable RLS on the users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Auth service can create users" ON users;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
USING (auth.uid() = id);

-- Create policy to allow the service role to manage all users
CREATE POLICY "Service role can manage all users"
ON users
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policy to allow the auth service to create users
CREATE POLICY "Auth service can create users"
ON users
FOR INSERT
WITH CHECK (true);  -- This allows any authenticated user to create a profile

-- Create policy to allow users to view other users (for leaderboards, etc.)
CREATE POLICY "Users can view other users"
ON users
FOR SELECT
USING (true);  -- This allows any authenticated user to view other users
