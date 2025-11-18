-- Insert admin user (password: admin123)
INSERT OR REPLACE INTO users (id, email, password_hash, username, role, language, subscription_tier, subscription_status) VALUES 
  (1, 'admin@review.com', '$2b$10$BNkq1u956qI.m0fikNy5POeMN8qAvdxFkEx8qGuNbT/6Dk8SMHoge', 'Admin', 'admin', 'zh', 'premium', 'active');

-- Insert premium user (password: premium123)
INSERT OR REPLACE INTO users (id, email, password_hash, username, role, language, subscription_tier, subscription_status) VALUES 
  (2, 'premium@review.com', '$2b$10$meHOcVR4loG7cge9HFKbZumSANqsS7LuA75FkOy5GwzWmG1Jbrgse', 'Premium User', 'premium', 'en', 'premium', 'active');

-- Insert normal user (password: user123)
INSERT OR REPLACE INTO users (id, email, password_hash, username, role, language, subscription_tier, subscription_status) VALUES 
  (3, 'user@review.com', '$2b$10$txWTFkEfImnlbpt683gNeeaVwaWdU5RV9/GO2IY23/NKVz8BtBYm2', 'User', 'user', 'zh', 'free', 'active');
