-- Fix remaining missing columns

-- Add scheduled_at to reviews table (for scheduled/draft reviews)
ALTER TABLE reviews ADD COLUMN scheduled_at DATETIME;

-- Add language to search_keywords table
ALTER TABLE search_keywords ADD COLUMN language TEXT DEFAULT 'zh';

-- Add publish_at for scheduled publishing
ALTER TABLE reviews ADD COLUMN publish_at DATETIME;
