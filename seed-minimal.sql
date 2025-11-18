-- Insert admin user (password: admin123)
INSERT OR REPLACE INTO users (email, password_hash, username, role, language) VALUES 
  ('admin@review.com', '$2b$10$BNkq1u956qI.m0fikNy5POeMN8qAvdxFkEx8qGuNbT/6Dk8SMHoge', 'Admin', 'admin', 'zh');
