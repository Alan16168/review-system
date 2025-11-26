#!/bin/bash

# Script to manually apply answer set lock migration to local D1 database

DB_FILE=".wrangler/state/v3/d1/miniflare-D1DatabaseObject/8556bff7dbf8a92e8c5721225abeea7a1f3e98fcd54cb1ff89e86e97833ee7e7.sqlite"

echo "Applying answer set lock migration to local database..."

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file not found at $DB_FILE"
  exit 1
fi

# Apply migration using wrangler d1 execute
echo "Adding is_locked column to review_answer_sets table..."

# Create temporary SQL file
cat > /tmp/add_lock_fields.sql << 'EOF'
-- Add is_locked field if it doesn't exist
ALTER TABLE review_answer_sets ADD COLUMN is_locked TEXT DEFAULT 'no' CHECK(is_locked IN ('yes', 'no'));

-- Add locked_at field if it doesn't exist  
ALTER TABLE review_answer_sets ADD COLUMN locked_at DATETIME DEFAULT NULL;

-- Add locked_by field if it doesn't exist
ALTER TABLE review_answer_sets ADD COLUMN locked_by INTEGER REFERENCES users(id);
EOF

# Execute SQL using wrangler
npx wrangler d1 execute review-system-production --local --file=/tmp/add_lock_fields.sql

echo "Migration applied successfully!"
echo "Restarting service..."

# Restart PM2 service
pm2 restart review-system

echo "Done! The answer set lock feature should now work properly."
