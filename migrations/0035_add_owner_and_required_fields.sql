-- Migration 0035: Add owner and required fields to template_questions
-- This migration adds:
-- 1. owner field: 'public' (default) or 'private'
--    - 'public': visible to anyone with review access
--    - 'private': visible only to answer creator and review creator
-- 2. required field: 'yes' or 'no' (default)
--    - 'yes': answer is mandatory, cannot be empty
--    - 'no': answer is optional, can be empty

-- Add owner field (答案的私有属性)
-- Default: 'public' (公开)
-- Options: 'public' (公开), 'private' (私人)
ALTER TABLE template_questions ADD COLUMN owner TEXT DEFAULT 'public' CHECK(owner IN ('public', 'private'));

-- Add required field (答案的必选属性)
-- Default: 'no' (可选)
-- Options: 'yes' (必须回答), 'no' (可选回答)
ALTER TABLE template_questions ADD COLUMN required TEXT DEFAULT 'no' CHECK(required IN ('yes', 'no'));

-- Update existing questions to have default values explicitly
UPDATE template_questions SET owner = 'public' WHERE owner IS NULL;
UPDATE template_questions SET required = 'no' WHERE required IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_template_questions_owner ON template_questions(owner);
CREATE INDEX IF NOT EXISTS idx_template_questions_required ON template_questions(required);
