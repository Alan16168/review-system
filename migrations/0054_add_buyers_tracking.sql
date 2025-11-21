-- Migration: 0054_add_buyers_tracking.sql
-- Description: Add buyer tracking system for templates and marketplace products
-- Date: 2025-11-21
-- Version: 7.2.4

-- ============================================================================
-- Step 1: Create buyer tracking tables
-- ============================================================================

-- Template Buyers Table (for review templates)
-- Stores which users have purchased each template
CREATE TABLE IF NOT EXISTS template_buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  purchase_price REAL,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, user_email)
);

-- Writing Template Buyers Table (for AI writing templates)
-- Stores which users have purchased each writing template
CREATE TABLE IF NOT EXISTS writing_template_buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  purchase_price REAL,
  FOREIGN KEY (template_id) REFERENCES ai_writing_templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, user_email)
);

-- Product Buyers Table (for marketplace products: agents and other products)
-- Stores which users have purchased each marketplace product
CREATE TABLE IF NOT EXISTS product_buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  purchase_price REAL,
  FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE,
  UNIQUE(product_id, user_email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_buyers_template ON template_buyers(template_id);
CREATE INDEX IF NOT EXISTS idx_template_buyers_user ON template_buyers(user_email);
CREATE INDEX IF NOT EXISTS idx_writing_template_buyers_template ON writing_template_buyers(template_id);
CREATE INDEX IF NOT EXISTS idx_writing_template_buyers_user ON writing_template_buyers(user_email);
CREATE INDEX IF NOT EXISTS idx_product_buyers_product ON product_buyers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_buyers_user ON product_buyers(user_email);

-- ============================================================================
-- Success message
-- ============================================================================

SELECT '✅ Buyer tracking system created successfully' as message;
SELECT 'Created tables: template_buyers, writing_template_buyers, product_buyers' as info;
