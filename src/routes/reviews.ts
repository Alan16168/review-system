import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { UserPayload } from '../utils/auth';
import { 
  getTeamReviewAnswers, 
  saveMyTeamAnswer, 
  deleteTeamAnswer,
  getTeamAnswerCompletionStatus 
} from '../utils/db';

type Bindings = {
  DB: D1Database;
};

const reviews = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
reviews.use('/*', authMiddleware);

// Get all reviews (personal and team reviews the user has access to)
reviews.get('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;

    // Get personal reviews and team reviews
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name, t.name as team_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN review_collaborators rc ON r.id = rc.review_id
      WHERE r.user_id = ? 
         OR rc.user_id = ?
         OR (r.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?))
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).bind(user.id, user.id, user.id).all();

    return c.json({ reviews: result.results || [] });
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

    const query = `
      SELECT r.*, u.username as creator_name, t.name as team_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN teams t ON r.team_id = t.id
      WHERE r.id = ? AND (
        r.user_id = ? 
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?)
      )
    `;

    const review = await c.env.DB.prepare(query).bind(reviewId, user.id, user.id, user.id).first();

    if (!review) {
      return c.json({ error: 'Review not found or access denied' }, 404);
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
      review,
      collaborators: collaborators.results || []
    });
  } catch (error) {
    console.error('Get review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create review
reviews.post('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const body = await c.req.json();
    const { title, team_id, group_type, time_type, ...questions } = body;

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
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

    const result = await c.env.DB.prepare(`
      INSERT INTO reviews (
        title, user_id, team_id, group_type, time_type,
        question1, question2, question3, question4, question5,
        question6, question7, question8, question9, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, user.id, team_id || null,
      group_type || 'personal',
      time_type || 'daily',
      questions.question1 || null,
      questions.question2 || null,
      questions.question3 || null,
      questions.question4 || null,
      questions.question5 || null,
      questions.question6 || null,
      questions.question7 || null,
      questions.question8 || null,
      questions.question9 || null,
      questions.status || 'draft'
    ).run();

    const reviewId = result.meta.last_row_id;

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

    // Check if user has edit permission
    // Creator can always edit
    // Collaborators with can_edit=1 can edit
    // Team members with 'creator' or 'operator' role can edit
    const checkQuery = `
      SELECT 1 FROM reviews r
      LEFT JOIN review_collaborators rc ON r.id = rc.review_id
      LEFT JOIN team_members tm ON r.team_id = tm.team_id AND tm.user_id = ?
      WHERE r.id = ? AND (
        r.user_id = ?
        OR (rc.user_id = ? AND rc.can_edit = 1)
        OR (tm.user_id = ? AND tm.role IN ('creator', 'operator'))
      )
    `;
    const hasPermission = await c.env.DB.prepare(checkQuery)
      .bind(user.id, reviewId, user.id, user.id, user.id).first();

    if (!hasPermission) {
      return c.json({ error: 'Access denied. You need creator or operator role to edit.' }, 403);
    }

    const { title, group_type, time_type, ...questions } = body;
    
    await c.env.DB.prepare(`
      UPDATE reviews SET
        title = COALESCE(?, title),
        group_type = COALESCE(?, group_type),
        time_type = COALESCE(?, time_type),
        question1 = COALESCE(?, question1),
        question2 = COALESCE(?, question2),
        question3 = COALESCE(?, question3),
        question4 = COALESCE(?, question4),
        question5 = COALESCE(?, question5),
        question6 = COALESCE(?, question6),
        question7 = COALESCE(?, question7),
        question8 = COALESCE(?, question8),
        question9 = COALESCE(?, question9),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title || null,
      group_type || null,
      time_type || null,
      questions.question1 || null,
      questions.question2 || null,
      questions.question3 || null,
      questions.question4 || null,
      questions.question5 || null,
      questions.question6 || null,
      questions.question7 || null,
      questions.question8 || null,
      questions.question9 || null,
      questions.status || null,
      reviewId
    ).run();

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

    // Only review creator or team creator can delete
    const checkQuery = `
      SELECT r.* FROM reviews r
      LEFT JOIN team_members tm ON r.team_id = tm.team_id AND tm.user_id = ?
      WHERE r.id = ? AND (
        r.user_id = ?
        OR (tm.user_id = ? AND tm.role = 'creator')
      )
    `;
    const review = await c.env.DB.prepare(checkQuery)
      .bind(user.id, reviewId, user.id, user.id).first();

    if (!review) {
      return c.json({ error: 'Access denied. Only review creator or team creator can delete.' }, 404);
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
 * GET /api/reviews/:id/team-answers
 * Get all team members' answers for a review
 */
reviews.get('/:id/team-answers', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));

    // Check if user has access to this review
    const accessQuery = `
      SELECT 1 FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ? 
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?)
      )
    `;
    const hasAccess = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get all team answers
    const answers = await getTeamReviewAnswers(c.env.DB, reviewId);
    
    // Get completion status
    const completionStatus = await getTeamAnswerCompletionStatus(c.env.DB, reviewId);

    // Group answers by question
    const answersByQuestion: {[key: number]: any[]} = {};
    for (let i = 1; i <= 9; i++) {
      answersByQuestion[i] = [];
    }

    answers.forEach(answer => {
      answersByQuestion[answer.question_number].push({
        user_id: answer.user_id,
        username: answer.username,
        email: answer.email,
        answer: answer.answer,
        updated_at: answer.updated_at
      });
    });

    return c.json({ 
      answersByQuestion,
      completionStatus,
      currentUserId: user.id
    });
  } catch (error) {
    console.error('Get team answers error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /api/reviews/:id/my-answer/:questionNumber
 * Save or update current user's answer for a specific question
 */
reviews.put('/:id/my-answer/:questionNumber', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));
    const questionNumber = parseInt(c.req.param('questionNumber'));
    const { answer } = await c.req.json();

    if (!answer || answer.trim() === '') {
      return c.json({ error: 'Answer cannot be empty' }, 400);
    }

    if (questionNumber < 1 || questionNumber > 9) {
      return c.json({ error: 'Invalid question number' }, 400);
    }

    // Check if user has access to this review
    const accessQuery = `
      SELECT 1 FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ? 
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?)
      )
    `;
    const hasAccess = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Save the answer
    await saveMyTeamAnswer(c.env.DB, reviewId, user.id, questionNumber, answer);

    return c.json({ message: 'Answer saved successfully' });
  } catch (error) {
    console.error('Save team answer error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/reviews/:id/answer/:userId/:questionNumber
 * Delete a user's answer (owner only)
 */
reviews.delete('/:id/answer/:userId/:questionNumber', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));
    const targetUserId = parseInt(c.req.param('userId'));
    const questionNumber = parseInt(c.req.param('questionNumber'));

    // Check if current user is the review owner
    const review = await c.env.DB.prepare(
      'SELECT user_id FROM reviews WHERE id = ?'
    ).bind(reviewId).first<{user_id: number}>();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    if (review.user_id !== user.id) {
      return c.json({ error: 'Only the review owner can delete others\' answers' }, 403);
    }

    // Delete the answer
    await deleteTeamAnswer(c.env.DB, reviewId, targetUserId, questionNumber);

    return c.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete team answer error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default reviews;
