-- We can't modify CHECK constraints in SQLite easily
-- But we can work around it by ensuring the code aligns with the constraint
-- Change 'personal' constraint to match what the code expects

-- First, let's check if there are any existing rows
-- If the table is empty, we're safe

-- The proper fix is to ensure the backend code maps correctly
-- 'private' should map to 'personal' in the backend before inserting
