import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import { getUserById } from '../utils/db';

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
};

const invitations = new Hono<{ Bindings: Bindings }>();

// Generate random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create invitation link
invitations.post('/create', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { review_id } = await c.req.json();

    if (!review_id) {
      return c.json({ error: 'Review ID is required' }, 400);
    }

    // Check if review exists and user has access
    const review = await c.env.DB.prepare(
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?'
    ).bind(review_id, user.id).first();

    if (!review) {
      return c.json({ error: 'Review not found or access denied' }, 404);
    }

    // Generate unique token
    const token = generateToken();
    
    // Set expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Save invitation to database
    await c.env.DB.prepare(`
      INSERT INTO invitations (token, review_id, referrer_id, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(token, review_id, user.id, expiresAt.toISOString()).run();

    // Generate invitation URL
    const baseUrl = new URL(c.req.url).origin;
    const invitationUrl = `${baseUrl}/?invite=${token}`;

    return c.json({
      token,
      url: invitationUrl,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    return c.json({ error: 'Failed to create invitation' }, 500);
  }
});

// Send invitation email
invitations.post('/send-email', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { token, emails } = await c.req.json();

    if (!token || !emails || !Array.isArray(emails) || emails.length === 0) {
      return c.json({ error: 'Token and email addresses are required' }, 400);
    }

    // Verify token belongs to this user
    const invitation = await c.env.DB.prepare(
      'SELECT * FROM invitations WHERE token = ? AND referrer_id = ?'
    ).bind(token, user.id).first();

    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    // Get review details
    const review = await c.env.DB.prepare(
      'SELECT * FROM reviews WHERE id = ?'
    ).bind(invitation.review_id).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Generate invitation URL
    const baseUrl = new URL(c.req.url).origin;
    const invitationUrl = `${baseUrl}/?invite=${token}`;

    // Send email to each address
    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
      try {
        await sendEmail(
          c.env.RESEND_API_KEY || '',
          email,
          `${user.username} invites you to join Review System`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">You're invited to Review System!</h2>
              <p><strong>${user.username}</strong> has shared a review with you and invites you to join Review System.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Shared Review:</h3>
                <p style="font-size: 18px; color: #4f46e5;"><strong>${review.title}</strong></p>
              </div>

              <p>Click the link below to view the review and create your account:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Review & Join Now
                </a>
              </p>

              <p style="color: #6b7280; font-size: 14px;">
                This invitation link will expire in 30 days.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px;">
                If you have any questions, please contact us at support@review-system.com
              </p>
            </div>
          `,
          `${user.username} invites you to join Review System\n\nView the shared review and create your account: ${invitationUrl}\n\nThis link will expire in 30 days.`
        );
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
        failCount++;
      }
    }

    return c.json({
      message: `Sent ${successCount} email(s) successfully`,
      success_count: successCount,
      fail_count: failCount
    });
  } catch (error) {
    console.error('Send invitation email error:', error);
    return c.json({ error: 'Failed to send invitation emails' }, 500);
  }
});

// Verify invitation token and get review content
invitations.get('/verify/:token', async (c) => {
  try {
    const token = c.req.param('token');

    // Get invitation
    const invitation: any = await c.env.DB.prepare(
      'SELECT * FROM invitations WHERE token = ?'
    ).bind(token).first();

    if (!invitation) {
      return c.json({ error: 'Invalid invitation token' }, 404);
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return c.json({ error: 'Invitation has expired' }, 410);
    }

    // Get review details
    const review: any = await c.env.DB.prepare(`
      SELECT r.*, u.username as creator_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).bind(invitation.review_id).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Get review answers
    const answers = await c.env.DB.prepare(`
      SELECT ra.*, tq.question_text, tq.question_text_en, tq.question_number
      FROM review_answers ra
      LEFT JOIN template_questions tq ON ra.question_number = tq.question_number
      WHERE ra.review_id = ?
      ORDER BY ra.question_number
    `).bind(invitation.review_id).all();

    // Get referrer info
    const referrer = await getUserById(c.env.DB, invitation.referrer_id);

    return c.json({
      review: {
        id: review.id,
        title: review.title,
        description: review.description,
        creator_name: review.creator_name,
        created_at: review.created_at
      },
      answers: answers.results || [],
      referrer: referrer ? {
        id: referrer.id,
        username: referrer.username
      } : null,
      token: token
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    return c.json({ error: 'Failed to verify invitation' }, 500);
  }
});

export default invitations;
