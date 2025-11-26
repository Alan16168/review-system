-- Migration 0068: Add answer set level lock functionality
-- This migration moves lock functionality from review level to answer set level
-- Each answer set can be independently locked/unlocked

-- ============================================
-- PART 1: Add is_locked field to answer sets
-- ============================================

-- Add is_locked field to review_answer_sets table
-- Default to 'no' (unlocked) for all answer sets
ALTER TABLE review_answer_sets ADD COLUMN is_locked TEXT DEFAULT 'no' CHECK(is_locked IN ('yes', 'no'));

-- Add locked_at timestamp to track when the set was locked
ALTER TABLE review_answer_sets ADD COLUMN locked_at DATETIME DEFAULT NULL;

-- Add locked_by to track who locked the set (should be same as user_id for answer sets)
ALTER TABLE review_answer_sets ADD COLUMN locked_by INTEGER REFERENCES users(id);

-- ============================================
-- PART 2: Keep review-level lock for backward compatibility
-- ============================================
-- Note: Keep reviews.is_locked field but it will be deprecated
-- New functionality uses review_answer_sets.is_locked
-- Reviews.is_locked can be used for bulk locking in the future

-- ============================================
-- NOTES
-- ============================================
-- After this migration:
-- 1. Each answer set (review_answer_sets) has its own is_locked status
-- 2. When is_locked = 'yes' for an answer set:
--    - That specific answer set cannot be edited
--    - Other answer sets in the same review can still be edited
--    - Only the creator (user_id) can lock/unlock their own answer sets
-- 3. Locking/unlocking happens at edit page, next to "Create New Answer Set" button
-- 4. When an answer set is locked:
--    - Edit buttons for answers in that set are disabled
--    - Click on answers in that set shows "locked" message
--    - Cannot delete the locked answer set
-- 5. locked_at tracks when the set was locked
-- 6. locked_by tracks who locked it (should match user_id for answer sets)
