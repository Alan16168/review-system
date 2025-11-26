-- Complete fix for templates table - add all missing columns

-- Add price column (for premium templates)
ALTER TABLE templates ADD COLUMN price INTEGER DEFAULT 0;

-- Add visibility/sharing columns
ALTER TABLE templates ADD COLUMN visibility TEXT DEFAULT 'private' CHECK(visibility IN ('private', 'public', 'team'));
ALTER TABLE templates ADD COLUMN sharing_mode TEXT DEFAULT 'none' CHECK(sharing_mode IN ('none', 'readonly', 'editable'));

-- Add category and tags for organization
ALTER TABLE templates ADD COLUMN category TEXT DEFAULT 'custom';
ALTER TABLE templates ADD COLUMN tags TEXT DEFAULT NULL;

-- Add usage tracking
ALTER TABLE templates ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE templates ADD COLUMN last_used_at DATETIME DEFAULT NULL;
