-- Test Users Seed Data (with bcrypt hashes)
-- Generated: 2025-11-26T06:52:15.514Z

-- admin: admin@review.com / admin123
INSERT OR IGNORE INTO users (email, password_hash, username, role, language) VALUES ('admin@review.com', '$2b$10$2Vi7A8Fi7weZDPJHXY.Jg.BbWX1W1Ln3xbFkxYDKug8r5BjnGQvia', 'Admin User', 'admin', 'zh');

-- premium: premium@review.com / premium123
INSERT OR IGNORE INTO users (email, password_hash, username, role, language) VALUES ('premium@review.com', '$2b$10$euE/ecoTbyU4MjYODE1/yur1wogObwkzvKpSuGXtcq5FtzYwNULcO', 'Premium User', 'premium', 'zh');

-- user: user@review.com / user123
INSERT OR IGNORE INTO users (email, password_hash, username, role, language) VALUES ('user@review.com', '$2b$10$VjiN2fC4fXxgs1NdnbuqHeCPhqmGvTYlbRfv/1IVoTFEIgfO7I2CS', 'Regular User', 'user', 'zh');

