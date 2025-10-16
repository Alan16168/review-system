-- Safe migration: Unify answer tables to support multi-user answers
-- Version 2: Handles duplicate data properly

-- Step 1: Create a backup of review_answers
CREATE TABLE IF NOT EXISTS review_answers_backup AS SELECT * FROM review_answers;

-- Step 2: Create a backup of team_review_answers
CREATE TABLE IF NOT EXISTS team_review_answers_backup AS SELECT * FROM team_review_answers;

-- Step 3: Drop existing review_answers table
DROP TABLE IF EXISTS review_answers;

-- Step 4: Recreate review_answers with user_id and new constraint
CREATE TABLE review_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id, question_number)
);

-- Step 5: Restore data from review_answers_backup with user_id from reviews.user_id
-- Use INSERT OR IGNORE to handle any potential duplicates
INSERT OR IGNORE INTO review_answers (review_id, user_id, question_number, answer, created_at, updated_at)
SELECT 
  rab.review_id,
  r.user_id,
  rab.question_number,
  rab.answer,
  rab.created_at,
  rab.updated_at
FROM review_answers_backup rab
JOIN reviews r ON rab.review_id = r.id;

-- Step 6: Migrate data from team_review_answers_backup
-- Use INSERT OR IGNORE to skip any duplicates
INSERT OR IGNORE INTO review_answers (review_id, user_id, question_number, answer, created_at, updated_at)
SELECT review_id, user_id, question_number, answer, created_at, updated_at
FROM team_review_answers_backup;

-- Step 7: Drop backup tables
DROP TABLE IF EXISTS review_answers_backup;
DROP TABLE IF EXISTS team_review_answers_backup;

-- Step 8: Drop old team_review_answers table
DROP TABLE IF EXISTS team_review_answers;

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_answers_review_id ON review_answers(review_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_user_id ON review_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_question ON review_answers(review_id, question_number);
