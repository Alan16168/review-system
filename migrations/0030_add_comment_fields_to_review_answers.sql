-- Add comment fields to review_answers table
-- Migration: 0030_add_comment_fields_to_review_answers
-- Date: 2025-11-27

-- Add comment field for review creator's comments on answers
ALTER TABLE review_answers ADD COLUMN comment TEXT;

-- Add timestamp for when comment was last updated
ALTER TABLE review_answers ADD COLUMN comment_updated_at DATETIME;

-- Create index for faster comment lookups
CREATE INDEX IF NOT EXISTS idx_review_answers_comment ON review_answers(answer_set_id, comment);
