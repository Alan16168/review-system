import { Hono } from 'hono';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { getUserByEmail, createUser, getUserById } from '../utils/db';

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Register
auth.post('/register', async (c) => {
  try {
    const { email, password, username, role } = await c.req.json();

    if (!email || !password || !username) {
      return c.json({ error: 'Email, password and username are required' }, 400);
    }

    const existingUser = await getUserByEmail(c.env.DB, email);
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    const passwordHash = await hashPassword(password);
    const userRole = role && ['user', 'premium', 'admin'].includes(role) ? role : 'user';
    const userId = await createUser(c.env.DB, email, passwordHash, username, userRole);

    const user = await getUserById(c.env.DB, userId);
    if (!user) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const user = await getUserByEmail(c.env.DB, email);
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Google OAuth - Verify Google ID Token
auth.post('/google', async (c) => {
  try {
    const { credential } = await c.req.json();

    if (!credential) {
      return c.json({ error: 'Google credential is required' }, 400);
    }

    // Verify Google ID token by calling Google's tokeninfo endpoint
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    const verifyResponse = await fetch(verifyUrl);
    
    if (!verifyResponse.ok) {
      console.error('Google token verification failed:', await verifyResponse.text());
      return c.json({ error: 'Invalid Google token' }, 401);
    }

    const googleUser = await verifyResponse.json();
    
    // Check if token is valid and from the correct client
    if (c.env.GOOGLE_CLIENT_ID && googleUser.aud !== c.env.GOOGLE_CLIENT_ID) {
      return c.json({ error: 'Invalid token audience' }, 401);
    }

    const email = googleUser.email;
    const username = googleUser.name || email.split('@')[0];
    const googleId = googleUser.sub;

    // Check if user exists
    let user = await getUserByEmail(c.env.DB, email);

    if (!user) {
      // Create new user with Google account
      // For Google OAuth users, we set a random password hash (they won't use it)
      const randomPassword = crypto.randomUUID();
      const passwordHash = await hashPassword(randomPassword);
      const userId = await createUser(c.env.DB, email, passwordHash, username, 'user');
      user = await getUserById(c.env.DB, userId);
      
      if (!user) {
        return c.json({ error: 'Failed to create user' }, 500);
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;
