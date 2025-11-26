-- V9.0.0 Enhancement Features Migration
-- Adds support for:
-- 1. Review lock functionality
-- 2. Multiple answers control per review
-- 3. Answer comments system

-- ========================================
-- REVIEWS TABLE - Enhancement Columns
-- ========================================

-- Add created_by column to track review creator (may differ from user_id)
ALTER TABLE reviews ADD COLUMN created_by INTEGER;

-- Add allow_multiple_answers flag (default 'yes' for backward compatibility)
ALTER TABLE reviews ADD COLUMN allow_multiple_answers TEXT DEFAULT 'yes' 
  CHECK(allow_multiple_answers IN ('yes', 'no'));

-- Add is_locked flag (default 'no' for new reviews)
ALTER TABLE reviews ADD COLUMN is_locked TEXT DEFAULT 'no' 
  CHECK(is_locked IN ('yes', 'no'));

-- Update existing reviews to set created_by = user_id
UPDATE reviews SET created_by = user_id WHERE created_by IS NULL;

-- ========================================
-- REVIEW_ANSWERS TABLE - Comment Support
-- ========================================

-- Add comment field for answer comments
ALTER TABLE review_answers ADD COLUMN comment TEXT;

-- Add comment timestamp
ALTER TABLE review_answers ADD COLUMN comment_updated_at DATETIME;

-- Add datetime support columns (for future datetime question types)
ALTER TABLE review_answers ADD COLUMN datetime_value TEXT;
ALTER TABLE review_answers ADD COLUMN datetime_title TEXT;
ALTER TABLE review_answers ADD COLUMN datetime_answer TEXT;

-- Add answer_set_id for multi-answer support
ALTER TABLE review_answers ADD COLUMN answer_set_id INTEGER;

-- ========================================
-- REVIEW_ANSWER_SETS TABLE - Multi-Answer Support
-- ========================================

CREATE TABLE IF NOT EXISTS review_answer_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  set_number INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================================
-- TEMPLATE_QUESTIONS TABLE - Datetime Support
-- ========================================

-- Add datetime question type support
ALTER TABLE template_questions ADD COLUMN datetime_value TEXT;
ALTER TABLE template_questions ADD COLUMN datetime_title TEXT;
ALTER TABLE template_questions ADD COLUMN datetime_answer_max_length INTEGER;

-- ========================================
-- SEARCH_KEYWORDS TABLE - Missing Columns
-- ========================================

-- Add type column for differentiating article/video/other keywords
ALTER TABLE search_keywords ADD COLUMN type TEXT DEFAULT 'article';

-- Add is_active flag for enabling/disabling keywords
ALTER TABLE search_keywords ADD COLUMN is_active INTEGER DEFAULT 1;

-- Insert default search keywords for articles
INSERT OR IGNORE INTO search_keywords (keyword, category, language, type, is_active) VALUES 
('systematic review reflection', 'review', 'en', 'article', 1),
('project retrospective methods', 'review', 'en', 'article', 1),
('site:wenku.baidu.com 复盘', 'review', 'zh', 'article', 1),
('项目复盘方法', 'review', 'zh', 'article', 1);

-- Insert default search keywords for videos
INSERT OR IGNORE INTO search_keywords (keyword, category, language, type, is_active) VALUES 
('what is systematic review reflection', 'review', 'en', 'video', 1),
('project retrospective tutorial', 'review', 'en', 'video', 1),
('什么是系统化的复盘', 'review', 'zh', 'video', 1),
('项目复盘教程', 'review', 'zh', 'video', 1);
