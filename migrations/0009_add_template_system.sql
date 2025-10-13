-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create template_questions table
CREATE TABLE IF NOT EXISTS template_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, question_number)
);

-- Add template_id to reviews table
ALTER TABLE reviews ADD COLUMN template_id INTEGER REFERENCES templates(id);

-- Create review_answers table for dynamic question answers
CREATE TABLE IF NOT EXISTS review_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  UNIQUE(review_id, question_number)
);

-- Insert default template "灵魂9问" (actually 10 questions)
INSERT INTO templates (name, description, is_default, is_active) 
VALUES ('灵魂9问', '这是系统的默认模版，可以适用于任何的复盘工作中', 1, 1);

-- Insert template questions for "灵魂9问"
INSERT INTO template_questions (template_id, question_number, question_text) VALUES
(1, 1, '我的目标是什么？'),
(1, 2, '目标达成了吗？'),
(1, 3, '哪些地方做得不错？'),
(1, 4, '做的好的能否复制？'),
(1, 5, '哪些地方出了问题？'),
(1, 6, '出问题的原因是什么？'),
(1, 7, '下次怎么避免与优化？'),
(1, 8, '我学到了什么底层规律？'),
(1, 9, '如果重新来一次，我们应该如何做？'),
(1, 10, '其他需要复盘的事项？');

-- Migrate existing review data to new structure
-- Set all existing reviews to use default template (id=1)
UPDATE reviews SET template_id = 1 WHERE template_id IS NULL;

-- Migrate existing answers from question1-question9 to review_answers table
-- Split into separate INSERT statements to avoid UNION ALL limit
INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 1, question1 FROM reviews WHERE question1 IS NOT NULL AND question1 != '';

INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 2, question2 FROM reviews WHERE question2 IS NOT NULL AND question2 != '';

INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 3, question3 FROM reviews WHERE question3 IS NOT NULL AND question3 != '';

INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 4, question4 FROM reviews WHERE question4 IS NOT NULL AND question4 != '';

INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 5, question5 FROM reviews WHERE question5 IS NOT NULL AND question5 != '';

INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 6, question6 FROM reviews WHERE question6 IS NOT NULL AND question6 != '';

INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 7, question7 FROM reviews WHERE question7 IS NOT NULL AND question7 != '';

INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 8, question8 FROM reviews WHERE question8 IS NOT NULL AND question8 != '';

INSERT INTO review_answers (review_id, question_number, answer)
SELECT id, 9, question9 FROM reviews WHERE question9 IS NOT NULL AND question9 != '';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id ON template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_review_id ON review_answers(review_id);
CREATE INDEX IF NOT EXISTS idx_reviews_template_id ON reviews(template_id);
