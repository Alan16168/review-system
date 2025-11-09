-- Add renewal reminder tracking table
-- This tracks when renewal reminder emails have been sent

CREATE TABLE IF NOT EXISTS renewal_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reminder_type TEXT NOT NULL, -- '30_days', '7_days', '1_day'
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  subscription_expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_renewal_reminders_user ON renewal_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_renewal_reminders_sent_at ON renewal_reminders(sent_at);
