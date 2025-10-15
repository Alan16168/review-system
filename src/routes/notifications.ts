import { Hono } from 'hono';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { UserPayload } from '../utils/auth';
import { sendEmail } from '../utils/email';

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
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

    // Check if Resend API key is configured
    if (!c.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return c.json({ 
        error: 'Email service not configured',
        debug: 'RESEND_API_KEY is missing'
      }, 500);
    }

    // Get all users
    const users = await c.env.DB.prepare('SELECT id, email, username FROM users').all();

    const timestamp = new Date().toISOString();
    let emailsSent = 0;
    let emailsFailed = 0;
    const emailResults: any[] = [];
    
    // Create notification records and send emails
    for (const user of users.results as any[]) {
      // Create notification record in database
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, created_at, is_read)
        VALUES (?, ?, ?, ?, 0)
      `).bind(user.id, title, message, timestamp).run();

      // Send email notification
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📢 ${title}</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p>Best regards,<br><strong>Review System Team</strong></p>
          </div>
          <div class="footer">
            <p>Review System - <a href="https://review-system.pages.dev">https://review-system.pages.dev</a></p>
            <p>&copy; 2025 Review System. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      console.log(`Sending email to: ${user.email} (${user.username})`);
      
      const emailSent = await sendEmail(c.env.RESEND_API_KEY, {
        to: user.email,
        subject: `[Review System] ${title}`,
        html: emailHtml,
        text: `${title}\n\nHi ${user.username},\n\n${message}\n\nBest regards,\nReview System Team`
      });

      emailResults.push({
        email: user.email,
        username: user.username,
        success: emailSent
      });

      if (emailSent) {
        emailsSent++;
        console.log(`✓ Email sent successfully to ${user.email}`);
      } else {
        emailsFailed++;
        console.error(`✗ Email failed to send to ${user.email}`);
      }
    }

    console.log('Broadcast notification completed:', {
      totalUsers: users.results.length,
      emailsSent,
      emailsFailed,
      details: emailResults
    });

    return c.json({
      message: 'Notification sent successfully',
      recipient_count: users.results.length,
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      email_details: emailResults
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
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

    // Check if Resend API key is configured
    if (!c.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return c.json({ 
        error: 'Email service not configured',
        debug: 'RESEND_API_KEY is missing'
      }, 500);
    }

    const timestamp = new Date().toISOString();
    let emailsSent = 0;
    let emailsFailed = 0;
    const emailResults: any[] = [];

    for (const userId of user_ids) {
      // Get user details
      const user = await c.env.DB.prepare(
        'SELECT id, email, username FROM users WHERE id = ?'
      ).bind(userId).first() as any;

      if (!user) {
        console.log(`User ${userId} not found, skipping`);
        emailResults.push({
          userId,
          email: 'not found',
          username: 'not found',
          success: false,
          reason: 'User not found'
        });
        continue;
      }

      // Create notification record
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, created_at, is_read)
        VALUES (?, ?, ?, ?, 0)
      `).bind(userId, title, message, timestamp).run();

      // Send email notification
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📢 ${title}</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p>Best regards,<br><strong>Review System Team</strong></p>
          </div>
          <div class="footer">
            <p>Review System - <a href="https://review-system.pages.dev">https://review-system.pages.dev</a></p>
            <p>&copy; 2025 Review System. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      console.log(`Sending email to: ${user.email} (${user.username})`);

      const emailSent = await sendEmail(c.env.RESEND_API_KEY, {
        to: user.email,
        subject: `[Review System] ${title}`,
        html: emailHtml,
        text: `${title}\n\nHi ${user.username},\n\n${message}\n\nBest regards,\nReview System Team`
      });

      emailResults.push({
        email: user.email,
        username: user.username,
        success: emailSent
      });

      if (emailSent) {
        emailsSent++;
        console.log(`✓ Email sent successfully to ${user.email}`);
      } else {
        emailsFailed++;
        console.error(`✗ Email failed to send to ${user.email}`);
      }
    }

    console.log('Send notification completed:', {
      targetUsers: user_ids.length,
      emailsSent,
      emailsFailed,
      details: emailResults
    });

    return c.json({
      message: 'Notification sent successfully',
      recipient_count: user_ids.length,
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      email_details: emailResults
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
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
