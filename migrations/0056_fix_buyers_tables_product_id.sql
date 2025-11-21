-- Migration: Fix buyers tables to support TEXT product_ids
-- This allows tracking buyers for products with prefixed IDs or non-integer IDs

-- ============================================================================
-- Fix product_buyers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_buyers_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT
  user_email TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  purchase_price REAL
  -- Removed FK constraint on product_id to allow flexible references
);

-- Copy existing data
INSERT INTO product_buyers_new (id, product_id, user_email, purchased_at, purchase_price)
SELECT id, CAST(product_id AS TEXT), user_email, purchased_at, purchase_price
FROM product_buyers;

-- Drop old table and rename
DROP TABLE product_buyers;
ALTER TABLE product_buyers_new RENAME TO product_buyers;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_buyers_product_id ON product_buyers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_buyers_email ON product_buyers(user_email);

-- ============================================================================
-- Fix template_buyers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_buyers_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT for consistency
  user_email TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  purchase_price REAL
  -- Removed FK constraint on template_id to allow flexible references
);

-- Copy existing data
INSERT INTO template_buyers_new (id, template_id, user_email, purchased_at, purchase_price)
SELECT id, CAST(template_id AS TEXT), user_email, purchased_at, purchase_price
FROM template_buyers;

-- Drop old table and rename
DROP TABLE template_buyers;
ALTER TABLE template_buyers_new RENAME TO template_buyers;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_template_buyers_template_id ON template_buyers(template_id);
CREATE INDEX IF NOT EXISTS idx_template_buyers_email ON template_buyers(user_email);

-- ============================================================================
-- Fix writing_template_buyers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS writing_template_buyers_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT for consistency
  user_email TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  purchase_price REAL
  -- Removed FK constraint on template_id to allow flexible references
);

-- Copy existing data
INSERT INTO writing_template_buyers_new (id, template_id, user_email, purchased_at, purchase_price)
SELECT id, CAST(template_id AS TEXT), user_email, purchased_at, purchase_price
FROM writing_template_buyers;

-- Drop old table and rename
DROP TABLE writing_template_buyers;
ALTER TABLE writing_template_buyers_new RENAME TO writing_template_buyers;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_writing_template_buyers_template_id ON writing_template_buyers(template_id);
CREATE INDEX IF NOT EXISTS idx_writing_template_buyers_email ON writing_template_buyers(user_email);
