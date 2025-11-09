-- Add subscription system for premium users
-- This migration adds fields to track user subscriptions and payment history

-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME;
ALTER TABLE users ADD COLUMN subscription_auto_renew INTEGER DEFAULT 0;

-- Create subscription configuration table for admin to manage pricing
CREATE TABLE IF NOT EXISTS subscription_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier TEXT UNIQUE NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT,
  description_en TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default premium subscription config ($20/year)
INSERT INTO subscription_config (tier, price_usd, duration_days, description, description_en) 
VALUES ('premium', 20.00, 365, '高级用户年费', 'Premium Annual Subscription');

-- Create payments table to track all transactions
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount_usd DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT 'paypal',
  payment_status TEXT NOT NULL,
  paypal_order_id TEXT,
  paypal_payer_id TEXT,
  subscription_tier TEXT NOT NULL,
  subscription_duration_days INTEGER NOT NULL,
  transaction_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order ON payments(paypal_order_id);
