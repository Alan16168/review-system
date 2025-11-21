-- Fix shopping cart table schema
-- Drop old shopping_cart table (for subscription items) and recreate with marketplace structure

DROP TABLE IF EXISTS shopping_cart;

-- Create shopping cart table for marketplace products
CREATE TABLE shopping_cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,  -- Can be INTEGER or TEXT (for template IDs like 'wt_123')
  quantity INTEGER DEFAULT 1,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_shopping_cart_user ON shopping_cart(user_id);
CREATE INDEX idx_shopping_cart_product ON shopping_cart(product_id);
CREATE UNIQUE INDEX idx_shopping_cart_unique ON shopping_cart(user_id, product_id);
