-- Add answer_length column to template_questions table
-- This defines the maximum length for answers when creating reviews from templates
-- Default value is 50 characters

ALTER TABLE template_questions ADD COLUMN answer_length INTEGER DEFAULT 50;

-- Update existing records to have default value
UPDATE template_questions SET answer_length = 50 WHERE answer_length IS NULL;
