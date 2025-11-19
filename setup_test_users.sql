-- Setup test users for Manhattan Project testing
-- Admin user: username=1, password=1
-- Premium user: username=2, password=2  
-- Free user: username=3, password=3

-- Clear existing test users if they exist
DELETE FROM users WHERE username IN ('1', '2', '3');

-- Insert Admin user (id will be auto-generated)
-- Password hash for '1': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy (bcrypt hash of '1')
-- Password hash for '2': $2a$10$bx.2Q5etwb0TB3OpwdV9C.X75z9pL7PfF5aF8FvYYkEqKD1.p2MJu (bcrypt hash of '2')  
-- Password hash for '3': $2a$10$NYFZ0Bj/LWmyxg8s/GVhwOVGQR7HF6lYd8mBcTAJpxpIFFMr9JLiq (bcrypt hash of '3')
INSERT INTO users (username, email, password_hash, role, subscription_tier, subscription_expires_at)
VALUES 
  ('1', '1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'super', datetime('now', '+1 year')),
  ('2', '2@test.com', '$2a$10$bx.2Q5etwb0TB3OpwdV9C.X75z9pL7PfF5aF8FvYYkEqKD1.p2MJu', 'premium', 'premium', datetime('now', '+1 year')),
  ('3', '3@test.com', '$2a$10$NYFZ0Bj/LWmyxg8s/GVhwOVGQR7HF6lYd8mBcTAJpxpIFFMr9JLiq', 'user', 'free', datetime('now', '+1 year'));

-- Initialize credits for test users
INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
SELECT id, 1000, 1000, 0 FROM users WHERE username IN ('1', '2', '3');

-- Verify users were created
SELECT id, username, email, role, subscription_tier FROM users WHERE username IN ('1', '2', '3');
