-- Add owner_type column to reviews table for access control
-- Values: 'private' (私有), 'team' (团队), 'public' (公开)

-- Skip if column already exists (for production where it may have been applied already)
-- ALTER TABLE reviews ADD COLUMN owner_type TEXT DEFAULT 'private';

-- Create index for better filtering of public reviews
CREATE INDEX IF NOT EXISTS idx_reviews_owner_type ON reviews(owner_type);

-- Update existing reviews to have proper owner_type based on team_id
-- Reviews with team_id should be 'team', others should be 'private'
-- Only update if owner_type column exists
UPDATE reviews SET owner_type = 'team' WHERE team_id IS NOT NULL AND owner_type IS NOT NULL;
UPDATE reviews SET owner_type = 'private' WHERE team_id IS NULL AND owner_type IS NOT NULL;
