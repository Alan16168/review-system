-- Migration: Remove group_type field and add 'free' time_type option
-- V5.25.0 - 2025-11-11

-- Step 1: Drop the group_type index
DROP INDEX IF EXISTS idx_reviews_group_type;

-- Step 2: In SQLite, we cannot directly drop a column
-- We need to create a new table without group_type, copy data, and replace the old table

-- Create new reviews table without group_type
CREATE TABLE reviews_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  team_id INTEGER,
  question1 TEXT,
  question2 TEXT,
  question3 TEXT,
  question4 TEXT,
  question5 TEXT,
  question6 TEXT,
  question7 TEXT,
  question8 TEXT,
  question9 TEXT,
  description TEXT,
  template_id INTEGER,
  owner_type TEXT DEFAULT 'private',
  time_type TEXT DEFAULT 'daily',
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Copy data from old table to new table (excluding group_type)
INSERT INTO reviews_new (
  id, title, user_id, team_id, question1, question2, question3, question4, question5, 
  question6, question7, question8, question9, description, template_id, 
  owner_type, time_type, status, created_at, updated_at
)
SELECT 
  id, title, user_id, team_id, question1, question2, question3, question4, question5,
  question6, question7, question8, question9, description, template_id,
  owner_type, time_type, status, created_at, updated_at
FROM reviews;

-- Drop old table
DROP TABLE reviews;

-- Rename new table to reviews
ALTER TABLE reviews_new RENAME TO reviews;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_team_id ON reviews(team_id);
CREATE INDEX IF NOT EXISTS idx_reviews_owner_type ON reviews(owner_type);
CREATE INDEX IF NOT EXISTS idx_reviews_time_type ON reviews(time_type);
CREATE INDEX IF NOT EXISTS idx_reviews_template_id ON reviews(template_id);

-- Step 3: Add documentation for 'free' time_type option
-- Valid time_type values are now: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'free'
-- The time_type column already accepts TEXT values, so 'free' is valid
-- '自由复盘' (Free Review) allows users to create reviews without time constraints
