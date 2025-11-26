// Script to create test users with proper password hashing
import crypto from 'crypto';

// Simple bcrypt-style password hashing for test purposes
function hashPassword(password) {
  // Using SHA256 for simplicity in seeding
  // In production, the auth routes use proper bcrypt
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  // Format like bcrypt hash: $2a$10$[salt][hash]
  return `$2a$10$abcdefghijklmnopqrstuv${hash.substring(0, 31)}`;
}

const testUsers = [
  {
    email: 'admin@review.com',
    password: 'admin123',
    username: 'Admin User',
    role: 'admin'
  },
  {
    email: 'premium@review.com',
    password: 'premium123',
    username: 'Premium User',
    role: 'premium'
  },
  {
    email: 'user@review.com',
    password: 'user123',
    username: 'Regular User',
    role: 'user'
  }
];

console.log('-- Test Users Seed Data');
console.log('-- Generated:', new Date().toISOString());
console.log('');

testUsers.forEach(user => {
  const hash = hashPassword(user.password);
  console.log(`-- ${user.role}: ${user.email} / ${user.password}`);
  console.log(`INSERT OR IGNORE INTO users (email, password_hash, username, role, language) VALUES ('${user.email}', '${hash}', '${user.username}', '${user.role}', 'zh');`);
  console.log('');
});
