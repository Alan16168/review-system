-- Migration 0030: Add time type questions and unified answer sets
-- This migration implements:
-- 1. Time type questions with datetime, title, and answer fields
-- 2. Unified answer sets - all questions in a review share the same number of answers

-- ============================================
-- PART 1: Add time type support to questions
-- ============================================

-- Add support for 'time_with_text' question type
-- This type includes: datetime (changeable), title (fixed 12 chars), answer (variable length text)
ALTER TABLE template_questions ADD COLUMN datetime_value DATETIME DEFAULT NULL;
ALTER TABLE template_questions ADD COLUMN datetime_title TEXT DEFAULT NULL;
ALTER TABLE template_questions ADD COLUMN datetime_answer_max_length INTEGER DEFAULT 200;

-- Update CHECK constraint to include new type
-- Note: SQLite doesn't support ALTER for CHECK constraints, but the constraint is enforced at runtime
-- Types now: 'text', 'multiple_choice', 'single_choice', 'time_with_text'

-- ============================================
-- PART 2: Create answer sets table
-- ============================================

-- Answer sets represent a collection of answers across all questions
-- All questions in a review will have the same number of answer sets
CREATE TABLE IF NOT EXISTS review_answer_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL, -- Answer set sequence: 1, 2, 3, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id, set_number) -- Each set_number is unique per review/user
);

CREATE INDEX idx_answer_sets_review ON review_answer_sets(review_id);
CREATE INDEX idx_answer_sets_user ON review_answer_sets(user_id);
CREATE INDEX idx_answer_sets_number ON review_answer_sets(review_id, set_number);

-- ============================================
-- PART 3: Migrate existing answers to set-based system
-- ============================================

-- Create new answers table with set_id reference
CREATE TABLE review_answers_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answer_set_id INTEGER NOT NULL, -- Links to review_answer_sets
  question_number INTEGER NOT NULL,
  answer TEXT, -- For text/choice types
  datetime_value DATETIME, -- For time_with_text type
  datetime_title TEXT, -- For time_with_text type (max 12 chars)
  datetime_answer TEXT, -- For time_with_text type (text answer)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (answer_set_id) REFERENCES review_answer_sets(id) ON DELETE CASCADE
);

CREATE INDEX idx_answers_v2_set ON review_answers_v2(answer_set_id);
CREATE INDEX idx_answers_v2_question ON review_answers_v2(answer_set_id, question_number);

-- Migrate existing data: Create answer sets for existing answers
-- Group existing answers by (review_id, user_id, created_at) to form sets
INSERT INTO review_answer_sets (review_id, user_id, set_number, created_at, updated_at)
SELECT DISTINCT 
  review_id,
  user_id,
  ROW_NUMBER() OVER (PARTITION BY review_id, user_id ORDER BY MIN(created_at)) as set_number,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM review_answers
GROUP BY review_id, user_id, DATE(created_at, 'start of day', SUBSTR(created_at, 12, 8));

-- Migrate answer data to new table
INSERT INTO review_answers_v2 (answer_set_id, question_number, answer, created_at, updated_at)
SELECT 
  ras.id as answer_set_id,
  ra.question_number,
  ra.answer,
  ra.created_at,
  ra.updated_at
FROM review_answers ra
JOIN review_answer_sets ras ON 
  ra.review_id = ras.review_id AND 
  ra.user_id = ras.user_id AND
  DATE(ra.created_at, 'start of day', SUBSTR(ra.created_at, 12, 8)) = 
  DATE(ras.created_at, 'start of day', SUBSTR(ras.created_at, 12, 8));

-- Backup old table
ALTER TABLE review_answers RENAME TO review_answers_backup_v1;

-- Rename new table
ALTER TABLE review_answers_v2 RENAME TO review_answers;

-- ============================================
-- PART 4: Add system configuration for time format
-- ============================================

-- Create system_config table if not exists
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add default time format configurations
INSERT OR IGNORE INTO system_config (config_key, config_value, description) VALUES
  ('date_format', 'MM/DD/YYYY', 'Date format: MM/DD/YYYY, DD/MM/YYYY, or YYYY/MM/DD'),
  ('time_format', '24h', 'Time format: 12h or 24h'),
  ('default_datetime', 'now', 'Default datetime for time type questions: now or empty');

-- ============================================
-- NOTES
-- ============================================
-- After this migration:
-- 1. All questions in a review will have the same number of answer sets
-- 2. Each answer set has a set_number (1, 2, 3, ...)
-- 3. Time type questions can store datetime, title (12 chars), and text answer
-- 4. Single "Add Answer" button creates a new set for ALL questions
-- 5. Navigate through sets using arrows, sorted by created_at
