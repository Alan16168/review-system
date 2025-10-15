import { Hono } from 'hono';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { getAllUsers, updateUserRole, deleteUser, getUserByEmail, createUser, getUserById } from '../utils/db';
import { hashPassword } from '../utils/auth';
import { sendEmail } from '../utils/email';

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
};

const admin = new Hono<{ Bindings: Bindings }>();

// All routes require admin authentication
admin.use('/*', authMiddleware, adminOnly);

// Create new user (Admin only)
admin.post('/users', async (c) => {
  try {
    const { email, password, username, role } = await c.req.json();

    if (!email || !password || !username) {
      return c.json({ error: 'Email, password and username are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(c.env.DB, email);
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Validate role
    const userRole = role && ['user', 'premium', 'admin'].includes(role) ? role : 'user';

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = await createUser(c.env.DB, email, passwordHash, username, userRole);

    const newUser = await getUserById(c.env.DB, userId);
    if (!newUser) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    return c.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all users
admin.get('/users', async (c) => {
  try {
    const users = await getAllUsers(c.env.DB);
    
    // Remove password hashes from response
    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      language: u.language,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));

    return c.json({ users: safeUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user role
admin.put('/users/:id/role', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const { role } = await c.req.json();

    if (!['user', 'premium', 'admin'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    await updateUserRole(c.env.DB, userId, role);

    return c.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete user
admin.delete('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    await deleteUser(c.env.DB, userId);

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get system statistics
admin.get('/stats', async (c) => {
  try {
    const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const reviewCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM reviews').first();
    const teamCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM teams').first();

    const roleStats = await c.env.DB.prepare(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `).all();

    return c.json({
      total_users: userCount?.count || 0,
      total_reviews: reviewCount?.count || 0,
      total_teams: teamCount?.count || 0,
      users_by_role: roleStats.results || []
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Test email sending (Admin only - for debugging)
admin.post('/test-email', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    if (!c.env.RESEND_API_KEY) {
      return c.json({ 
        error: 'RESEND_API_KEY not configured',
        debug: {
          hasApiKey: false
        }
      }, 500);
    }

    // Test Resend API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Review System <noreply@ireviewsystem.com>',
        to: email,
        subject: 'Test Email - Review System',
        html: '<h1>Test Email</h1><p>This is a test email from Review System admin panel.</p>',
      }),
    });

    const responseText = await response.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    return c.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseJson,
      debug: {
        to: email,
        from: 'Review System <onboarding@resend.dev>',
        hasApiKey: true,
        apiKeyPrefix: c.env.RESEND_API_KEY.substring(0, 10) + '...'
      }
    });
  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default admin;
