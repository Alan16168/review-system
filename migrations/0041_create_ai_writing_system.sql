-- Migration: 0041_create_ai_writing_system.sql
-- Description: Create AI Writing System tables for Manhattan Project Phase 1
-- Date: 2025-11-19
-- Version: 7.0.0

-- ============================================================================
-- AI Books System - Core Tables
-- ============================================================================

-- Books table - Main AI-generated books
CREATE TABLE IF NOT EXISTS ai_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'generating', 'completed', 'published')),
  
  -- Book metadata
  author_name TEXT,
  target_word_count INTEGER DEFAULT 50000,
  current_word_count INTEGER DEFAULT 0,
  
  -- Generation settings
  tone TEXT DEFAULT 'professional', -- professional, casual, academic, creative
  audience TEXT DEFAULT 'general', -- general, expert, beginner, children
  language TEXT DEFAULT 'zh' CHECK(language IN ('zh', 'zh-TW', 'en', 'fr', 'ja', 'es')),
  
  -- Front/Back matter
  preface TEXT, -- 前言
  introduction TEXT, -- 引言
  conclusion TEXT, -- 结论
  afterword TEXT, -- 后记
  
  -- Publishing info
  isbn TEXT,
  publisher TEXT,
  publish_date DATE,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_ai_books_user_id ON ai_books(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_books_status ON ai_books(status);
CREATE INDEX IF NOT EXISTS idx_ai_books_created_at ON ai_books(created_at DESC);

-- ============================================================================
-- Chapters table - First level structure (章)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT, -- 章节描述，用于AI生成指导
  
  -- Generation status
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'generating', 'completed')),
  word_count INTEGER DEFAULT 0,
  
  -- Order
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (book_id) REFERENCES ai_books(id) ON DELETE CASCADE,
  UNIQUE(book_id, chapter_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_chapters_book_id ON ai_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_ai_chapters_sort_order ON ai_chapters(book_id, sort_order);

-- ============================================================================
-- Sections table - Second level structure (节)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL, -- Denormalized for faster queries
  section_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT, -- 节描述，用于AI生成指导
  
  -- Content
  content TEXT, -- 节的具体内容
  
  -- Generation settings
  target_word_count INTEGER DEFAULT 1000,
  current_word_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'generating', 'completed')),
  
  -- Order
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  generated_at DATETIME,
  
  FOREIGN KEY (chapter_id) REFERENCES ai_chapters(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES ai_books(id) ON DELETE CASCADE,
  UNIQUE(chapter_id, section_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_sections_chapter_id ON ai_sections(chapter_id);
CREATE INDEX IF NOT EXISTS idx_ai_sections_book_id ON ai_sections(book_id);
CREATE INDEX IF NOT EXISTS idx_ai_sections_sort_order ON ai_sections(chapter_id, sort_order);

-- ============================================================================
-- AI Generation Log - Track AI generation requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_generation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  book_id INTEGER,
  chapter_id INTEGER,
  section_id INTEGER,
  
  -- Generation details
  generation_type TEXT NOT NULL CHECK(generation_type IN ('book_outline', 'chapters', 'sections', 'content', 'preface', 'conclusion')),
  prompt TEXT NOT NULL,
  response TEXT,
  
  -- Metrics
  tokens_used INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,
  cost_credits INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES ai_books(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES ai_chapters(id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES ai_sections(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_generation_log_user_id ON ai_generation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_log_book_id ON ai_generation_log(book_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_log_created_at ON ai_generation_log(created_at DESC);

-- ============================================================================
-- Book Export History - Track exports (HTML, PDF, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_book_exports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Export details
  export_format TEXT NOT NULL CHECK(export_format IN ('html', 'pdf', 'docx', 'epub')),
  file_url TEXT, -- URL to exported file (if stored in R2)
  file_size INTEGER, -- File size in bytes
  
  -- Export settings
  include_toc BOOLEAN DEFAULT 1, -- Include table of contents
  include_cover BOOLEAN DEFAULT 1, -- Include cover page
  page_numbers BOOLEAN DEFAULT 1,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (book_id) REFERENCES ai_books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_book_exports_book_id ON ai_book_exports(book_id);
CREATE INDEX IF NOT EXISTS idx_ai_book_exports_user_id ON ai_book_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_book_exports_created_at ON ai_book_exports(created_at DESC);

-- ============================================================================
-- Update subscriptions table - Add new subscription tiers
-- ============================================================================

-- Add new tier column if not exists
-- Note: SQLite doesn't support ALTER TABLE IF EXISTS, so we use a workaround

-- First, check if we need to add the tier column
-- The subscriptions table should already have tier from previous migrations
-- We'll just ensure the CHECK constraint includes the new 'super' tier

-- For now, we'll document that the tier values should be:
-- 'free' (免费), 'premium' ($20/年), 'super' ($120/年)

-- ============================================================================
-- Insert sample data for testing
-- ============================================================================

-- This will be in seed.test.sql instead

-- ============================================================================
-- Success message
-- ============================================================================

SELECT '✅ AI Writing System tables created successfully' as message;
SELECT 'Tables: ai_books, ai_chapters, ai_sections, ai_generation_log, ai_book_exports' as info;
