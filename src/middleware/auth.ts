import { Context, Next } from 'hono';
import { verifyToken, UserPayload } from '../utils/auth';

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] No authorization header or invalid format');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const jwtSecret = c.env.JWT_SECRET;
    
    console.log('[AUTH] Verifying token with secret:', jwtSecret ? 'Present' : 'Missing');
    const user = verifyToken(token, jwtSecret);

    if (!user) {
      console.log('[AUTH] Token verification failed');
      return c.json({ error: 'Invalid token' }, 401);
    }

    console.log('[AUTH] User authenticated:', user.id, user.username);
    c.set('user', user);
    await next();
  } catch (error) {
    console.error('[AUTH] Critical error in authMiddleware:', error);
    return c.json({ 
      error: 'Authentication error', 
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

export async function adminOnly(c: Context, next: Next) {
  const user = c.get('user') as UserPayload;
  
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
}

export async function premiumOrAdmin(c: Context, next: Next) {
  const user = c.get('user') as UserPayload;
  
  if (user.role !== 'admin' && user.role !== 'premium') {
    return c.json({ error: 'Premium access required' }, 403);
  }

  await next();
}
