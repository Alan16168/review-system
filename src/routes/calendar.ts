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
    
    // Parse reviewId to integer
    const reviewIdInt = parseInt(reviewId, 10);
    if (isNaN(reviewIdInt)) {
      return c.json({ error: 'Invalid review ID' }, 400);
    }

    // Fetch review with calendar fields - SIMPLIFIED
    const review = await c.env.DB.prepare(
      'SELECT id, title, description, scheduled_at, location, reminder_minutes, user_id FROM reviews WHERE id = ?'
    ).bind(reviewIdInt).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // TODO: Add proper permission check later
    // For now, allow all authenticated users to generate calendar links
    // const reviewUserId = Number(review.user_id);
    // const currentUserId = Number(userId);
    // if (reviewUserId !== currentUserId) {
    //   return c.json({ error: 'Access denied' }, 403);
    // }

    // Check if scheduled_at is set
    if (!review.scheduled_at) {
      return c.json({ 
        error: 'No scheduled time set for this review',
        message: 'Please set a scheduled time first'
      }, 400);
    }

    // Generate Google Calendar URL with safe type conversions
    const calendarUrl = generateGoogleCalendarUrl({
      title: String(review.title || 'Untitled'),
      description: String(review.description || ''),
      startTime: String(review.scheduled_at),
      location: String(review.location || ''),
      reminderMinutes: Number(review.reminder_minutes) || 60
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

  } catch (err) {
    return c.json({ 
      error: 'Failed to generate calendar link',
      message: 'An internal error occurred'
    }, 500);
  }
});

/**
 * Check if user has access to the review
 */
async function checkReviewAccess(db: D1Database, reviewId: string, userId: number): Promise<boolean> {
  try {
    console.log('checkReviewAccess called with:', { reviewId, userId, reviewIdType: typeof reviewId, userIdType: typeof userId });
    
    // Convert reviewId to integer
    const reviewIdInt = parseInt(reviewId);
    console.log('reviewIdInt:', reviewIdInt);
    
    // Check if user is creator
    console.log('Checking if user is creator...');
    const review = await db.prepare('SELECT user_id, team_id FROM reviews WHERE id = ?')
      .bind(reviewIdInt).first();
    
    console.log('Review data:', review);
    
    if (!review) return false;
    if (review.user_id === userId) return true;

    // Check if user is team member
    if (review.team_id !== null && review.team_id !== undefined) {
      console.log('Checking team membership for team_id:', review.team_id);
      const member = await db.prepare(
        'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
      ).bind(review.team_id, userId).first();
      if (member) return true;
    }

    // Check if user is collaborator
    console.log('Checking if user is collaborator...');
    const collaborator = await db.prepare(
      'SELECT id FROM review_collaborators WHERE review_id = ? AND user_id = ?'
    ).bind(reviewIdInt, userId).first();
    
    console.log('Collaborator check result:', collaborator);
    
    return !!collaborator;
  } catch (error: any) {
    console.error('Error in checkReviewAccess:', error);
    console.error('Error details:', { message: error.message, stack: error.stack });
    throw error;
  }
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
  
  try {
    // Normalize the date string - add seconds if missing
    // Handle both "YYYY-MM-DDTHH:mm" and "YYYY-MM-DDTHH:mm:ss" formats
    let normalizedTime = params.startTime;
    
    // Count colons to determine if seconds are present
    const colonCount = (normalizedTime.match(/:/g) || []).length;
    if (colonCount === 1) {
      // Format is "YYYY-MM-DDTHH:mm", add seconds
      normalizedTime = normalizedTime + ':00';
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (!dateRegex.test(normalizedTime)) {
      throw new Error(`Invalid date format: ${params.startTime} (normalized: ${normalizedTime})`);
    }
    
    // CRITICAL: DO NOT use new Date() to avoid timezone conversion
    // User input is local time, we need to keep it as-is for Google Calendar
    // Google Calendar will interpret the time in user's local timezone
    
    // Format: YYYYMMDDTHHmmss (WITHOUT 'Z' suffix - this means local time)
    const formatLocalTimeForGoogle = (dateTimeStr: string): string => {
      // Input: "YYYY-MM-DDTHH:mm:ss"
      // Output: "YYYYMMDDTHHmmss"
      return dateTimeStr.replace(/[-:]/g, '').replace('T', 'T');
    };
    
    const startTimeFormatted = formatLocalTimeForGoogle(normalizedTime);
    
    // Calculate end time (1 hour later)
    // Parse the time components
    const year = parseInt(normalizedTime.substring(0, 4));
    const month = parseInt(normalizedTime.substring(5, 7));
    const day = parseInt(normalizedTime.substring(8, 10));
    const hour = parseInt(normalizedTime.substring(11, 13));
    const minute = parseInt(normalizedTime.substring(14, 16));
    const second = parseInt(normalizedTime.substring(17, 19));
    
    // Create date object in UTC to avoid timezone issues during calculation
    const startDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    // Format end time back to local format
    const pad = (num: number) => String(num).padStart(2, '0');
    const endTimeFormatted = 
      `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}` +
      `T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}${pad(endDate.getUTCSeconds())}`;
    
    const dates = `${startTimeFormatted}/${endTimeFormatted}`;
    
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
  } catch (error: any) {
    console.error('Error in generateGoogleCalendarUrl:', error);
    console.error('Input params:', JSON.stringify(params, null, 2));
    throw error;
  }
}

export default calendar;
