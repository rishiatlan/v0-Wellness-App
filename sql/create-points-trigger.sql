-- Create a trigger to ensure points are always set to 5 for activities
CREATE OR REPLACE FUNCTION ensure_activity_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set points to 5 for consistency
  NEW.points = 5;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the activities table
DROP TRIGGER IF EXISTS ensure_activity_points_trigger ON activities;
CREATE TRIGGER ensure_activity_points_trigger
BEFORE INSERT OR UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION ensure_activity_points();

-- Create a trigger to ensure daily_logs points match their activity points
CREATE OR REPLACE FUNCTION ensure_daily_log_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the points from the activity
  SELECT points INTO NEW.points FROM activities WHERE id = NEW.activity_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the daily_logs table
DROP TRIGGER IF EXISTS ensure_daily_log_points_trigger ON daily_logs;
CREATE TRIGGER ensure_daily_log_points_trigger
BEFORE INSERT OR UPDATE ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION ensure_daily_log_points();

-- Create a function to update user total points
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's total points
  UPDATE users
  SET total_points = (
    SELECT COALESCE(SUM(points), 0)
    FROM daily_logs
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the daily_logs table for inserts and updates
DROP TRIGGER IF EXISTS update_user_points_on_insert_trigger ON daily_logs;
CREATE TRIGGER update_user_points_on_insert_trigger
AFTER INSERT ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_total_points();

-- Apply the trigger to the daily_logs table for deletes
DROP TRIGGER IF EXISTS update_user_points_on_delete_trigger ON daily_logs;
CREATE TRIGGER update_user_points_on_delete_trigger
AFTER DELETE ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_total_points();
