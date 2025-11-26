-- Fix UNIQUE constraint in review_answers table
-- Change from UNIQUE(review_id, question_number) to UNIQUE(answer_set_id, question_number)
-- This allows multiple answer sets per review (V9 multiple answers feature)

-- SQLite doesn't support dropping constraints, so we recreate the table
ALTER TABLE review_answers RENAME TO review_answers_old;

-- Create new table with correct UNIQUE constraint
CREATE TABLE review_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  comment TEXT,
  comment_updated_at DATETIME,
  datetime_value TEXT,
  datetime_title TEXT,
  datetime_answer TEXT,
  answer_set_id INTEGER,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (answer_set_id) REFERENCES review_answer_sets(id) ON DELETE CASCADE,
  -- Changed from UNIQUE(review_id, question_number) to:
  UNIQUE(answer_set_id, question_number)
);

-- Copy all existing data
INSERT INTO review_answers (
  id, review_id, question_number, answer, 
  created_at, updated_at, comment, comment_updated_at,
  datetime_value, datetime_title, datetime_answer, answer_set_id
)
SELECT 
  id, review_id, question_number, answer,
  created_at, updated_at, comment, comment_updated_at,
  datetime_value, datetime_title, datetime_answer, answer_set_id
FROM review_answers_old;

-- Drop old table
DROP TABLE review_answers_old;
