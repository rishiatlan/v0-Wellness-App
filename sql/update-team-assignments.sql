-- This script will be used to update team assignments based on the CSV data
-- First, let's create a temporary table to hold the CSV data
CREATE TEMP TABLE temp_team_assignments (
  team_name TEXT,
  full_name TEXT,
  email TEXT
);

-- The CSV data will be inserted here programmatically
-- For now, we'll create the structure for the update

-- Function to assign users to teams based on the temp table
CREATE OR REPLACE FUNCTION assign_users_to_teams()
RETURNS VOID AS $$
DECLARE
  team_record RECORD;
  user_record RECORD;
  team_id UUID;
BEGIN
  -- Process each team in the temp table
  FOR team_record IN SELECT DISTINCT team_name FROM temp_team_assignments LOOP
    -- Check if team exists
    SELECT id INTO team_id FROM teams WHERE name = team_record.team_name;
    
    -- If team doesn't exist, create it
    IF team_id IS NULL THEN
      INSERT INTO teams (name, total_points)
      VALUES (team_record.team_name, 0)
      RETURNING id INTO team_id;
    END IF;
    
    -- Assign users to this team
    FOR user_record IN 
      SELECT email FROM temp_team_assignments 
      WHERE team_name = team_record.team_name
    LOOP
      -- Update user's team_id
      UPDATE users
      SET team_id = team_id
      WHERE email = user_record.email;
      
      -- If user doesn't exist, log it
      IF NOT FOUND THEN
        RAISE NOTICE 'User with email % not found', user_record.email;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Special cases handling
-- Remove Sucharita from team
UPDATE users
SET team_id = NULL
WHERE email = 'sucharita.tuer@atlan.com';

-- Make sure Graysen and Michelle are added
-- This assumes they exist in the users table
-- If they don't exist, they should be created first
