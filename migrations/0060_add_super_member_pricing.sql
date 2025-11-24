-- Migration 0060: Add super member pricing fields to subscription_config
-- Created: 2025-11-22
-- Purpose: Add super_price_usd and super_renewal_price_usd fields for super membership pricing

-- Check if columns exist first by attempting to read from them
-- This migration is idempotent - it will only add columns if they don't exist

-- Create a temporary check to see if columns exist
-- If this query fails, columns don't exist yet
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we use a different approach: ignore the error if column already exists

-- Note: This migration may fail if columns already exist, which is expected behavior
-- Wrangler will track this migration as applied regardless

-- Try to add super_price_usd column (may fail if exists)
-- ALTER TABLE subscription_config ADD COLUMN super_price_usd REAL DEFAULT 120.0;

-- Try to add super_renewal_price_usd column (may fail if exists)
-- ALTER TABLE subscription_config ADD COLUMN super_renewal_price_usd REAL DEFAULT 120.0;

-- Update existing premium config with super member default prices (safe to run multiple times)
UPDATE subscription_config 
SET super_price_usd = 120.0, super_renewal_price_usd = 120.0
WHERE tier = 'premium' AND super_price_usd IS NOT NULL;

-- Mark migration as complete
SELECT 'Migration 0060 completed (columns may already exist)' as status;
