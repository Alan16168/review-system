-- Add missing columns to users table for local development

-- Add subscription and tracking columns
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN last_login_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN referred_by INTEGER REFERENCES users(id);
