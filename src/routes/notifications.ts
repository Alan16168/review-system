import { Hono } from 'hono';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { UserPayload } from '../utils/auth';

type Bindings = {
  DB: D1Database;
};

const notifications = new Hono<{ Bindings: Bindings }>();

// All routes require admin authentication
notifications.use('/*', authMiddleware, adminOnly);

// Send notification to all users
notifications.post('/broadcast', async (c) => {
  try {
    const { title, message } = await c.req.json();

    if (!title || !message) {
      return c.json({ error: 'Title and message are required' }, 400);
    }

    // Get all users
    const users = await c.env.DB.prepare('SELECT id, email, username FROM users').all();

    // In a real application, you would:
    // 1. Store notifications in a notifications table
    // 2. Send email notifications
    // 3. Send push notifications
    // For now, we'll just create notification records

    const timestamp = new Date().toISOString();
    
    // Create notification records for each user
    for (const user of users.results) {
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, created_at, is_read)
        VALUES (?, ?, ?, ?, 0)
      `).bind(user.id, title, message, timestamp).run();
    }

    return c.json({
      message: 'Notification sent successfully',
      recipient_count: users.results.length
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Send notification to specific users
notifications.post('/send', async (c) => {
  try {
    const { user_ids, title, message } = await c.req.json();

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return c.json({ error: 'user_ids array is required' }, 400);
    }

    if (!title || !message) {
      return c.json({ error: 'Title and message are required' }, 400);
    }

    const timestamp = new Date().toISOString();

    for (const userId of user_ids) {
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, created_at, is_read)
        VALUES (?, ?, ?, ?, 0)
      `).bind(userId, title, message, timestamp).run();
    }

    return c.json({
      message: 'Notification sent successfully',
      recipient_count: user_ids.length
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user's notifications
notifications.get('/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as UserPayload;

    const result = await c.env.DB.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(user.id).all();

    return c.json({ notifications: result.results || [] });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark notification as read
notifications.put('/:id/read', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const notificationId = c.req.param('id');

    await c.env.DB.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, user.id).run();

    return c.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default notifications;
