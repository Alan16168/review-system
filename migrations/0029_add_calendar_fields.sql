-- Migration: Add calendar integration fields to reviews table
-- Version: 0029
-- Date: 2025-11-12
-- Description: Add scheduled_at, location, and reminder_minutes fields for Google Calendar integration

-- Add scheduled_at field for planned review time
ALTER TABLE reviews ADD COLUMN scheduled_at DATETIME;

-- Add location field for meeting place
ALTER TABLE reviews ADD COLUMN location TEXT;

-- Add reminder_minutes field for notification time (default 60 minutes before)
ALTER TABLE reviews ADD COLUMN reminder_minutes INTEGER DEFAULT 60;

-- Create index for scheduled reviews (to query upcoming reviews)
CREATE INDEX IF NOT EXISTS idx_reviews_scheduled_at ON reviews(scheduled_at);
