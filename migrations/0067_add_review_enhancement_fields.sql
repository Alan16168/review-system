-- Migration 0067: Add review enhancement fields
-- This migration adds three new features to the review system:
-- 1. Allow multiple answers toggle (allow_multiple_answers)
-- 2. Lock status for reviews (is_locked) - only creator can lock/unlock
-- 3. Comment field for answers - only visible to review creator and answer creator

-- ============================================
-- PART 1: Add fields to reviews table
-- ============================================

-- Add allow_multiple_answers field
-- Default to 'yes' to maintain backward compatibility with existing reviews
ALTER TABLE reviews ADD COLUMN allow_multiple_answers TEXT DEFAULT 'yes' CHECK(allow_multiple_answers IN ('yes', 'no'));

-- Add is_locked field
-- Default to 'no' (unlocked) for new reviews
ALTER TABLE reviews ADD COLUMN is_locked TEXT DEFAULT 'no' CHECK(is_locked IN ('yes', 'no'));

-- Add created_by field to track the original creator (different from user_id which might be team owner)
-- For existing reviews, set created_by to user_id
ALTER TABLE reviews ADD COLUMN created_by INTEGER REFERENCES users(id);

-- Update existing reviews to set created_by = user_id
UPDATE reviews SET created_by = user_id WHERE created_by IS NULL;

-- ============================================
-- PART 2: Add comment field to review_answers
-- ============================================

-- Add comment field to review_answers table
-- This field stores comments that only the review creator and answer creator can see
ALTER TABLE review_answers ADD COLUMN comment TEXT DEFAULT NULL;

-- Add comment_updated_at field to track when comment was last modified
ALTER TABLE review_answers ADD COLUMN comment_updated_at DATETIME DEFAULT NULL;

-- ============================================
-- NOTES
-- ============================================
-- After this migration:
-- 1. allow_multiple_answers controls visibility of "答案组管理" functionality
--    - 'yes': Shows answer set management (create new answer set, navigate sets)
--    - 'no': Hides answer set management, only single answer per question
--
-- 2. is_locked controls edit permissions
--    - 'yes': Review is locked, no editing allowed (but can view)
--    - 'no': Review is unlocked, normal editing allowed
--    - Only created_by user can see and toggle the lock status
--
-- 3. created_by tracks the original creator of the review
--    - Used to determine who can lock/unlock the review
--    - Different from user_id which might be team owner
--
-- 4. comment field in review_answers
--    - Visible only to: review creator (created_by) and answer creator (user_id via answer_set)
--    - Used for feedback and discussion on specific answers
--    - comment_updated_at tracks modification time
