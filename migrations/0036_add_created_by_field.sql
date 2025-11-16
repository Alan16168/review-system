-- Migration: Add created_by field back to templates table
-- This field is required for user ownership tracking and premium user template management

-- Add created_by column to templates table
ALTER TABLE templates ADD COLUMN created_by INTEGER;

-- Set all existing templates to be owned by admin (user_id = 1)
-- This is a safe default since existing templates were likely created by admin
UPDATE templates SET created_by = 1 WHERE created_by IS NULL;

-- Note: We cannot add FOREIGN KEY constraint to existing table in SQLite
-- The foreign key constraint should be enforced at application level
