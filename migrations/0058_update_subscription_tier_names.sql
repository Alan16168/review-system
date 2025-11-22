-- Migration: 0058_update_subscription_tier_names.sql
-- Description: Update subscription tier descriptions from "用户" to "会员"
-- Date: 2025-11-22
-- Version: 7.1.0

-- ============================================================================
-- Update subscription_config table descriptions
-- ============================================================================

-- Update Free tier description
UPDATE subscription_config 
SET 
  description = '普通会员 - 基础功能',
  description_en = 'Free Member - Basic Features'
WHERE tier = 'free';

-- Update Premium tier description  
UPDATE subscription_config
SET
  description = '高级会员 - $20/年',
  description_en = 'Premium Member - $20/year'
WHERE tier = 'premium';

-- Update Super tier description
UPDATE subscription_config
SET
  description = '超级会员 - $120/年',
  description_en = 'Super Member - $120/year'
WHERE tier = 'super';

-- ============================================================================
-- Success message
-- ============================================================================

SELECT '✅ Subscription tier descriptions updated successfully' as message;
SELECT 'Free: 普通会员, Premium: 高级会员, Super: 超级会员' as tiers;
