import { Context, Next } from 'hono';
import { verifyToken, UserPayload } from '../utils/auth';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
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
