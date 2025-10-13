-- Create team_review_answers table for collaborative team review
-- Each team member can provide their own answer to each of the 9 questions
CREATE TABLE IF NOT EXISTS team_review_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL CHECK (question_number >= 1 AND question_number <= 9),
  answer TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id, question_number)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_team_review_answers_review_id ON team_review_answers(review_id);
CREATE INDEX IF NOT EXISTS idx_team_review_answers_user_id ON team_review_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_team_review_answers_question ON team_review_answers(review_id, question_number);
