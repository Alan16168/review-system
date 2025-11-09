-- Create shopping cart table
-- Users can add subscription services to their cart before checkout

CREATE TABLE IF NOT EXISTS shopping_cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_type TEXT NOT NULL, -- 'upgrade' or 'renewal'
  subscription_tier TEXT NOT NULL, -- 'premium'
  price_usd DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT,
  description_en TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_created_at ON shopping_cart(created_at);

-- Note: Each user can only have one item of each type in cart at a time
-- This is enforced in application logic
