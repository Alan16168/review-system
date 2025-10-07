#!/bin/bash

# Find the SQLite database file
DB_FILE=$(find .wrangler/state/v3/d1 -name "*.sqlite" 2>/dev/null | head -1)

if [ -z "$DB_FILE" ]; then
    echo "Database file not found. Starting server first..."
    npm run dev:sandbox &
    SERVER_PID=$!
    sleep 5
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
    DB_FILE=$(find .wrangler/state/v3/d1 -name "*.sqlite" 2>/dev/null | head -1)
fi

if [ -z "$DB_FILE" ]; then
    echo "Error: Could not create or find database file"
    exit 1
fi

echo "Found database: $DB_FILE"
echo "Initializing schema..."

# Use node to execute SQL
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('$DB_FILE');
const sql = fs.readFileSync('./migrations/0001_initial_schema.sql', 'utf8');
db.exec(sql);
const seed = fs.readFileSync('./seed.sql', 'utf8');
db.exec(seed);
db.close();
console.log('Database initialized successfully!');
"

echo "Done!"
