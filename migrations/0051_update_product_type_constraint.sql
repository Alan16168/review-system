-- Update product_type constraint in marketplace_products
-- Migration: 0051_update_product_type_constraint
-- Date: 2025-11-21

-- SQLite doesn't support modifying CHECK constraints directly
-- We need to recreate the table with the new constraint

-- 1. Create a new table with the updated constraint
CREATE TABLE marketplace_products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_type TEXT NOT NULL CHECK(product_type IN ('ai_service', 'writing_template', 'review_template', 'other')),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  price_usd REAL NOT NULL DEFAULT 0.0,
  is_free BOOLEAN DEFAULT 0,
  is_subscription BOOLEAN DEFAULT 0,
  subscription_tier TEXT,
  credits_cost INTEGER DEFAULT 0,
  features_json TEXT,
  category TEXT,
  tags TEXT,
  image_url TEXT,
  demo_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_featured BOOLEAN DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  rating_avg REAL DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  price_user REAL DEFAULT 0,
  price_premium REAL DEFAULT 0,
  price_super REAL DEFAULT 0
);

-- 2. Copy data from old table, converting old types to new types
INSERT INTO marketplace_products_new 
SELECT 
  id,
  CASE 
    WHEN product_type = 'template' THEN 'review_template'
    WHEN product_type = 'book_template' THEN 'other'
    ELSE product_type
  END as product_type,
  name, name_en, description, description_en,
  price_usd, is_free, is_subscription, subscription_tier, credits_cost,
  features_json, category, tags, image_url, demo_url,
  is_active, is_featured, sort_order,
  purchase_count, rating_avg, rating_count,
  created_at, updated_at,
  price_user, price_premium, price_super
FROM marketplace_products;

-- 3. Drop old table
DROP TABLE marketplace_products;

-- 4. Rename new table to original name
ALTER TABLE marketplace_products_new RENAME TO marketplace_products;

-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_products_type ON marketplace_products(product_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_featured ON marketplace_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_pricing ON marketplace_products(price_user, price_premium, price_super);
