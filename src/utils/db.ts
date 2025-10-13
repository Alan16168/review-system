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

export async function updateUserPassword(db: D1Database, userId: number, passwordHash: string): Promise<void> {
  await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(passwordHash, userId).run();
}

// Password reset token functions
export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: number;
  created_at: string;
}

/**
 * Create a password reset token
 */
export async function createPasswordResetToken(
  db: D1Database,
  userId: number,
  token: string,
  expiresAt: string
): Promise<number> {
  const result = await db.prepare(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(userId, token, expiresAt).run();
  
  return result.meta.last_row_id as number;
}

/**
 * Get password reset token by token string
 */
export async function getPasswordResetToken(
  db: D1Database,
  token: string
): Promise<PasswordResetToken | null> {
  const result = await db.prepare(
    'SELECT * FROM password_reset_tokens WHERE token = ?'
  ).bind(token).first<PasswordResetToken>();
  
  return result || null;
}

/**
 * Mark password reset token as used
 */
export async function markTokenAsUsed(db: D1Database, tokenId: number): Promise<void> {
  await db.prepare(
    'UPDATE password_reset_tokens SET used = 1 WHERE id = ?'
  ).bind(tokenId).run();
}

/**
 * Delete expired or used tokens for a user (cleanup)
 */
export async function cleanupUserTokens(db: D1Database, userId: number): Promise<void> {
  await db.prepare(
    'DELETE FROM password_reset_tokens WHERE user_id = ? AND (used = 1 OR expires_at < datetime("now"))'
  ).bind(userId).run();
}

// Team review answer functions
export interface TeamReviewAnswer {
  id: number;
  review_id: number;
  user_id: number;
  question_number: number;
  answer: string;
  created_at: string;
  updated_at: string;
  username?: string; // Joined from users table
  email?: string; // Joined from users table
}

export interface TeamAnswersByQuestion {
  question_number: number;
  answers: {
    user_id: number;
    username: string;
    email: string;
    answer: string;
    updated_at: string;
  }[];
}

/**
 * Get all team members' answers for a review, grouped by question
 */
export async function getTeamReviewAnswers(
  db: D1Database,
  reviewId: number
): Promise<TeamReviewAnswer[]> {
  const result = await db.prepare(`
    SELECT tra.*, u.username, u.email
    FROM team_review_answers tra
    JOIN users u ON tra.user_id = u.id
    WHERE tra.review_id = ?
    ORDER BY tra.question_number, u.username
  `).bind(reviewId).all<TeamReviewAnswer>();
  
  return result.results || [];
}

/**
 * Get a specific user's answer for a question
 */
export async function getMyTeamAnswer(
  db: D1Database,
  reviewId: number,
  userId: number,
  questionNumber: number
): Promise<TeamReviewAnswer | null> {
  const result = await db.prepare(`
    SELECT tra.*, u.username, u.email
    FROM team_review_answers tra
    JOIN users u ON tra.user_id = u.id
    WHERE tra.review_id = ? AND tra.user_id = ? AND tra.question_number = ?
  `).bind(reviewId, userId, questionNumber).first<TeamReviewAnswer>();
  
  return result || null;
}

/**
 * Save or update user's answer for a question
 */
export async function saveMyTeamAnswer(
  db: D1Database,
  reviewId: number,
  userId: number,
  questionNumber: number,
  answer: string
): Promise<void> {
  await db.prepare(`
    INSERT INTO team_review_answers (review_id, user_id, question_number, answer, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(review_id, user_id, question_number) 
    DO UPDATE SET answer = ?, updated_at = CURRENT_TIMESTAMP
  `).bind(reviewId, userId, questionNumber, answer, answer).run();
}

/**
 * Delete a user's answer (owner only)
 */
export async function deleteTeamAnswer(
  db: D1Database,
  reviewId: number,
  userId: number,
  questionNumber: number
): Promise<void> {
  await db.prepare(`
    DELETE FROM team_review_answers 
    WHERE review_id = ? AND user_id = ? AND question_number = ?
  `).bind(reviewId, userId, questionNumber).run();
}

/**
 * Get completion status for all team members
 */
export async function getTeamAnswerCompletionStatus(
  db: D1Database,
  reviewId: number
): Promise<{user_id: number, username: string, email: string, completed_count: number}[]> {
  const result = await db.prepare(`
    SELECT 
      u.id as user_id,
      u.username,
      u.email,
      COUNT(tra.id) as completed_count
    FROM users u
    LEFT JOIN team_review_answers tra ON u.id = tra.user_id AND tra.review_id = ?
    WHERE u.id IN (
      SELECT DISTINCT user_id FROM team_review_answers WHERE review_id = ?
      UNION
      SELECT user_id FROM review_collaborators WHERE review_id = ?
      UNION
      SELECT user_id FROM reviews WHERE id = ?
    )
    GROUP BY u.id, u.username, u.email
    ORDER BY u.username
  `).bind(reviewId, reviewId, reviewId, reviewId).all();
  
  return result.results || [];
}
