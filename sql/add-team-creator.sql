-- Add creator_id column to teams table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE teams ADD COLUMN creator_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update existing teams to set the first member as creator
UPDATE teams
SET creator_id = (
  SELECT id FROM users
  WHERE team_id = teams.id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE creator_id IS NULL;

-- Add a constraint to ensure creator_id is not null for future teams
ALTER TABLE teams ALTER COLUMN creator_id SET NOT NULL;
