-- Setup test users for Manhattan Project testing
-- Admin user: username=1, password=1
-- Premium user: username=2, password=2  
-- Free user: username=3, password=3

-- Clear existing test users if they exist
DELETE FROM users WHERE username IN ('1', '2', '3');

-- Insert test users
INSERT INTO users (username, email, password_hash, role, subscription_tier, subscription_expires_at)
VALUES 
  ('1', '1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'super', datetime('now', '+1 year')),
  ('2', '2@test.com', '$2a$10$bx.2Q5etwb0TB3OpwdV9C.X75z9pL7PfF5aF8FvYYkEqKD1.p2MJu', 'premium', 'premium', datetime('now', '+1 year')),
  ('3', '3@test.com', '$2a$10$NYFZ0Bj/LWmyxg8s/GVhwOVGQR7HF6lYd8mBcTAJpxpIFFMr9JLiq', 'user', 'free', datetime('now', '+1 year'));

-- Verify users were created
SELECT id, username, email, role, subscription_tier FROM users WHERE username IN ('1', '2', '3');
