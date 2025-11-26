-- Fix missing tables and columns for local development

-- Add owner_type column to reviews table (for personal vs team reviews)
ALTER TABLE reviews ADD COLUMN owner_type TEXT DEFAULT 'personal' CHECK(owner_type IN ('personal', 'team'));

-- Create search_keywords table (for articles/resources search)
CREATE TABLE IF NOT EXISTS search_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  category TEXT,
  search_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on search_keywords
CREATE INDEX IF NOT EXISTS idx_search_keywords_keyword ON search_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_search_keywords_category ON search_keywords(category);
