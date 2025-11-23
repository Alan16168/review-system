import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { UserPayload } from '../utils/auth';
import { 
  getReviewAnswers, 
  saveMyAnswer, 
  deleteAnswer,
  deleteAnswerById,
  getAnswerCompletionStatus 
} from '../utils/db';

type Bindings = {
  DB: D1Database;
};

const reviews = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
reviews.use('/*', authMiddleware);

// Get public reviews (owner_type='public' or 'team')
// Note: 'team' owner_type reviews are only visible to team members
reviews.get('/public', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name, t.name as team_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN teams t ON r.team_id = t.id
      WHERE r.owner_type IN ('public', 'team')
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    const allReviews = result.results || [];
    
    // Filter reviews based on ownership and team membership
    const filteredReviews = await Promise.all(
      allReviews.map(async (review: any) => {
        // If owner_type is 'team', check team membership
        if (review.owner_type === 'team' && review.team_id) {
          // Check if current user is a member of this team
          const memberCheck = await c.env.DB.prepare(`
            SELECT 1 FROM team_members 
            WHERE team_id = ? AND user_id = ?
          `).bind(review.team_id, user.id).first();
          
          // Only include if user is a team member
          if (memberCheck) {
            review.is_team_member = true;
            return review;
          } else {
            return null; // Filter out - user is not a team member
          }
        } else {
          // owner_type is 'public' - visible to everyone
          review.is_team_member = false;
          return review;
        }
      })
    );

    // Remove null entries (filtered out team reviews)
    const accessibleReviews = filteredReviews.filter(r => r !== null);

    return c.json({ reviews: accessibleReviews });
  } catch (error) {
    console.error('Get public reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Famous Books Reviews (Premium feature)
reviews.get('/famous-books', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check if user has premium subscription (not free)
    if (!user.subscription_tier || user.subscription_tier === 'free') {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.review_type = 'famous-book'
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    const reviews = result.results || [];

    return c.json({ reviews });
  } catch (error) {
    console.error('Get famous books reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Documents Reviews (Premium feature)
reviews.get('/documents', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check if user has premium subscription (not free)
    if (!user.subscription_tier || user.subscription_tier === 'free') {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.review_type = 'document'
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    const reviews = result.results || [];

    return c.json({ reviews });
  } catch (error) {
    console.error('Get documents reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Helper function to get language from request
function getLanguage(c: any): string {
  // Try X-Language header first
  const xLanguage = c.req.header('X-Language');
  if (xLanguage && (xLanguage === 'en' || xLanguage === 'zh')) {
    return xLanguage;
  }
  
  // Try Accept-Language header
  const acceptLanguage = c.req.header('Accept-Language') || '';
  if (acceptLanguage.includes('zh')) {
    return 'zh';
  }
  
  // Default to English
  return 'en';
}

// Get all reviews (personal and team reviews the user has access to)
// Note: This endpoint returns "My Reviews" - reviews created by user or their team reviews
// Public reviews are excluded and should be accessed via /api/reviews/public endpoint
reviews.get('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;

    // Get reviews based on access control:
    // 1. Reviews created by the user (including public ones)
    // 2. Non-public reviews where user is a team member (has team_id and user is in that team)
    // 3. Non-public reviews where user is a collaborator
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name, t.name as team_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN review_collaborators rc ON r.id = rc.review_id
      WHERE (
        r.user_id = ?
        OR (r.owner_type != 'public' AND r.team_id IS NOT NULL AND r.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?))
        OR (r.owner_type != 'public' AND rc.user_id = ?)
      )
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).bind(user.id, user.id, user.id).all();
    const reviews = result.results || [];

    // For each review with team_id, check if current user is a team member
    const reviewsWithMembership = await Promise.all(
      reviews.map(async (review: any) => {
        if (review.team_id) {
          // Check if current user is a member of this team
          const memberCheck = await c.env.DB.prepare(`
            SELECT 1 FROM team_members 
            WHERE team_id = ? AND user_id = ?
          `).bind(review.team_id, user.id).first();
          
          review.is_team_member = !!memberCheck;
        } else {
          review.is_team_member = false;
        }
        return review;
      })
    );

    return c.json({ reviews: reviewsWithMembership });
  } catch (error) {
    console.error('Get reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single review
reviews.get('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');
    const lang = getLanguage(c);

    console.log('[GET REVIEW] Starting request:', { reviewId, userId: user.id, lang });

    const query = `
      SELECT r.*, u.username as creator_name, t.name as team_name, 
             tp.name as template_name,
             tp.description as template_description
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN templates tp ON r.template_id = tp.id
      WHERE r.id = ? AND (
        r.user_id = ?
        OR (r.team_id IS NOT NULL AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
        OR (r.owner_type = 'public')
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
      )
    `;

    console.log('[GET REVIEW] Executing main query...');
    const review: any = await c.env.DB.prepare(query).bind(reviewId, user.id, user.id, user.id).first();
    console.log('[GET REVIEW] Main query result:', review ? 'Found' : 'Not found');

    if (!review) {
      return c.json({ error: 'Review not found or access denied' }, 404);
    }

    // Get template questions with language-specific text and question type info
    console.log('[GET REVIEW] Fetching template questions for template_id:', review.template_id);
    const questionsResult = await c.env.DB.prepare(`
      SELECT 
        question_number,
        question_text,
        question_type,
        options,
        correct_answer,
        answer_length,
        datetime_value,
        datetime_title,
        datetime_answer_max_length,
        owner,
        required
      FROM template_questions
      WHERE template_id = ?
      ORDER BY question_number ASC
    `).bind(review.template_id).all();
    console.log('[GET REVIEW] Questions fetched:', questionsResult.results?.length || 0);

    // Get review answers with user information (support multiple answers per question)
    // Updated to work with new answer_sets structure
    console.log('[GET REVIEW] Fetching review answers...');
    const answersResult = await c.env.DB.prepare(`
      SELECT ra.id, ra.question_number, ra.answer, 
             ra.datetime_value, ra.datetime_title, ra.datetime_answer,
             ras.user_id, u.username, u.email, 
             ra.created_at, ra.updated_at
      FROM review_answers ra
      JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
      JOIN users u ON ras.user_id = u.id
      WHERE ras.review_id = ?
      ORDER BY ra.question_number ASC, ras.set_number ASC, ra.created_at ASC
    `).bind(reviewId).all();
    console.log('[GET REVIEW] Answers fetched:', answersResult.results?.length || 0);

    // Group answers by question number
    const answersByQuestion: Record<number, any[]> = {};
    (answersResult.results || []).forEach((ans: any) => {
      if (!answersByQuestion[ans.question_number]) {
        answersByQuestion[ans.question_number] = [];
      }
      answersByQuestion[ans.question_number].push({
        id: ans.id,
        user_id: ans.user_id,
        username: ans.username,
        email: ans.email,
        answer: ans.answer,
        created_at: ans.created_at,
        updated_at: ans.updated_at,
        is_mine: ans.user_id === user.id
      });
    });

    // Check if current user is a team member
    let is_team_member = false;
    if (review.team_id) {
      const memberCheck = await c.env.DB.prepare(`
        SELECT 1 FROM team_members 
        WHERE team_id = ? AND user_id = ?
      `).bind(review.team_id, user.id).first();
      is_team_member = !!memberCheck;
    }

    // Get collaborators
    const collabQuery = `
      SELECT u.id, u.username, u.email, rc.can_edit
      FROM review_collaborators rc
      JOIN users u ON rc.user_id = u.id
      WHERE rc.review_id = ?
    `;
    const collaborators = await c.env.DB.prepare(collabQuery).bind(reviewId).all();

    return c.json({ 
      review: {
        ...review,
        is_team_member
      },
      questions: questionsResult.results || [],
      answersByQuestion,
      collaborators: collaborators.results || []
    });
  } catch (error) {
    console.error('[DETAILED ERROR] Get review error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reviewId: c.req.param('id'),
      userId: (c.get('user') as UserPayload)?.id,
      timestamp: new Date().toISOString()
    });
    return c.json({ 
      error: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : String(error),
        reviewId: c.req.param('id')
      } : undefined
    }, 500);
  }
});

// Create review
reviews.post('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const body = await c.req.json();
    const { title, description, team_id, time_type, template_id, answers, status, owner_type, scheduled_at, location, reminder_minutes } = body;

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Validate template_id - default to 1 if not provided
    const templateIdToUse = template_id || 1;
    const template = await c.env.DB.prepare(
      'SELECT id FROM templates WHERE id = ? AND is_active = 1'
    ).bind(templateIdToUse).first();

    if (!template) {
      return c.json({ error: 'Invalid template' }, 400);
    }

    // If team_id provided, check if user is a member
    if (team_id) {
      const isMember = await c.env.DB.prepare(
        'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?'
      ).bind(team_id, user.id).first();

      if (!isMember) {
        return c.json({ error: 'You are not a member of this team' }, 403);
      }
    }

    // Validate owner_type
    let ownerType = owner_type || 'private';
    if (!['private', 'team', 'public'].includes(ownerType)) {
      ownerType = 'private';
    }
    // If owner_type is 'team' but no team_id, force to 'private'
    if (ownerType === 'team' && !team_id) {
      ownerType = 'private';
    }

    // Create review with template_id, owner_type, and calendar fields
    const result = await c.env.DB.prepare(`
      INSERT INTO reviews (
        title, description, user_id, team_id, time_type,
        template_id, status, owner_type, scheduled_at, location, reminder_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, description || null, user.id, team_id || null,
      time_type || 'daily',
      templateIdToUse,
      status || 'draft',
      ownerType,
      scheduled_at || null,
      location || null,
      reminder_minutes || 60
    ).run();

    const reviewId = result.meta.last_row_id;

    // Save answers if provided (with user_id)
    // Support both single answers (string) and multiple answers (array)
    // Use saveMyAnswer utility which handles answer_set_id properly
    if (answers && typeof answers === 'object') {
      for (const [questionNumber, answer] of Object.entries(answers)) {
        // Handle array of answers (multiple text answers for same question)
        if (Array.isArray(answer)) {
          for (const singleAnswer of answer) {
            const answerText = String(singleAnswer).trim();
            if (answerText) {
              await saveMyAnswer(c.env.DB, reviewId as number, user.id, parseInt(questionNumber), answerText);
            }
          }
        } else if (answer && String(answer).trim()) {
          // Handle single answer (string)
          await saveMyAnswer(c.env.DB, reviewId as number, user.id, parseInt(questionNumber), String(answer));
        }
      }
    }

    // If it's a team review, add creator as collaborator
    if (team_id) {
      await c.env.DB.prepare(
        'INSERT INTO review_collaborators (review_id, user_id, can_edit) VALUES (?, ?, 1)'
      ).bind(reviewId, user.id).run();
    }

    return c.json({ 
      id: reviewId,
      message: 'Review created successfully'
    }, 201);
  } catch (error) {
    console.error('Create review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update review
reviews.put('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');
    const body = await c.req.json();

    // Check if user has access to this review
    const reviewQuery = `
      SELECT r.user_id, r.owner_type, r.team_id FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ?
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR (r.team_id IS NOT NULL AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
      )
    `;
    const review: any = await c.env.DB.prepare(reviewQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!review) {
      return c.json({ error: 'Access denied. You do not have permission to access this review.' }, 403);
    }

    const { title, description, time_type, answers, status, owner_type, scheduled_at, location, reminder_minutes } = body;
    
    // Check if user is the creator or admin
    const isCreator = review.user_id === user.id;
    const isAdmin = user.role === 'admin';
    const canModifyBasicProperties = isCreator || isAdmin;

    // Update basic properties if user is creator or admin
    if (canModifyBasicProperties && (title || description || time_type || status || owner_type || scheduled_at !== undefined || location !== undefined || reminder_minutes !== undefined)) {
      // Validate owner_type if provided
      let validOwnerType = null;
      if (owner_type) {
        if (['private', 'team', 'public'].includes(owner_type)) {
          validOwnerType = owner_type;
        }
      }

      await c.env.DB.prepare(`
        UPDATE reviews SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          time_type = COALESCE(?, time_type),
          status = COALESCE(?, status),
          owner_type = COALESCE(?, owner_type),
          scheduled_at = COALESCE(?, scheduled_at),
          location = COALESCE(?, location),
          reminder_minutes = COALESCE(?, reminder_minutes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        title || null,
        description || null,
        time_type || null,
        status || null,
        validOwnerType,
        scheduled_at !== undefined ? scheduled_at : null,
        location !== undefined ? location : null,
        reminder_minutes !== undefined ? reminder_minutes : null,
        reviewId
      ).run();
    }

    // Update answers for choice-type questions and multiple text answers
    // Note: Single text-type answers in edit mode are managed through POST /my-answer/:questionNumber endpoint
    // But during creation/draft save, we support multiple text answers as arrays
    // Use saveMyAnswer and deleteAnswer utilities which handle answer_set_id properly
    if (answers && typeof answers === 'object') {
      for (const [questionNumber, answer] of Object.entries(answers)) {
        const qNum = parseInt(questionNumber);
        
        // Handle array of answers (multiple text answers for same question)
        if (Array.isArray(answer)) {
          // Delete existing answers for this question first
          await deleteAnswer(c.env.DB, parseInt(reviewId), user.id, qNum);
          
          // Insert all new answers
          for (const singleAnswer of answer) {
            const answerText = String(singleAnswer).trim();
            if (answerText) {
              await saveMyAnswer(c.env.DB, parseInt(reviewId), user.id, qNum, answerText);
            }
          }
        } else {
          // Handle single answer (string) - for choice-type questions
          const answerText = answer ? String(answer).trim() : '';
          
          if (answerText) {
            // For choice-type questions, delete and recreate the answer
            // This is simpler than checking existence and updating
            await deleteAnswer(c.env.DB, parseInt(reviewId), user.id, qNum);
            await saveMyAnswer(c.env.DB, parseInt(reviewId), user.id, qNum, answerText);
          } else {
            // Delete all answers for this question if empty (for choice-type questions)
            await deleteAnswer(c.env.DB, parseInt(reviewId), user.id, qNum);
          }
        }
      }
    }

    return c.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete review
reviews.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');

    // Get review information
    const review: any = await c.env.DB.prepare('SELECT * FROM reviews WHERE id = ?').bind(reviewId).first();
    
    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Permission check:
    // 1. Admin (role='admin') can delete any review
    // 2. Review creator can delete their own review
    // 3. Team creator can delete team reviews
    let hasPermission = false;
    
    // Check if user is admin
    if (user.role === 'admin') {
      hasPermission = true;
    }
    // Check if user is the review creator
    else if (review.user_id === user.id) {
      hasPermission = true;
    }
    // Check if user is team creator (for team reviews)
    else if (review.team_id) {
      const teamMember: any = await c.env.DB.prepare(
        'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?'
      ).bind(review.team_id, user.id).first();
      
      if (teamMember && teamMember.role === 'creator') {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return c.json({ error: 'Access denied. Only review creator, team creator, or admin can delete.' }, 403);
    }

    await c.env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(reviewId).run();

    return c.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add collaborator to review
reviews.post('/:id/collaborators', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');
    const { user_id, can_edit } = await c.req.json();

    // Check if current user is the creator
    const review = await c.env.DB.prepare(
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?'
    ).bind(reviewId, user.id).first();

    if (!review) {
      return c.json({ error: 'Only creator can add collaborators' }, 403);
    }

    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO review_collaborators (review_id, user_id, can_edit) VALUES (?, ?, ?)'
    ).bind(reviewId, user_id, can_edit ? 1 : 0).run();

    return c.json({ message: 'Collaborator added successfully' });
  } catch (error) {
    console.error('Add collaborator error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== Team Review Collaboration Endpoints ====================

/**
 * GET /api/reviews/:id/all-answers
 * Get all users' answers for a review (replaces team-answers)
 */
reviews.get('/:id/all-answers', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));

    // Check if user has access to this review based on owner_type
    const accessQuery = `
      SELECT 1 FROM reviews r
      WHERE r.id = ? AND (
        (r.owner_type = 'private' AND r.user_id = ?)
        OR (r.owner_type = 'team' AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
        OR (r.owner_type = 'public')
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
      )
    `;
    const hasAccess = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get all answers
    const answers = await getReviewAnswers(c.env.DB, reviewId);
    
    // Get completion status
    const completionStatus = await getAnswerCompletionStatus(c.env.DB, reviewId);

    // Group answers by question
    const answersByQuestion: {[key: number]: any[]} = {};
    for (let i = 1; i <= 20; i++) { // Support up to 20 questions
      answersByQuestion[i] = [];
    }

    answers.forEach(answer => {
      answersByQuestion[answer.question_number].push({
        id: answer.id,
        user_id: answer.user_id,
        username: answer.username,
        email: answer.email,
        answer: answer.answer,
        created_at: answer.created_at,
        updated_at: answer.updated_at,
        is_mine: answer.user_id === user.id
      });
    });

    return c.json({ 
      answersByQuestion,
      completionStatus,
      currentUserId: user.id
    });
  } catch (error) {
    console.error('Get all answers error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/reviews/:id/my-answer/:questionNumber
 * Create a new answer for current user (supports multiple answers per question)
 */
reviews.post('/:id/my-answer/:questionNumber', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));
    const questionNumber = parseInt(c.req.param('questionNumber'));
    const { answer } = await c.req.json();

    if (!answer || answer.trim() === '') {
      return c.json({ error: 'Answer cannot be empty' }, 400);
    }

    if (questionNumber < 1) {
      return c.json({ error: 'Invalid question number' }, 400);
    }

    // Check if user has access to this review and can contribute
    const accessQuery = `
      SELECT r.owner_type, r.team_id, r.user_id FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ?
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR (r.owner_type = 'team' AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
      )
    `;
    const review: any = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!review) {
      return c.json({ error: 'Access denied. You cannot contribute to this review.' }, 403);
    }

    // Create new answer (always INSERT, never UPDATE)
    const answerId = await saveMyAnswer(c.env.DB, reviewId, user.id, questionNumber, answer);

    // Get the created answer with timestamp
    const newAnswer: any = await c.env.DB.prepare(`
      SELECT ra.id, ra.created_at, ra.updated_at, ras.user_id, u.username, u.email
      FROM review_answers ra
      JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
      JOIN users u ON ras.user_id = u.id
      WHERE ra.id = ?
    `).bind(answerId).first();

    return c.json({ 
      message: 'Answer created successfully',
      answer: {
        id: newAnswer.id,
        user_id: user.id,
        username: newAnswer.username,
        email: newAnswer.email,
        answer: answer,
        created_at: newAnswer.created_at,
        updated_at: newAnswer.updated_at,
        is_mine: true
      }
    });
  } catch (error) {
    console.error('Create answer error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/reviews/:id/answer/:answerId
 * Delete a specific answer by ID (user can only delete their own answers)
 */
reviews.delete('/:id/answer/:answerId', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));
    const answerId = parseInt(c.req.param('answerId'));

    // Check if user has access to this review
    const accessQuery = `
      SELECT 1 FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ?
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR (r.owner_type = 'team' AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
      )
    `;
    const hasAccess = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Verify the answer belongs to this review
    const answerCheck: any = await c.env.DB.prepare(`
      SELECT ras.review_id
      FROM review_answers ra
      JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
      WHERE ra.id = ?
    `).bind(answerId).first();

    if (!answerCheck || answerCheck.review_id !== reviewId) {
      return c.json({ error: 'Answer not found in this review' }, 404);
    }

    // Delete answer by ID (only if it belongs to current user)
    const deleted = await deleteAnswerById(c.env.DB, answerId, user.id);

    if (!deleted) {
      return c.json({ error: 'Answer not found or access denied' }, 404);
    }

    return c.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/reviews/:id/my-answer/:questionNumber
 * Delete current user's own answer (legacy endpoint - kept for backwards compatibility)
 */
reviews.delete('/:id/my-answer/:questionNumber', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));
    const questionNumber = parseInt(c.req.param('questionNumber'));

    // Check if user has access to this review
    const accessQuery = `
      SELECT 1 FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ?
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR (r.owner_type = 'team' AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
      )
    `;
    const hasAccess = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Delete current user's answer only
    await deleteAnswer(c.env.DB, reviewId, user.id, questionNumber);

    return c.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default reviews;
