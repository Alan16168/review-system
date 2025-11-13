-- Migration: Fix question_type CHECK constraint to include time_with_text
-- This migration recreates the template_questions table with the correct constraint

-- Step 1: Create new table with correct constraint
CREATE TABLE template_questions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  question_text_en TEXT,
  answer_length INTEGER DEFAULT 50,
  question_type TEXT DEFAULT 'text' CHECK(question_type IN ('text', 'single_choice', 'multiple_choice', 'time_with_text')),
  options TEXT DEFAULT NULL,
  correct_answer TEXT DEFAULT NULL,
  datetime_value DATETIME DEFAULT NULL,
  datetime_title TEXT DEFAULT NULL,
  datetime_answer_max_length INTEGER DEFAULT 200,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, question_number)
);

-- Step 2: Copy all data from old table
INSERT INTO template_questions_new 
SELECT * FROM template_questions;

-- Step 3: Drop old table
DROP TABLE template_questions;

-- Step 4: Rename new table
ALTER TABLE template_questions_new RENAME TO template_questions;
