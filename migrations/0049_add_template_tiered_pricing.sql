-- Add tiered pricing fields to templates
-- Migration: 0049_add_template_tiered_pricing
-- Date: 2025-11-21

-- Add three price tiers for different subscription levels
ALTER TABLE templates ADD COLUMN price_basic REAL DEFAULT 0;      -- 普通会员价格
ALTER TABLE templates ADD COLUMN price_premium REAL DEFAULT 0;    -- 高级会员价格  
ALTER TABLE templates ADD COLUMN price_super REAL DEFAULT 0;      -- 超级会员价格

-- Migrate existing price to basic tier, with discounts for higher tiers
UPDATE templates SET 
  price_basic = COALESCE(price, 0),
  price_premium = COALESCE(price, 0) * 0.8,  -- 20% discount for premium
  price_super = COALESCE(price, 0) * 0.6     -- 40% discount for super
WHERE id IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_pricing ON templates(price_basic, price_premium, price_super);
