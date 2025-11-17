-- Migration: Add owner field to templates table
-- Purpose: Control template visibility (private/team/public)
-- Date: 2025-11-17

-- Add owner column to templates table
ALTER TABLE templates ADD COLUMN owner TEXT DEFAULT 'public' CHECK (owner IN ('private', 'team', 'public'));

-- Create index for owner field
CREATE INDEX IF NOT EXISTS idx_templates_owner ON templates(owner);

-- Set all existing templates to public
UPDATE templates SET owner = 'public' WHERE owner IS NULL;

-- Add comments
-- owner='private': Only creator and admin can see
-- owner='team': Only team members, creator and admin can see
-- owner='public': Everyone can see
