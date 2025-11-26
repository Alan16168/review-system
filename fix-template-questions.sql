-- Fix template_questions table - add missing columns

ALTER TABLE template_questions ADD COLUMN answer_length INTEGER DEFAULT 500;
ALTER TABLE template_questions ADD COLUMN question_type TEXT DEFAULT 'text';
ALTER TABLE template_questions ADD COLUMN options TEXT;
ALTER TABLE template_questions ADD COLUMN correct_answer TEXT;
ALTER TABLE template_questions ADD COLUMN owner TEXT DEFAULT 'system';
ALTER TABLE template_questions ADD COLUMN required INTEGER DEFAULT 1;
ALTER TABLE template_questions ADD COLUMN updated_at DATETIME;
