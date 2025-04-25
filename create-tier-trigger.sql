-- Create a function to update user tier based on points
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the tier based on points
  IF NEW.total_points >= 1373 THEN
    NEW.current_tier := 3;
  ELSIF NEW.total_points >= 916 THEN
    NEW.current_tier := 2;
  ELSIF NEW.total_points >= 640 THEN
    NEW.current_tier := 1;
  ELSE
    NEW.current_tier := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update tier when points change
DROP TRIGGER IF EXISTS update_tier_trigger ON users;
CREATE TRIGGER update_tier_trigger
BEFORE INSERT OR UPDATE OF total_points ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_tier();

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
