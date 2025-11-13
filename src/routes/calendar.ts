import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

const calendar = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware to all calendar routes
calendar.use('/*', authMiddleware);

/**
 * Generate Google Calendar link for a review
 * GET /api/calendar/link/:reviewId
 */
calendar.get('/link/:reviewId', async (c: Context) => {
  try {
    const reviewId = c.req.param('reviewId');
    const userId = c.get('userId');

    // Fetch review with calendar fields
    const review = await c.env.DB.prepare(`
      SELECT 
        r.id, r.title, r.description, r.scheduled_at, 
        r.location, r.reminder_minutes, r.user_id, r.team_id
      FROM reviews r
      WHERE r.id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Check access permission
    const hasAccess = await checkReviewAccess(c.env.DB, reviewId, userId);
    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Check if scheduled_at is set
    if (!review.scheduled_at) {
      return c.json({ 
        error: 'No scheduled time set for this review',
        message: 'Please set a scheduled time first'
      }, 400);
    }

    // Generate Google Calendar URL
    const calendarUrl = generateGoogleCalendarUrl({
      title: review.title as string,
      description: review.description as string || '',
      startTime: review.scheduled_at as string,
      location: review.location as string || '',
      reminderMinutes: review.reminder_minutes as number || 60
    });

    return c.json({
      url: calendarUrl,
      review: {
        id: review.id,
        title: review.title,
        scheduled_at: review.scheduled_at,
        location: review.location
      }
    });

  } catch (error: any) {
    console.error('Error generating calendar link:', error);
    return c.json({ error: 'Failed to generate calendar link', details: error.message }, 500);
  }
});

/**
 * Check if user has access to the review
 */
async function checkReviewAccess(db: D1Database, reviewId: string, userId: number): Promise<boolean> {
  // Check if user is creator
  const review = await db.prepare('SELECT user_id, team_id FROM reviews WHERE id = ?')
    .bind(reviewId).first();
  
  if (!review) return false;
  if (review.user_id === userId) return true;

  // Check if user is team member
  if (review.team_id) {
    const member = await db.prepare(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(review.team_id, userId).first();
    if (member) return true;
  }

  // Check if user is collaborator
  const collaborator = await db.prepare(
    'SELECT id FROM review_collaborators WHERE review_id = ? AND user_id = ?'
  ).bind(reviewId, userId).first();
  
  return !!collaborator;
}

/**
 * Generate Google Calendar URL
 * Reference: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
 */
function generateGoogleCalendarUrl(params: {
  title: string;
  description: string;
  startTime: string;
  location: string;
  reminderMinutes: number;
}): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  
  // Parse scheduled_at (assume ISO format from database)
  const startDate = new Date(params.startTime);
  
  // Default duration: 1 hour
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  
  // Format dates to Google Calendar format: YYYYMMDDTHHmmssZ
  const formatDateForGoogle = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const dates = `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`;
  
  // Build URL parameters
  const urlParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: dates,
    details: params.description,
    location: params.location || '',
    // Google Calendar reminder format (not officially documented, but works)
    // Note: Reminders are set by user preferences in Google Calendar
  });
  
  return `${baseUrl}?${urlParams.toString()}`;
}

export default calendar;
