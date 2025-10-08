-- Add role column to team_members table for permission control

-- Add role column: 'creator', 'viewer', 'operator'
-- creator: full permissions (view/edit/delete)
-- viewer: view only
-- operator: view and edit
ALTER TABLE team_members ADD COLUMN role TEXT DEFAULT 'viewer';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- Update existing team owners to have 'creator' role
-- This ensures backward compatibility
UPDATE team_members 
SET role = 'creator' 
WHERE user_id IN (
  SELECT owner_id FROM teams WHERE teams.id = team_members.team_id
);
