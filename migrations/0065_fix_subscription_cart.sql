-- Fix shopping cart table for subscription support
-- Current issue: Table only has product_id column, but subscription cart needs subscription_tier

-- Drop the existing shopping_cart table
DROP TABLE IF EXISTS shopping_cart;

-- Recreate with support for both marketplace products and subscriptions
CREATE TABLE shopping_cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Support both marketplace items and subscriptions
  item_type TEXT DEFAULT 'product' CHECK(item_type IN ('product', 'subscription')),
  
  -- For marketplace products (templates, etc.)
  product_id TEXT,
  quantity INTEGER DEFAULT 1,
  
  -- For subscription purchases
  subscription_tier TEXT CHECK(subscription_tier IS NULL OR subscription_tier IN ('premium', 'super')),
  price_usd DECIMAL(10, 2),
  duration_days INTEGER,
  description TEXT,
  description_en TEXT,
  
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ensure at least one of product_id or subscription_tier is set
  CHECK (
    (item_type = 'product' AND product_id IS NOT NULL) OR
    (item_type = 'subscription' AND subscription_tier IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_shopping_cart_user ON shopping_cart(user_id);
CREATE INDEX idx_shopping_cart_product ON shopping_cart(product_id);
CREATE INDEX idx_shopping_cart_subscription ON shopping_cart(subscription_tier);

-- Unique constraints
CREATE UNIQUE INDEX idx_shopping_cart_unique_product ON shopping_cart(user_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX idx_shopping_cart_unique_subscription ON shopping_cart(user_id, subscription_tier) WHERE subscription_tier IS NOT NULL;
