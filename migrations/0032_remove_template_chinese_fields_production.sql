-- Migration: Remove Chinese fields from templates and template_questions (Production Version)
-- This migration removes the original Chinese columns and renames English columns to be primary
-- Production version: Safely handles existing data

-- Step 1: Create temporary backup tables
CREATE TABLE IF NOT EXISTS templates_backup AS SELECT * FROM templates;
CREATE TABLE IF NOT EXISTS template_questions_backup AS SELECT * FROM template_questions;

-- Step 2: Drop old templates table
DROP TABLE IF EXISTS templates;

-- Step 3: Create new templates table with only English columns (renamed as primary)
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Migrate data from backup (using English columns as primary)
INSERT INTO templates (id, name, description, is_default, is_active, created_at, updated_at)
SELECT id, 
  COALESCE(name_en, name) as name, 
  COALESCE(description_en, description) as description, 
  is_default, is_active, created_at, updated_at
FROM templates_backup;

-- Step 5: Drop old template_questions table
DROP TABLE IF EXISTS template_questions;

-- Step 6: Create new template_questions table with only English column (renamed as primary)
CREATE TABLE template_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text', -- 'text', 'single_choice', 'multiple_choice', 'time_with_text'
  options TEXT, -- JSON array for choice questions
  correct_answer TEXT, -- Correct answer(s) for choice questions
  answer_length INTEGER DEFAULT 500, -- Max length for text answers
  datetime_value TEXT, -- Default datetime for time_with_text questions
  datetime_title TEXT, -- Title for datetime field (max 12 chars)
  datetime_answer_max_length INTEGER DEFAULT 200, -- Max length for time_with_text answer
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, question_number),
  CHECK (question_type IN ('text', 'single_choice', 'multiple_choice', 'time_with_text'))
);

-- Step 7: Migrate data from backup (using English column as primary, fallback to Chinese)
INSERT INTO template_questions (
  id, template_id, question_number, question_text, 
  question_type, options, correct_answer, answer_length,
  datetime_value, datetime_title, datetime_answer_max_length, created_at
)
SELECT 
  id, template_id, question_number, 
  COALESCE(question_text_en, question_text) as question_text,
  COALESCE(question_type, 'text') as question_type, 
  options, correct_answer, 
  COALESCE(answer_length, 500) as answer_length,
  datetime_value, datetime_title, datetime_answer_max_length, created_at
FROM template_questions_backup;

-- Step 8: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id ON template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_reviews_template_id ON reviews(template_id);

-- Step 9: Drop backup tables
DROP TABLE IF EXISTS templates_backup;
DROP TABLE IF NOT EXISTS template_questions_backup;
