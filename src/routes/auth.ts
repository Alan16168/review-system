import { Hono } from 'hono';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { getUserByEmail, createUser, getUserById, updateUserPassword, createPasswordResetToken, getPasswordResetToken, markTokenAsUsed, cleanupUserTokens } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import { sendPasswordResetEmail } from '../utils/email';

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  APP_URL?: string;
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

// Change Password (authenticated users)
auth.post('/change-password', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current password and new password are required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'New password must be at least 6 characters' }, 400);
    }

    // Get user from database
    const dbUser = await getUserById(c.env.DB, user.id);
    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, dbUser.password_hash);
    if (!isValidPassword) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await updateUserPassword(c.env.DB, user.id, newPasswordHash);

    return c.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Request Password Reset (Step 1: Send email with reset link)
auth.post('/request-password-reset', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Get user by email
    const user = await getUserByEmail(c.env.DB, email);
    
    // Log for debugging (remove in production)
    console.log('[Password Reset] Email requested:', email);
    console.log('[Password Reset] User found:', user ? `Yes (id: ${user.id}, email: ${user.email})` : 'No');
    
    // Always return success message to prevent email enumeration
    // Don't reveal whether email exists or not
    if (!user) {
      console.log('[Password Reset] User not found, skipping email send');
      return c.json({ 
        message: 'If your email is registered, you will receive a password reset link shortly.' 
      });
    }

    // Generate secure random token
    const token = crypto.randomUUID();
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    // Clean up old tokens for this user
    await cleanupUserTokens(c.env.DB, user.id);
    
    // Create password reset token
    await createPasswordResetToken(c.env.DB, user.id, token, expiresAt);

    // Get app URL from environment or use default
    const appUrl = c.env.APP_URL || 'https://review-system.pages.dev';
    // Use root path with token parameter for SPA routing
    const resetUrl = `${appUrl}/?token=${token}`;

    // Send email with Resend
    console.log('[Password Reset] Attempting to send email to:', user.email);
    if (c.env.RESEND_API_KEY) {
      const emailSent = await sendPasswordResetEmail(
        c.env.RESEND_API_KEY,
        user.email,
        resetUrl,
        user.username
      );

      if (!emailSent) {
        console.error('[Password Reset] Failed to send email to:', user.email);
        // Don't return error to user, just log it
      } else {
        console.log('[Password Reset] Email sent successfully to:', user.email);
      }
    } else {
      console.error('RESEND_API_KEY not configured');
      // In development, log the reset URL
      console.log('Password reset URL:', resetUrl);
    }

    return c.json({ 
      message: 'If your email is registered, you will receive a password reset link shortly.' 
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Verify Reset Token (Optional: Check if token is valid before showing form)
auth.get('/verify-reset-token/:token', async (c) => {
  try {
    const token = c.req.param('token');

    if (!token) {
      return c.json({ valid: false, error: 'Token is required' }, 400);
    }

    const resetToken = await getPasswordResetToken(c.env.DB, token);

    if (!resetToken) {
      return c.json({ valid: false, error: 'Invalid token' }, 404);
    }

    if (resetToken.used === 1) {
      return c.json({ valid: false, error: 'Token already used' }, 400);
    }

    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);

    if (now > expiresAt) {
      return c.json({ valid: false, error: 'Token expired' }, 400);
    }

    return c.json({ valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Reset Password (Step 2: Set new password with token)
auth.post('/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'New password must be at least 6 characters' }, 400);
    }

    // Get reset token from database
    const resetToken = await getPasswordResetToken(c.env.DB, token);

    if (!resetToken) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    // Check if token is already used
    if (resetToken.used === 1) {
      return c.json({ error: 'This reset link has already been used' }, 400);
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);

    if (now > expiresAt) {
      return c.json({ error: 'This reset link has expired. Please request a new one.' }, 400);
    }

    // Get user
    const user = await getUserById(c.env.DB, resetToken.user_id);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await updateUserPassword(c.env.DB, user.id, newPasswordHash);

    // Mark token as used
    await markTokenAsUsed(c.env.DB, resetToken.id);

    return c.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;
