-- Migration: Add referral system
-- Add referred_by column to track who invited each user

-- Add referred_by column to users table
ALTER TABLE users ADD COLUMN referred_by INTEGER DEFAULT NULL;

-- Add foreign key constraint (referred_by points to users.id)
-- Note: D1 doesn't enforce foreign keys, but we document the relationship

-- Create index for faster referral queries
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Create invitations table to track invitation links
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  review_id INTEGER NOT NULL,
  referrer_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  used_by_user_id INTEGER DEFAULT NULL,
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (used_by_user_id) REFERENCES users(id)
);

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_referrer ON invitations(referrer_id);
CREATE INDEX IF NOT EXISTS idx_invitations_review ON invitations(review_id);
