-- Migration: Fix 0071 - Add owner and required fields to extended question types migration
-- This migration fixes the missing owner and required columns in the 0071 migration

-- Step 1: Create new table with ALL fields including owner and required
CREATE TABLE IF NOT EXISTS template_questions_new2 (
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

-- Step 2: Copy all data from current table (use explicit column list)
INSERT INTO template_questions_new2 (
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
  answer_length,
  question_type,
  options,
  correct_answer,
  datetime_value,
  datetime_title,
  datetime_answer_max_length,
  COALESCE(owner, 'public') as owner,
  COALESCE(required, 'no') as required
FROM template_questions;

-- Step 3: Drop old table
DROP TABLE template_questions;

-- Step 4: Rename new table
ALTER TABLE template_questions_new2 RENAME TO template_questions;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_template_questions_type ON template_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_template_questions_owner ON template_questions(owner);
CREATE INDEX IF NOT EXISTS idx_template_questions_required ON template_questions(required);

-- Notes on migration:
-- This fixes the 0071 migration which was missing owner and required columns
-- All existing data is preserved with default values for owner='public' and required='no'
