-- Add tiered pricing fields to ai_writing_templates
-- Migration: 0050_add_writing_template_tiered_pricing
-- Date: 2025-11-21

-- Add three price tiers for different subscription levels
ALTER TABLE ai_writing_templates ADD COLUMN price_user REAL DEFAULT 0;      -- 普通会员价格
ALTER TABLE ai_writing_templates ADD COLUMN price_premium REAL DEFAULT 0;   -- 高级会员价格  
ALTER TABLE ai_writing_templates ADD COLUMN price_super REAL DEFAULT 0;     -- 超级会员价格

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_writing_templates_pricing ON ai_writing_templates(price_user, price_premium, price_super);
