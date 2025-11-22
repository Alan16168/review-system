-- Migration: 0059_update_nine_key_questions_pricing.sql
-- Description: Update Nine Key Questions template with tiered pricing
-- Date: 2025-11-22
-- Version: 7.1.1

-- ============================================================================
-- Update Nine Key Questions template pricing
-- ============================================================================

-- Set tiered pricing for Nine Key Questions template
-- Basic users: $10, Premium users: $8, Super users: $5
UPDATE templates 
SET 
  price_basic = 10,
  price_premium = 8,
  price_super = 5,
  price = 10
WHERE name = 'Nine Key Questions';

-- ============================================================================
-- Success message
-- ============================================================================

SELECT '✅ Nine Key Questions template pricing updated' as message;
SELECT 'Basic: $10, Premium: $8, Super: $5' as pricing;
