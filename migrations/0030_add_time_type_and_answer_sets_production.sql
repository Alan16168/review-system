-- Migration 0030 (Production Safe Version): Add time type questions and unified answer sets
-- This is a simplified version without automatic data migration

-- ============================================
-- PART 1: Add time type support to questions
-- ============================================

ALTER TABLE template_questions ADD COLUMN datetime_value DATETIME DEFAULT NULL;
ALTER TABLE template_questions ADD COLUMN datetime_title TEXT DEFAULT NULL;
ALTER TABLE template_questions ADD COLUMN datetime_answer_max_length INTEGER DEFAULT 200;

-- ============================================
-- PART 2: Create answer sets table
-- ============================================

CREATE TABLE IF NOT EXISTS review_answer_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id, set_number)
);

CREATE INDEX idx_answer_sets_review ON review_answer_sets(review_id);
CREATE INDEX idx_answer_sets_user ON review_answer_sets(user_id);
CREATE INDEX idx_answer_sets_number ON review_answer_sets(review_id, set_number);

-- ============================================
-- PART 3: Create new answers table (keep old one as backup)
-- ============================================

CREATE TABLE review_answers_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answer_set_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  answer TEXT,
  datetime_value DATETIME,
  datetime_title TEXT,
  datetime_answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (answer_set_id) REFERENCES review_answer_sets(id) ON DELETE CASCADE
);

CREATE INDEX idx_answers_new_set ON review_answers_new(answer_set_id);
CREATE INDEX idx_answers_new_question ON review_answers_new(answer_set_id, question_number);

-- Backup old answers table (don't drop it yet for safety)
ALTER TABLE review_answers RENAME TO review_answers_legacy;

-- Activate new table
ALTER TABLE review_answers_new RENAME TO review_answers;

-- ============================================
-- PART 4: Add system configuration
-- ============================================

CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO system_config (config_key, config_value, description) VALUES
  ('date_format', 'MM/DD/YYYY', 'Date format: MM/DD/YYYY, DD/MM/YYYY, or YYYY/MM/DD'),
  ('time_format', '24h', 'Time format: 12h or 24h'),
  ('default_datetime', 'now', 'Default datetime for time type questions: now or empty');
