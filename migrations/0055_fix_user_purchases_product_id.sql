-- Migration: Fix user_purchases table to support string product_ids (wt_, t_ prefixes)
-- This allows purchasing templates from different sources, not just marketplace_products

-- Drop the old table and recreate without foreign key constraint on product_id
-- SQLite doesn't support ALTER TABLE to drop foreign keys, so we need to recreate

-- Step 1: Create new table without FK constraint on product_id
CREATE TABLE IF NOT EXISTS user_purchases_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT to support prefixed IDs
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price_paid REAL NOT NULL,
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'completed',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  -- Removed FK constraint on product_id to allow cross-table references
);

-- Step 2: Copy existing data from old table (cast product_id to TEXT)
INSERT INTO user_purchases_new (id, user_id, product_id, product_type, product_name, price_paid, purchase_date, status)
SELECT id, user_id, CAST(product_id AS TEXT), product_type, product_name, price_paid, purchase_date, status
FROM user_purchases;

-- Step 3: Drop old table
DROP TABLE user_purchases;

-- Step 4: Rename new table to original name
ALTER TABLE user_purchases_new RENAME TO user_purchases;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_product_id ON user_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_date ON user_purchases(purchase_date DESC);
