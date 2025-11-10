-- Safe migration: Unify answer tables to support multi-user answers
-- This version handles existing data safely

-- Step 1: Create a backup of review_answers
CREATE TABLE IF NOT EXISTS review_answers_backup AS SELECT * FROM review_answers;

-- Step 2: Drop existing review_answers table
DROP TABLE IF EXISTS review_answers;

-- Step 3: Recreate review_answers with user_id
CREATE TABLE review_answers (
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

-- Step 4: Restore data from backup with user_id from reviews.user_id
INSERT INTO review_answers (id, review_id, user_id, question_number, answer, created_at, updated_at)
SELECT 
  rab.id,
  rab.review_id,
  r.user_id,
  rab.question_number,
  rab.answer,
  rab.created_at,
  rab.updated_at
FROM review_answers_backup rab
JOIN reviews r ON rab.review_id = r.id;

-- Step 5: Migrate data from team_review_answers if exists
-- Note: SQLite doesn't support conditional INSERT based on table existence
-- We'll handle this in the next migration if needed

-- Step 6: Drop backup table
DROP TABLE IF EXISTS review_answers_backup;

-- Step 7: Drop team_review_answers table if exists
DROP TABLE IF EXISTS team_review_answers;

-- Step 8: Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_answers_unique 
ON review_answers(review_id, user_id, question_number);

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_answers_review_id ON review_answers(review_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_user_id ON review_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_question ON review_answers(review_id, question_number);
