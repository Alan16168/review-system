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
    
    // Get statistics for each user
    const usersWithStats = await Promise.all(users.map(async (u) => {
      try {
        // Count reviews created by this user
        const reviewCount = await c.env.DB.prepare(
          'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?'
        ).bind(u.id).first();
        
        // Count templates created by this user
        const templateCount = await c.env.DB.prepare(
          'SELECT COUNT(*) as count FROM templates WHERE created_by = ?'
        ).bind(u.id).first();
        
        return {
          id: u.id || 0,
          email: u.email || '',
          username: u.username || '',
          role: u.role || 'user',
          language: u.language || 'zh',
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.updated_at || new Date().toISOString(),
          last_login_at: u.last_login_at || null,
          login_count: u.login_count || 0,
          review_count: reviewCount?.count || 0,
          template_count: templateCount?.count || 0
        };
      } catch (err) {
        console.error('Error getting stats for user', u.id, err);
        // Return user with zero stats if error
        return {
          id: u.id || 0,
          email: u.email || '',
          username: u.username || '',
          role: u.role || 'user',
          language: u.language || 'zh',
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.updated_at || new Date().toISOString(),
          last_login_at: null,
          login_count: 0,
          review_count: 0,
          template_count: 0
        };
      }
    }));

    return c.json({ users: usersWithStats });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user information (Admin only)
admin.put('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const { email, username, role } = await c.req.json();

    // Validate inputs
    if (!email && !username && !role) {
      return c.json({ error: 'At least one field (email, username, role) is required' }, 400);
    }

    // Check if user exists
    const user = await getUserById(c.env.DB, userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Validate role if provided
    if (role && !['user', 'premium', 'admin'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Check if email already exists (for other users)
    if (email && email !== user.email) {
      const existingUser = await getUserByEmail(c.env.DB, email);
      if (existingUser && existingUser.id !== userId) {
        return c.json({ error: 'Email already in use by another user' }, 400);
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (email && email !== user.email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (username && username !== user.username) {
      updates.push('username = ?');
      values.push(username);
    }

    if (role && role !== user.role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (updates.length === 0) {
      return c.json({ message: 'No changes made' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...values).run();

    // Get updated user
    const updatedUser = await getUserById(c.env.DB, userId);

    return c.json({ 
      message: 'User updated successfully',
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        username: updatedUser?.username,
        role: updatedUser?.role
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user role (kept for backward compatibility)
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

// Reset user password (Admin only) - RESTful endpoint
admin.put('/users/:id/reset-password', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const { newPassword } = await c.req.json();

    if (!newPassword) {
      return c.json({ error: 'New password is required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Get user
    const user = await getUserById(c.env.DB, userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(passwordHash, userId).run();

    return c.json({ 
      message: 'Password reset successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Reset user password directly (Admin only) - Legacy endpoint
admin.post('/reset-user-password', async (c) => {
  try {
    const { userId, newPassword } = await c.req.json();

    if (!userId || !newPassword) {
      return c.json({ error: 'User ID and new password are required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Get user
    const user = await getUserById(c.env.DB, userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(passwordHash, userId).run();

    return c.json({ 
      message: 'Password reset successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Diagnose Resend API configuration
admin.get('/diagnose-email', async (c) => {
  try {
    const diagnosis: any = {
      timestamp: new Date().toISOString(),
      hasApiKey: !!c.env.RESEND_API_KEY,
      apiKeyLength: c.env.RESEND_API_KEY ? c.env.RESEND_API_KEY.length : 0,
      apiKeyPrefix: c.env.RESEND_API_KEY ? c.env.RESEND_API_KEY.substring(0, 10) + '...' : 'N/A',
      lastError: (globalThis as any).lastEmailError || null
    };

    // Test API key validity by checking API status
    if (c.env.RESEND_API_KEY) {
      try {
        const testResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Review System <noreply@ireviewsystem.com>',
            to: 'test@example.com', // Invalid email to test API response
            subject: 'Diagnostic Test',
            html: '<p>Test</p>',
          }),
        });

        const responseText = await testResponse.text();
        diagnosis.apiTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          response: responseText
        };
      } catch (error) {
        diagnosis.apiTest = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return c.json(diagnosis);
  } catch (error) {
    console.error('Diagnosis error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
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

    console.log(`🔍 Testing email send to: ${email}`);

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

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseJson,
      debug: {
        to: email,
        from: 'noreply@ireviewsystem.com',
        hasApiKey: true,
        apiKeyPrefix: c.env.RESEND_API_KEY.substring(0, 10) + '...',
        apiKeyLength: c.env.RESEND_API_KEY.length
      }
    };

    if (response.ok) {
      console.log(`✅ Test email sent successfully to ${email}:`, responseJson);
    } else {
      console.error(`❌ Test email failed to ${email}:`, responseJson);
    }

    return c.json(result);
  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Get subscription configuration
admin.get('/subscription/config', async (c) => {
  try {
    const configs = await c.env.DB.prepare(
      'SELECT * FROM subscription_config ORDER BY tier'
    ).all();
    
    return c.json({ configs: configs.results || [] });
  } catch (error) {
    console.error('Get subscription config error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update subscription configuration
admin.put('/subscription/config/:tier', async (c) => {
  try {
    const tier = c.req.param('tier');
    const { price_usd, duration_days, description, description_en, is_active } = await c.req.json();
    
    if (!price_usd || !duration_days) {
      return c.json({ error: 'Price and duration are required' }, 400);
    }
    
    await c.env.DB.prepare(`
      UPDATE subscription_config 
      SET price_usd = ?,
          duration_days = ?,
          description = ?,
          description_en = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE tier = ?
    `).bind(
      price_usd,
      duration_days,
      description || null,
      description_en || null,
      is_active !== undefined ? is_active : 1,
      tier
    ).run();
    
    return c.json({ message: 'Subscription config updated successfully' });
  } catch (error) {
    console.error('Update subscription config error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all payments (admin view)
admin.get('/payments', async (c) => {
  try {
    const payments = await c.env.DB.prepare(`
      SELECT 
        p.id, p.user_id, p.amount_usd, p.currency, p.payment_method,
        p.payment_status, p.subscription_tier, p.subscription_duration_days,
        p.created_at, p.completed_at,
        u.email, u.username
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `).all();
    
    return c.json({ payments: payments.results || [] });
  } catch (error) {
    console.error('Get payments error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default admin;
