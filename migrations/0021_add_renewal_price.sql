-- Add renewal_price_usd field to subscription_config table
-- This field stores the renewal price for existing premium users

ALTER TABLE subscription_config ADD COLUMN renewal_price_usd DECIMAL(10, 2) DEFAULT 20.00;

-- Update existing premium config to set renewal price same as upgrade price
UPDATE subscription_config SET renewal_price_usd = price_usd WHERE tier = 'premium';
