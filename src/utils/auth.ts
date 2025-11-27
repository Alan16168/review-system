import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT_SECRET should come from environment variable, with fallback for development
const getJwtSecret = (): string => {
  // In Cloudflare Workers, env is passed as parameter, so we use a global default
  // The actual secret will be accessed from context in auth routes
  return 'your-secret-key-change-in-production';
};

export interface UserPayload {
  id: number;
  email: string;
  username: string;
  role: string;
  subscription_tier?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: UserPayload, jwtSecret?: string): string {
  const secret = jwtSecret || getJwtSecret();
  return jwt.sign(user, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string, jwtSecret?: string): UserPayload | null {
  try {
    const secret = jwtSecret || getJwtSecret();
    console.log('[VERIFY_TOKEN] Using JWT secret:', secret ? 'Present' : 'Missing');
    const decoded = jwt.verify(token, secret) as UserPayload;
    console.log('[VERIFY_TOKEN] Token verified successfully for user:', decoded.id);
    return decoded;
  } catch (error) {
    console.error('[VERIFY_TOKEN] Token verification failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}
