-- Add is_public field to teams table (skip if already exists)
-- Note: SQLite doesn't have ALTER TABLE IF NOT EXISTS syntax
-- This column may already exist in production, which is OK

-- Create team applications table for join requests
CREATE TABLE IF NOT EXISTS team_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  message TEXT,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  reviewed_by INTEGER,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(team_id, user_id, status) -- Allow reapply after rejection
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_applications_team_id ON team_applications(team_id);
CREATE INDEX IF NOT EXISTS idx_team_applications_user_id ON team_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_team_applications_status ON team_applications(status);
