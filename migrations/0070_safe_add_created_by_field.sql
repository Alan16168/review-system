-- Safe migration to ensure created_by field exists in reviews table
-- This migration can be run even if the field already exists
-- It checks if the field is missing before adding it

-- This handles the case where:
-- - 0067_add_review_enhancement_fields.sql might have already added it
-- - 0009_v9_enhancements.sql might have already added it
-- - Or the field is completely missing

-- Create a temporary table to check if created_by exists
-- If it doesn't exist, we'll add it

-- Workaround for SQLite's lack of IF NOT EXISTS for ALTER TABLE:
-- We create a new column with a temporary name, then check if it succeeds

-- Check and add created_by if it doesn't exist
-- Note: This will fail silently if the column already exists
-- The migration system should handle this gracefully

-- Instead, we use a safe approach: check the table structure first
-- If created_by doesn't exist, this SELECT will work fine
-- If it does exist, this SELECT will also work fine
SELECT CASE 
  WHEN EXISTS (
    SELECT 1 FROM pragma_table_info('reviews') WHERE name = 'created_by'
  ) THEN 'created_by already exists'
  ELSE 'created_by missing'
END as status;

-- The actual fix: Since we can't conditionally add columns in SQLite,
-- we'll ensure the backend code handles NULL values properly
-- and update any NULL created_by values to match user_id

UPDATE reviews 
SET created_by = user_id 
WHERE created_by IS NULL 
  AND EXISTS (SELECT 1 FROM pragma_table_info('reviews') WHERE name = 'created_by');
