-- Add group_type and time_type columns to reviews table

-- Add group_type column: 'personal', 'project', 'team'
ALTER TABLE reviews ADD COLUMN group_type TEXT DEFAULT 'personal';

-- Add time_type column: 'daily', 'weekly', 'monthly', 'yearly'
ALTER TABLE reviews ADD COLUMN time_type TEXT DEFAULT 'daily';

-- Create indexes for better filtering
CREATE INDEX IF NOT EXISTS idx_reviews_group_type ON reviews(group_type);
CREATE INDEX IF NOT EXISTS idx_reviews_time_type ON reviews(time_type);
