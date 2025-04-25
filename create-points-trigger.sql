-- Create a function to update user points when activities are logged
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user points when a new activity is logged
  IF TG_OP = 'INSERT' THEN
    UPDATE users
    SET total_points = total_points + NEW.points
    WHERE id = NEW.user_id;
  -- Update user points when an activity is deleted
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users
    SET total_points = total_points - OLD.points
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update user points when activities are logged or deleted
DROP TRIGGER IF EXISTS update_points_trigger ON daily_logs;
CREATE TRIGGER update_points_trigger
AFTER INSERT OR DELETE ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_points();
