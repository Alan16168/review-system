-- Add review_type column to reviews table
-- This column is used to distinguish different types of reviews:
-- - NULL or 'standard': Regular reviews (default)
-- - 'famous-book': Famous book reviews (premium feature)
-- - 'document': Document reviews (premium feature)

ALTER TABLE reviews ADD COLUMN review_type TEXT DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_review_type ON reviews(review_type);
