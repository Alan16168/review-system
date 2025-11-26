-- Fix templates table - add missing columns

ALTER TABLE templates ADD COLUMN owner TEXT DEFAULT 'system';
ALTER TABLE templates ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE templates ADD COLUMN user_id INTEGER REFERENCES users(id);
