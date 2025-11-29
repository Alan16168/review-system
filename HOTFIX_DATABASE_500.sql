-- HOTFIX: Direct SQL to fix template_questions table structure
-- This bypasses the failed migrations and directly fixes the production database

-- Step 1: Check if owner and required columns exist
-- If they don't exist, the table needs to be recreated

-- Step 2: Create backup table
CREATE TABLE IF NOT EXISTS template_questions_backup AS 
SELECT * FROM template_questions;

-- Step 3: Drop the problematic table
DROP TABLE IF EXISTS template_questions;

-- Step 4: Recreate with correct structure (all columns)
CREATE TABLE template_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  question_text_en TEXT,
  answer_length INTEGER DEFAULT 50,
  question_type TEXT DEFAULT 'text' CHECK(question_type IN (
    'text', 
    'single_choice', 
    'multiple_choice', 
    'time_with_text',
    'multiline_text',
    'number',
    'dropdown',
    'markdown'
  )),
  options TEXT DEFAULT NULL,
  correct_answer TEXT DEFAULT NULL,
  datetime_value DATETIME DEFAULT NULL,
  datetime_title TEXT DEFAULT NULL,
  datetime_answer_max_length INTEGER DEFAULT 200,
  owner TEXT DEFAULT 'public' CHECK(owner IN ('public', 'private')),
  required TEXT DEFAULT 'no' CHECK(required IN ('yes', 'no')),
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, question_number)
);

-- Step 5: Restore data from backup
INSERT INTO template_questions (
  id,
  template_id,
  question_number,
  question_text,
  created_at,
  question_text_en,
  answer_length,
  question_type,
  options,
  correct_answer,
  datetime_value,
  datetime_title,
  datetime_answer_max_length,
  owner,
  required
)
SELECT 
  id,
  template_id,
  question_number,
  question_text,
  created_at,
  question_text_en,
  COALESCE(answer_length, 50) as answer_length,
  COALESCE(question_type, 'text') as question_type,
  options,
  correct_answer,
  datetime_value,
  datetime_title,
  COALESCE(datetime_answer_max_length, 200) as datetime_answer_max_length,
  COALESCE(owner, 'public') as owner,
  COALESCE(required, 'no') as required
FROM template_questions_backup;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_template_questions_type ON template_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_template_questions_owner ON template_questions(owner);
CREATE INDEX IF NOT EXISTS idx_template_questions_required ON template_questions(required);

-- Step 7: Verify the fix
-- Run this manually to check:
-- SELECT COUNT(*) FROM template_questions;
-- PRAGMA table_info(template_questions);

-- Step 8: Drop backup table after verification
-- DROP TABLE template_questions_backup;
