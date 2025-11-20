-- Migration: 0047_add_is_admin_to_users.sql
-- Description: Add is_admin column to users table
-- Date: 2025-11-20

-- Add is_admin column if it doesn't exist
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;

-- Set first user as admin
UPDATE users SET is_admin = 1 WHERE id = 1;

SELECT '✅ is_admin column added to users table' as message;
