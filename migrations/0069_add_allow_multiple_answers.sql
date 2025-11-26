-- Migration 0069: Add allow_multiple_answers field to reviews table
-- This field controls whether a review allows multiple answer sets

-- Add allow_multiple_answers field to reviews table
-- Default to 'yes' for backward compatibility
ALTER TABLE reviews ADD COLUMN allow_multiple_answers TEXT DEFAULT 'yes' CHECK(allow_multiple_answers IN ('yes', 'no'));

-- Update existing reviews to 'yes' to maintain current behavior
UPDATE reviews SET allow_multiple_answers = 'yes' WHERE allow_multiple_answers IS NULL;
