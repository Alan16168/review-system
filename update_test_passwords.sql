-- Update test user passwords with correct bcrypt hashes
-- Generated using bcryptjs library

UPDATE users SET password_hash = '$2b$10$.31lzQTFcU2Y.qecfZDuC.rRVSDQPe3B0S8GQ4FnMG8TE1nP.dgpq' WHERE username = '1';
UPDATE users SET password_hash = '$2b$10$PLTWscqoYyDWuWGMCq8.GeUQP8qGrwMDMzhmZquoAGJVyO40K1puS' WHERE username = '2';
UPDATE users SET password_hash = '$2b$10$Gp.BbaAEqAm4YeWqUeUTI.3/OZlKqw4oPtl4if96UhDdf4URjJTRC' WHERE username = '3';

-- Verify updates
SELECT id, username, email, role, subscription_tier, substr(password_hash, 1, 10) as hash_prefix FROM users WHERE username IN ('1', '2', '3');
