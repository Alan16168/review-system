-- Add question_type to template_questions table
-- Types: 'text' (文字型), 'multiple_choice' (多选型), 'single_choice' (单选型)
ALTER TABLE template_questions ADD COLUMN question_type TEXT DEFAULT 'text' CHECK(question_type IN ('text', 'multiple_choice', 'single_choice'));

-- Add options field to store choice options (JSON format)
-- Example: ["A. 选项1", "B. 选项2", "C. 选项3"]
ALTER TABLE template_questions ADD COLUMN options TEXT DEFAULT NULL;

-- Add correct_answer field to store standard answer(s)
-- For single_choice: "A" or "B" or "C"
-- For multiple_choice: "A,B,C" (comma-separated)
-- For text: NULL (no standard answer)
ALTER TABLE template_questions ADD COLUMN correct_answer TEXT DEFAULT NULL;

-- Add max_length field for text type questions (already exists, just documenting)
-- For choice types, this field is ignored

-- Update existing questions to have 'text' type explicitly
UPDATE template_questions SET question_type = 'text' WHERE question_type IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_template_questions_type ON template_questions(question_type);
