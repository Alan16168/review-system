-- Migration: Drop redundant English suffix columns from templates and template_questions
-- At this point, all data is already in English in both name and name_en columns
-- We just need to drop the _en suffix columns

-- Disable foreign key constraints temporarily
PRAGMA foreign_keys = OFF;

-- For templates table: Drop name_en and description_en columns
-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Step 1: Create new templates table without _en columns
CREATE TABLE templates_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data (name and description are already English)
INSERT INTO templates_new (id, name, description, is_default, is_active, created_at, updated_at)
SELECT id, name, description, is_default, is_active, created_at, updated_at
FROM templates;

-- Step 3: Drop old templates table
DROP TABLE templates;

-- Step 4: Rename new table to templates
ALTER TABLE templates_new RENAME TO templates;

-- For template_questions table: Drop question_text_en column
-- Step 5: Create new template_questions table without _en column
CREATE TABLE template_questions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text',
  options TEXT,
  correct_answer TEXT,
  answer_length INTEGER DEFAULT 500,
  datetime_value TEXT,
  datetime_title TEXT,
  datetime_answer_max_length INTEGER DEFAULT 200,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, question_number),
  CHECK (question_type IN ('text', 'single_choice', 'multiple_choice', 'time_with_text'))
);

-- Step 6: Copy data (question_text is already English)
INSERT INTO template_questions_new (
  id, template_id, question_number, question_text,
  question_type, options, correct_answer, answer_length,
  datetime_value, datetime_title, datetime_answer_max_length, created_at
)
SELECT 
  id, template_id, question_number, question_text,
  question_type, options, correct_answer, answer_length,
  datetime_value, datetime_title, datetime_answer_max_length, created_at
FROM template_questions;

-- Step 7: Drop old template_questions table
DROP TABLE template_questions;

-- Step 8: Rename new table to template_questions
ALTER TABLE template_questions_new RENAME TO template_questions;

-- Step 9: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id ON template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_reviews_template_id ON reviews(template_id);

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;
