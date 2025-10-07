const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Find the database file
function findDatabaseFile() {
  const baseDir = '.wrangler/state/v3/d1';
  if (!fs.existsSync(baseDir)) {
    console.error('Database directory not found. Please start the server first.');
    return null;
  }
  
  const files = fs.readdirSync(baseDir, { recursive: true });
  const dbFile = files.find(f => f.endsWith('.sqlite'));
  
  if (!dbFile) {
    console.error('No SQLite database file found.');
    return null;
  }
  
  return path.join(baseDir, dbFile);
}

const dbPath = findDatabaseFile();
if (!dbPath) {
  process.exit(1);
}

console.log(`Found database: ${dbPath}`);
console.log('Initializing schema...');

try {
  const db = new Database(dbPath);
  
  // Execute schema migrations
  const schema1 = fs.readFileSync('./migrations/0001_initial_schema.sql', 'utf8');
  db.exec(schema1);
  console.log('✓ Initial schema created');
  
  const schema2 = fs.readFileSync('./migrations/0002_add_notifications.sql', 'utf8');
  db.exec(schema2);
  console.log('✓ Notifications table created');
  
  const schema3 = fs.readFileSync('./migrations/0003_add_review_types.sql', 'utf8');
  db.exec(schema3);
  console.log('✓ Review types columns added');
  
  // Execute seed data
  const seed = fs.readFileSync('./seed.sql', 'utf8');
  db.exec(seed);
  console.log('✓ Seed data inserted');
  
  // Verify
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`✓ Database initialized with ${userCount.count} users`);
  
  db.close();
  console.log('\nDatabase initialization complete!');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}
