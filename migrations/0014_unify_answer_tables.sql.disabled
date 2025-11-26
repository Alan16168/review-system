-- Migration: Unify answer tables to support multi-user answers for all reviews
-- Purpose: Allow each team member to have their own answers for each question
-- Changes:
--   1. Add user_id to review_answers table
--   2. Migrate data from team_review_answers to review_answers
--   3. Drop team_review_answers table (deprecated)
--   4. Update indexes and constraints

-- Step 1: Add user_id column to review_answers table
-- For existing personal reviews, user_id will be set to the review creator's user_id
ALTER TABLE review_answers ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Step 2: Update existing review_answers to set user_id from reviews.user_id
-- This ensures all existing personal review answers are attributed to their creators
UPDATE review_answers 
SET user_id = (
  SELECT user_id FROM reviews WHERE reviews.id = review_answers.review_id
)
WHERE user_id IS NULL;

-- Step 3: Migrate data from team_review_answers to review_answers
-- Insert all team review answers into the unified review_answers table
INSERT INTO review_answers (review_id, user_id, question_number, answer, created_at, updated_at)
SELECT review_id, user_id, question_number, answer, created_at, updated_at
FROM team_review_answers
WHERE NOT EXISTS (
  -- Avoid duplicates if data already exists
  SELECT 1 FROM review_answers ra
  WHERE ra.review_id = team_review_answers.review_id
    AND ra.user_id = team_review_answers.user_id
    AND ra.question_number = team_review_answers.question_number
);

-- Step 4: Drop the old team_review_answers table (no longer needed)
DROP TABLE IF EXISTS team_review_answers;

-- Step 5: Update unique constraint to include user_id
-- SQLite doesn't support modifying constraints directly, so we need to:
-- 5a. Drop existing indexes first
DROP INDEX IF EXISTS idx_review_answers_review_id;

-- 5b. Create new unique constraint for (review_id, user_id, question_number)
-- This ensures each user can only have one answer per question per review
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_answers_unique 
ON review_answers(review_id, user_id, question_number);

-- Step 6: Create new indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_review_answers_review_id ON review_answers(review_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_user_id ON review_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_question ON review_answers(review_id, question_number);

-- Step 7: Make user_id NOT NULL for future inserts (existing data already set)
-- Note: SQLite doesn't support ALTER COLUMN, so this is enforced via application logic
-- Backend should always provide user_id when creating new answers
