-- Add created_by column to templates table
-- This tracks which user created each template
-- Premium users can only edit their own templates, admins can edit all

ALTER TABLE templates ADD COLUMN created_by INTEGER;

-- Add foreign key constraint
-- Note: SQLite doesn't support adding FK constraints to existing tables
-- So we just add the column and rely on application logic

-- For existing templates without creator, set to NULL (admin will own them)
-- Admins can edit these null-creator templates
