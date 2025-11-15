-- Migration to remove Chinese-specific fields and rename English fields
-- This migration removes all Chinese data fields and renames _en fields to be the primary fields

-- Step 1: Update templates table
-- Rename _en columns to primary columns
ALTER TABLE templates RENAME COLUMN name_en TO name_temp;
ALTER TABLE templates RENAME COLUMN description_en TO description_temp;

-- Drop old Chinese columns (SQLite doesn't support DROP COLUMN directly in older versions)
-- We'll create a new table and migrate data
CREATE TABLE templates_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Copy data from old table to new table (using _temp columns as source)
INSERT INTO templates_new (id, name, description, is_default, is_active, created_at, updated_at, created_by)
SELECT id, 
       COALESCE(name_temp, name) as name,
       COALESCE(description_temp, description) as description,
       is_default, is_active, created_at, updated_at, created_by
FROM templates;

-- Drop old table and rename new table
DROP TABLE templates;
ALTER TABLE templates_new RENAME TO templates;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_templates_is_default ON templates(is_default);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);


-- Step 2: Update template_questions table
ALTER TABLE template_questions RENAME COLUMN question_text_en TO question_text_temp;

CREATE TABLE template_questions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_length INTEGER DEFAULT 50,
  question_type TEXT DEFAULT 'text',
  options TEXT,
  correct_answer TEXT,
  datetime_value TEXT,
  datetime_title TEXT,
  datetime_answer_max_length INTEGER DEFAULT 200,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, question_number)
);

-- Copy data from old table to new table
INSERT INTO template_questions_new (id, template_id, question_number, question_text, answer_length, 
                                     question_type, options, correct_answer, datetime_value, datetime_title, 
                                     datetime_answer_max_length, created_at)
SELECT id, template_id, question_number, 
       COALESCE(question_text_temp, question_text) as question_text,
       answer_length, question_type, options, correct_answer, 
       datetime_value, datetime_title, datetime_answer_max_length, created_at
FROM template_questions;

-- Drop old table and rename new table
DROP TABLE template_questions;
ALTER TABLE template_questions_new RENAME TO template_questions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id ON template_questions(template_id);


-- Step 3: Update testimonials table
ALTER TABLE testimonials RENAME COLUMN name_en TO name_temp;
ALTER TABLE testimonials RENAME COLUMN role_en TO role_temp;
ALTER TABLE testimonials RENAME COLUMN content_en TO content_temp;

CREATE TABLE testimonials_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER DEFAULT 5 CHECK(rating >= 1 AND rating <= 5),
  is_featured INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table to new table
INSERT INTO testimonials_new (id, name, role, content, avatar_url, rating, is_featured, display_order, created_at, updated_at)
SELECT id, 
       COALESCE(name_temp, name) as name,
       COALESCE(role_temp, role) as role,
       COALESCE(content_temp, content) as content,
       avatar_url, rating, is_featured, display_order, created_at, updated_at
FROM testimonials;

-- Drop old table and rename new table
DROP TABLE testimonials;
ALTER TABLE testimonials_new RENAME TO testimonials;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_created ON testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials(display_order);


-- Step 4: Update subscription_config table
ALTER TABLE subscription_config RENAME COLUMN description_en TO description_temp;

CREATE TABLE subscription_config_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier TEXT UNIQUE NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  renewal_price_usd DECIMAL(10, 2),
  duration_days INTEGER NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table to new table
INSERT INTO subscription_config_new (id, tier, price_usd, renewal_price_usd, duration_days, description, is_active, created_at, updated_at)
SELECT id, tier, price_usd, renewal_price_usd, duration_days, 
       COALESCE(description_temp, description) as description,
       is_active, created_at, updated_at
FROM subscription_config;

-- Drop old table and rename new table
DROP TABLE subscription_config;
ALTER TABLE subscription_config_new RENAME TO subscription_config;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_subscription_config_tier ON subscription_config(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_config_active ON subscription_config(is_active);


-- Step 5: Update shopping_cart table (if it exists and has description_en)
-- Check if shopping_cart has description_en column and remove it
CREATE TABLE IF NOT EXISTS shopping_cart_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  subscription_tier TEXT NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data if old table exists
INSERT INTO shopping_cart_new (id, user_id, item_type, subscription_tier, price_usd, duration_days, description, created_at)
SELECT id, user_id, item_type, subscription_tier, price_usd, duration_days, 
       COALESCE(description, description) as description,
       created_at
FROM shopping_cart
WHERE EXISTS (SELECT 1 FROM shopping_cart LIMIT 1);

-- Drop old table and rename new table if it exists
DROP TABLE IF EXISTS shopping_cart;
ALTER TABLE shopping_cart_new RENAME TO shopping_cart;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user ON shopping_cart(user_id);
