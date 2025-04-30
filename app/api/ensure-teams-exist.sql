-- Check if we have any teams
DO $$
DECLARE
   team_count INTEGER;
BEGIN
   SELECT COUNT(*) INTO team_count FROM teams;
   
   -- If no teams exist, create some sample teams
   IF team_count = 0 THEN
       -- Create sample teams
       INSERT INTO teams (name, total_points) VALUES
           ('Wellness Warriors', 250),
           ('Fitness Fanatics', 320),
           ('Health Heroes', 180),
           ('Mindful Movers', 210),
           ('Vitality Crew', 290);
           
       RAISE NOTICE 'Created 5 sample teams';
   ELSE
       RAISE NOTICE 'Teams already exist, count: %', team_count;
   END IF;
END $$;

-- Show existing teams
SELECT id, name, total_points, creator_id, created_at FROM teams ORDER BY total_points DESC;
