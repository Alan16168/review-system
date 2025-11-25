-- Migration: 0066_update_subscription_prices_to_2_dollars.sql
-- Description: Update all subscription prices to $2
-- Date: 2025-11-25
-- Version: 1.0.3

-- ============================================================================
-- Update subscription_config prices to $2
-- ============================================================================

-- Update Premium tier price to $2
UPDATE subscription_config 
SET price_usd = 2.00, renewal_price_usd = 2.00 
WHERE tier = 'premium';

-- Update Super tier price to $2  
UPDATE subscription_config 
SET price_usd = 2.00, renewal_price_usd = 2.00
WHERE tier = 'super';

-- ============================================================================
-- Verify the changes
-- ============================================================================

SELECT 
  tier, 
  price_usd as '首次购买价格', 
  renewal_price_usd as '续费价格',
  description as '描述'
FROM subscription_config 
WHERE is_active = 1
ORDER BY 
  CASE tier 
    WHEN 'free' THEN 1
    WHEN 'premium' THEN 2  
    WHEN 'super' THEN 3
  END;
