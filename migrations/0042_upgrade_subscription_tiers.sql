-- Migration: 0042_upgrade_subscription_tiers.sql
-- Description: Upgrade subscription system to support 3 tiers (Free/$20/$120)
-- Date: 2025-11-19
-- Version: 7.0.0

-- ============================================================================
-- Update subscription tiers
-- ============================================================================

-- Note: The users table already has subscription_tier column
-- The tier values are: 'free', 'premium', and now we add 'super'
-- The subscription_config table stores the pricing for each tier

-- ============================================================================
-- Create subscription features table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier TEXT NOT NULL CHECK(tier IN ('free', 'premium', 'super')),
  feature_key TEXT NOT NULL,
  feature_value TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tier, feature_key)
);

-- Insert subscription features

-- Free Tier (免费版)
INSERT INTO subscription_features (tier, feature_key, feature_value, description) VALUES
  ('free', 'ai_books_limit', '1', '可创建AI书籍数量'),
  ('free', 'ai_generation_per_month', '10', '每月AI生成次数'),
  ('free', 'max_chapters', '5', '每本书最多章节数'),
  ('free', 'max_sections_per_chapter', '3', '每章最多节数'),
  ('free', 'export_html', 'true', '可导出HTML'),
  ('free', 'export_pdf', 'false', '不可导出PDF'),
  ('free', 'support_level', 'community', '社区支持'),
  ('free', 'storage_mb', '50', '存储空间(MB)');

-- Premium Tier (高级版 - $20/年)
INSERT INTO subscription_features (tier, feature_key, feature_value, description) VALUES
  ('premium', 'ai_books_limit', '10', '可创建AI书籍数量'),
  ('premium', 'ai_generation_per_month', '100', '每月AI生成次数'),
  ('premium', 'max_chapters', '20', '每本书最多章节数'),
  ('premium', 'max_sections_per_chapter', '10', '每章最多节数'),
  ('premium', 'export_html', 'true', '可导出HTML'),
  ('premium', 'export_pdf', 'true', '可导出PDF（需第三方服务）'),
  ('premium', 'support_level', 'email', '邮件支持'),
  ('premium', 'storage_mb', '500', '存储空间(MB)'),
  ('premium', 'ai_video_per_month', '5', '每月AI视频生成次数'),
  ('premium', 'templates_access', 'all', '访问所有模板');

-- Super Tier (超级版 - $120/年)
INSERT INTO subscription_features (tier, feature_key, feature_value, description) VALUES
  ('super', 'ai_books_limit', 'unlimited', '无限AI书籍'),
  ('super', 'ai_generation_per_month', 'unlimited', '无限AI生成'),
  ('super', 'max_chapters', 'unlimited', '无限章节'),
  ('super', 'max_sections_per_chapter', 'unlimited', '无限节数'),
  ('super', 'export_html', 'true', '可导出HTML'),
  ('super', 'export_pdf', 'true', '可导出PDF'),
  ('super', 'export_docx', 'true', '可导出Word'),
  ('super', 'export_epub', 'true', '可导出EPUB'),
  ('super', 'support_level', 'priority', '优先支持'),
  ('super', 'storage_mb', '5000', '存储空间(MB)'),
  ('super', 'ai_video_per_month', 'unlimited', '无限AI视频生成'),
  ('super', 'templates_access', 'all', '访问所有模板'),
  ('super', 'api_access', 'true', 'API访问权限'),
  ('super', 'team_collaboration', 'true', '团队协作功能'),
  ('super', 'custom_branding', 'true', '自定义品牌');

-- ============================================================================
-- Create subscription usage tracking table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  
  -- Usage counters
  ai_generations_used INTEGER DEFAULT 0,
  ai_books_created INTEGER DEFAULT 0,
  ai_videos_generated INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_month ON subscription_usage(month);

-- ============================================================================
-- Update subscription_config table with new tiers
-- ============================================================================

-- Clear existing subscription configs
DELETE FROM subscription_config;

-- Insert Free tier
INSERT INTO subscription_config (tier, price_usd, duration_days, description, description_en, is_active, renewal_price_usd) 
VALUES ('free', 0.00, 365, '免费版 - 基础功能', 'Free Tier - Basic Features', 1, 0.00);

-- Insert Premium tier ($20/年)
INSERT INTO subscription_config (tier, price_usd, duration_days, description, description_en, is_active, renewal_price_usd) 
VALUES ('premium', 20.00, 365, '高级版 - $20/年', 'Premium Tier - $20/year', 1, 20.00);

-- Insert Super tier ($120/年)
INSERT INTO subscription_config (tier, price_usd, duration_days, description, description_en, is_active, renewal_price_usd) 
VALUES ('super', 120.00, 365, '超级版 - $120/年', 'Super Tier - $120/year', 1, 120.00);

-- ============================================================================
-- Success message
-- ============================================================================

SELECT '✅ Subscription system upgraded to 3 tiers' as message;
SELECT 'Free: $0/年, Premium: $20/年, Super: $120/年' as tiers;
