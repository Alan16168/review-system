-- Migration: Set default referrer for referred_by field
-- Set dengalan@gmail.com (user_id=4) as default referrer for new users

-- Note: SQLite doesn't support ALTER COLUMN DEFAULT directly for existing columns
-- So we'll use a trigger instead to set default value for new users

-- Create trigger to set default referred_by for new users
CREATE TRIGGER IF NOT EXISTS set_default_referrer
AFTER INSERT ON users
FOR EACH ROW
WHEN NEW.referred_by IS NULL
BEGIN
  UPDATE users 
  SET referred_by = (SELECT id FROM users WHERE email = 'dengalan@gmail.com' LIMIT 1)
  WHERE id = NEW.id;
END;
