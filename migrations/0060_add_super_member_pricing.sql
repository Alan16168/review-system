-- Migration 0060: Add super member pricing fields to subscription_config
-- Created: 2025-11-22
-- Purpose: Add super_price_usd and super_renewal_price_usd fields for super membership pricing

-- Add super_price_usd column
ALTER TABLE subscription_config ADD COLUMN super_price_usd REAL DEFAULT 120.0;

-- Add super_renewal_price_usd column  
ALTER TABLE subscription_config ADD COLUMN super_renewal_price_usd REAL DEFAULT 120.0;

-- Update existing premium config with super member default prices
UPDATE subscription_config 
SET super_price_usd = 120.0, super_renewal_price_usd = 120.0
WHERE tier = 'premium';
