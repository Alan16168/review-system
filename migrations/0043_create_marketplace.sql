-- Migration: 0043_create_marketplace.sql
-- Description: Create Marketplace system for templates and AI services
-- Date: 2025-11-19
-- Version: 7.0.0

-- ============================================================================
-- Marketplace Products - Main product catalog
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_type TEXT NOT NULL CHECK(product_type IN ('template', 'ai_service', 'book_template')),
  
  -- Product info
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  
  -- Pricing
  price_usd REAL NOT NULL DEFAULT 0.0,
  is_free BOOLEAN DEFAULT 0,
  
  -- For subscription services
  is_subscription BOOLEAN DEFAULT 0,
  subscription_tier TEXT CHECK(subscription_tier IN ('premium', 'super')),
  
  -- For AI services
  credits_cost INTEGER DEFAULT 0, -- Cost in credits if not subscription
  
  -- Features/Limits
  features_json TEXT, -- JSON string of features
  
  -- Catalog info
  category TEXT,
  tags TEXT, -- Comma-separated tags
  image_url TEXT,
  demo_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  is_featured BOOLEAN DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  
  -- Stats
  purchase_count INTEGER DEFAULT 0,
  rating_avg REAL DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_products_type ON marketplace_products(product_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_featured ON marketplace_products(is_featured, sort_order);

-- ============================================================================
-- Product Purchases - Track individual purchases
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  
  -- Purchase details
  purchase_type TEXT NOT NULL CHECK(purchase_type IN ('one_time', 'subscription', 'credits')),
  amount_usd REAL NOT NULL,
  credits_used INTEGER DEFAULT 0,
  
  -- Payment info
  payment_method TEXT CHECK(payment_method IN ('paypal', 'credit_card', 'credits')),
  payment_id TEXT, -- PayPal transaction ID
  payment_status TEXT DEFAULT 'completed' CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- For subscriptions
  subscription_start DATE,
  subscription_end DATE,
  auto_renew BOOLEAN DEFAULT 0,
  
  -- Timestamps
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_user_id ON marketplace_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_product_id ON marketplace_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_status ON marketplace_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_date ON marketplace_purchases(purchased_at DESC);

-- ============================================================================
-- User Credits System
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_credits (
  user_id INTEGER PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Credit Transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL, -- Positive for purchase, negative for usage
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'subscription_grant')),
  
  -- Related entities
  product_id INTEGER,
  book_id INTEGER,
  
  -- Description
  description TEXT,
  description_en TEXT,
  
  -- Balance after transaction
  balance_after INTEGER NOT NULL,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE SET NULL,
  FOREIGN KEY (book_id) REFERENCES ai_books(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(created_at DESC);

-- ============================================================================
-- Product Reviews/Ratings
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  
  -- Status
  is_verified_purchase BOOLEAN DEFAULT 0,
  is_approved BOOLEAN DEFAULT 1,
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(product_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

-- ============================================================================
-- Insert initial Marketplace products
-- ============================================================================

-- AI Writing Service
INSERT INTO marketplace_products (
  product_type, name, name_en, description, description_en,
  price_usd, is_subscription, subscription_tier, credits_cost,
  category, is_active, is_featured
) VALUES (
  'ai_service',
  'AI智能写作助手',
  'AI Writing Assistant',
  '三级结构自动生成：主题→章→节→内容。专业AI写作，快速创作高质量书籍。',
  'Three-level structure generation: Theme→Chapter→Section→Content. Professional AI writing for high-quality books.',
  0.0,
  1,
  'premium',
  10,
  'ai_tools',
  1,
  1
);

-- AI Book Templates
INSERT INTO marketplace_products (
  product_type, name, name_en, description, description_en,
  price_usd, is_free,
  category, is_active
) VALUES
  ('book_template', '商业书籍模板', 'Business Book Template', '适合创业、管理类书籍的标准模板', 'Standard template for entrepreneurship and management books', 0.0, 1, 'templates', 1),
  ('book_template', '技术书籍模板', 'Technical Book Template', '适合技术教程、编程类书籍', 'For technical tutorials and programming books', 9.99, 0, 'templates', 1),
  ('book_template', '小说创作模板', 'Fiction Writing Template', '小说、故事创作专用模板', 'Template for fiction and storytelling', 14.99, 0, 'templates', 1),
  ('book_template', '学术论文模板', 'Academic Paper Template', '学术研究、论文写作模板', 'For academic research and papers', 19.99, 0, 'templates', 1);

-- Credits Packages
INSERT INTO marketplace_products (
  product_type, name, name_en, description, description_en,
  price_usd, category, is_active, features_json
) VALUES
  ('ai_service', 'Starter信用点包', 'Starter Credits Pack', '100信用点，适合尝试AI功能', '100 credits for trying AI features', 9.99, 'credits', 1, '{"credits": 100}'),
  ('ai_service', 'Popular信用点包', 'Popular Credits Pack', '600信用点（送20%），最受欢迎', '600 credits (20% bonus), most popular', 39.99, 'credits', 1, '{"credits": 600, "bonus": 100}'),
  ('ai_service', 'Pro信用点包', 'Pro Credits Pack', '2600信用点（送30%），超值优惠', '2600 credits (30% bonus), best value', 149.99, 'credits', 1, '{"credits": 2600, "bonus": 600}');

-- ============================================================================
-- Success message
-- ============================================================================

SELECT '✅ Marketplace system created successfully' as message;
SELECT 'Products: AI Writing, Book Templates, Credits' as info;
