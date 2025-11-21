-- Migration: 0052_add_product_type_to_writing_templates.sql
-- Description: Add product_type field to ai_writing_templates table for categorization
-- Date: 2025-11-21
-- Version: 7.0.8

-- ============================================================================
-- Add product_type column to ai_writing_templates table
-- ============================================================================

ALTER TABLE ai_writing_templates ADD COLUMN product_type TEXT NOT NULL DEFAULT 'writing_template' 
  CHECK(product_type IN ('ai_agent', 'review_template', 'writing_template', 'other'));

-- Create index for product_type
CREATE INDEX IF NOT EXISTS idx_writing_templates_product_type ON ai_writing_templates(product_type);

-- ============================================================================
-- Success message
-- ============================================================================

SELECT '✅ Added product_type column to ai_writing_templates table' as message;
