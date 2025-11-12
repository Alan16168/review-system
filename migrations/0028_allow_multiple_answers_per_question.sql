-- Migration 0028: Allow multiple answers per question
-- Remove unique constraint to allow users to add multiple answers to the same question

-- SQLite doesn't support DROP CONSTRAINT, so we need to:
-- 1. Create new table without the unique constraint
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- Create new table structure
CREATE TABLE review_answers_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy all existing data
INSERT INTO review_answers_new (id, review_id, user_id, question_number, answer, created_at, updated_at)
SELECT id, review_id, user_id, question_number, answer, created_at, updated_at
FROM review_answers;

-- Drop old table
DROP TABLE review_answers;

-- Rename new table
ALTER TABLE review_answers_new RENAME TO review_answers;

-- Create indexes for performance (but NO unique constraint)
CREATE INDEX idx_review_answers_review_id ON review_answers(review_id);
CREATE INDEX idx_review_answers_user_id ON review_answers(user_id);
CREATE INDEX idx_review_answers_question ON review_answers(review_id, question_number);
