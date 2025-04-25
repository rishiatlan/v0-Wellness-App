-- Enable RLS on daily_logs table if not already enabled
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON daily_logs;
DROP POLICY IF EXISTS "Service role can manage all logs" ON daily_logs;

-- Create policy to allow users to view their own logs
CREATE POLICY "Users can view their own logs"
ON daily_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own logs
CREATE POLICY "Users can insert their own logs"
ON daily_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own logs
CREATE POLICY "Users can delete their own logs"
ON daily_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create policy to allow the service role to manage all logs
CREATE POLICY "Service role can manage all logs"
ON daily_logs
USING (auth.jwt() ->> 'role' = 'service_role');
