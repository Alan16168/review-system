import { Hono } from 'hono';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { getAllUsers, updateUserRole, deleteUser } from '../utils/db';

type Bindings = {
  DB: D1Database;
};

const admin = new Hono<{ Bindings: Bindings }>();

// All routes require admin authentication
admin.use('/*', authMiddleware, adminOnly);

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

export default admin;
