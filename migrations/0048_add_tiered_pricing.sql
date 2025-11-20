-- Add tiered pricing fields to marketplace_products
-- Migration: 0048_add_tiered_pricing
-- Date: 2025-11-20

-- Add three price tiers for different subscription levels
ALTER TABLE marketplace_products ADD COLUMN price_user REAL DEFAULT 0;      -- 普通用户价格
ALTER TABLE marketplace_products ADD COLUMN price_premium REAL DEFAULT 0;   -- 高级会员价格  
ALTER TABLE marketplace_products ADD COLUMN price_super REAL DEFAULT 0;     -- 超级会员价格

-- Migrate existing price_usd to all three tiers (can be adjusted later)
UPDATE marketplace_products SET 
  price_user = price_usd,
  price_premium = price_usd * 0.8,  -- 20% discount for premium
  price_super = price_usd * 0.6     -- 40% discount for super
WHERE price_usd IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_pricing ON marketplace_products(price_user, price_premium, price_super);
