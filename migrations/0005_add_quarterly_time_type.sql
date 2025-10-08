-- Add 'quarterly' option to time_type
-- No schema change needed, just documentation
-- Valid time_type values are now: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'

-- This migration serves as documentation for the new time_type option
-- The time_type column already accepts TEXT values, so 'quarterly' is valid
SELECT 'Migration 0005: Added quarterly time type option' as message;
