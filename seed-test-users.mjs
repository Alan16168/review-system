// Script to generate test users with bcrypt password hashing
import bcrypt from 'bcryptjs';

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

async function generateSeedSQL() {
  console.log('-- Test Users Seed Data (with bcrypt hashes)');
  console.log('-- Generated:', new Date().toISOString());
  console.log('');
  
  for (const user of testUsers) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`-- ${user.role}: ${user.email} / ${user.password}`);
    console.log(`INSERT OR IGNORE INTO users (email, password_hash, username, role, language) VALUES ('${user.email}', '${hash}', '${user.username}', '${user.role}', 'zh');`);
    console.log('');
  }
}

generateSeedSQL().catch(console.error);
