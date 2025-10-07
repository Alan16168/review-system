import { D1Database } from '@cloudflare/workers-types';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  username: string;
  role: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  title: string;
  user_id: number;
  team_id?: number;
  question1?: string;
  question2?: string;
  question3?: string;
  question4?: string;
  question5?: string;
  question6?: string;
  question7?: string;
  question8?: string;
  question9?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
  return result || null;
}

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  return result || null;
}

export async function createUser(db: D1Database, email: string, passwordHash: string, username: string, role: string = 'user'): Promise<number> {
  const result = await db.prepare(
    'INSERT INTO users (email, password_hash, username, role) VALUES (?, ?, ?, ?)'
  ).bind(email, passwordHash, username, role).run();
  
  return result.meta.last_row_id as number;
}

export async function getAllUsers(db: D1Database): Promise<User[]> {
  const result = await db.prepare('SELECT * FROM users ORDER BY created_at DESC').all<User>();
  return result.results || [];
}

export async function updateUserRole(db: D1Database, userId: number, role: string): Promise<void> {
  await db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(role, userId).run();
}

export async function deleteUser(db: D1Database, userId: number): Promise<void> {
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
}
